// 명령어: npm run trade
// TODO: 주기적으로 실행하는 코드 추가 예정
import 'dotenv/config'
import * as upbit from './upbit'
import { getCryptoNewsFromEnv } from './serpapi'
import { analyzeTradingDecisionFromEnv } from './trading-ai'
import { db } from '../db'
import { trades } from '../db/schema'
import { asc } from 'drizzle-orm'

// 거래 대상 코인 (리플 고정)
const COIN_SYMBOL = 'XRP'

// 최소 주문 금액 (KRW)
const MIN_ORDER_AMOUNT = 5000

// 수수료율 (0.3%)
const FEE_RATE = 0.003

// 초기 보유량에서 이 값만큼만 거래 가능하고, 나머지는 최소 보유량으로 유지
const MAX_COUNT_AMOUNT = parseInt(process.env.MAX_COUNT_AMOUNT || '0', 10)

// 코인 심볼을 마켓 형식으로 변환
function getMarketFromCoin(coinSymbol: string): string {
  return `KRW-${coinSymbol}`
}

// 거래 실행 함수
export async function executeTrade(): Promise<void> {
  console.log('거래 실행 시작... (거래소: UPBIT)\n')

  try {
    // 1. 리플(XRP)로 고정
    const coinSymbol = COIN_SYMBOL
    const market = getMarketFromCoin(coinSymbol)

    // 2. 리플(XRP) 뉴스 수집
    console.log('리플(XRP) 뉴스 수집 중...')
    const newsArticles = await getCryptoNewsFromEnv(coinSymbol)
    console.log(`리플 뉴스 ${newsArticles.length}개 수집 완료\n`)

    // 3. 리플(XRP) 차트 데이터 수집
    const shortTermData = await upbit.getOHLCV(market, 'minute60', 24)
    const midTermData = await upbit.getOHLCV(market, 'minute240', 30)
    const longTermData = await upbit.getOHLCV(market, 'day', 30)

    // 4. AI 거래 결정 분석
    console.log('AI 거래 결정 분석 중...')
    const decision = await analyzeTradingDecisionFromEnv(
      shortTermData,
      midTermData,
      longTermData,
      newsArticles
    )
    console.log(`AI 분석 완료\n`)

    // 5. 업비트 API 연결 및 잔고 확인
    console.log(`잔고 확인 중... (UPBIT, ${coinSymbol})`)
    const config = upbit.getUpbitConfigFromEnv()
    const currentPrice = await upbit.getCurrentPrice(market)
    const actualKrw = await upbit.getBalance('KRW', config)
    const actualCoin = await upbit.getBalance(coinSymbol, config)

    // DB에서 최신 거래 기록 조회하여 현재 가상 잔고 계산
    const allTrades = await db.select().from(trades).orderBy(asc(trades.timestamp))
    const isFirstRun = allTrades.length === 0

    // 초기 보유량: 첫 실행 시 업비트에서 가져온 실제 보유량, 이후에는 DB의 첫 거래 기록에서 가져옴
    let initialCoinBalance: number
    if (isFirstRun) {
      // 첫 실행: 업비트에서 가져온 실제 보유량을 초기 보유량으로 설정
      initialCoinBalance = actualCoin
    } else {
      // 이후 실행: DB의 첫 거래 기록에서 초기 보유량 가져오기
      const firstTrade = allTrades[0]
      initialCoinBalance = parseFloat(firstTrade.btc_balance)
    }

    // 현재 가상 잔고: DB에 거래 기록이 있으면 최신 잔고 사용, 없으면 업비트 실제 잔고 사용
    let myCoin = actualCoin
    let myKrw = actualKrw
    if (allTrades.length > 0) {
      const latestTrade = allTrades[allTrades.length - 1]
      myCoin = parseFloat(latestTrade.btc_balance)
      myKrw = parseFloat(latestTrade.krw_balance)
    }

    // 최소 보유량 계산:
    // - 초기 보유량 >= MAX_COUNT_AMOUNT: 최소 보유량 = 초기 보유량 - MAX_COUNT_AMOUNT
    //   예: 초기 보유량 2000개, MAX_COUNT_AMOUNT 1000 → 최소 보유량 1000개, 거래 가능 1000개
    // - 초기 보유량 < MAX_COUNT_AMOUNT: 최소 보유량 = 0 (전체 보유량 사용 가능)
    //   예: 초기 보유량 500개, MAX_COUNT_AMOUNT 1000 → 최소 보유량 0개, 거래 가능 500개
    const minCoinBalance = Math.max(0, initialCoinBalance - MAX_COUNT_AMOUNT)

    // 사용 가능한 코인: 현재 보유량 - 최소 보유량
    const effectiveCoinBalance = Math.max(0, myCoin - minCoinBalance)

    console.log(`초기 보유량: ${initialCoinBalance.toLocaleString()} ${coinSymbol} (업비트에서 가져옴)`)
    console.log(`최대 거래 가능 수량: ${MAX_COUNT_AMOUNT > 0 ? MAX_COUNT_AMOUNT.toLocaleString() : '제한 없음'} ${coinSymbol}`)
    console.log(`현재 가상 잔고: ${myCoin.toLocaleString()} ${coinSymbol}, ${myKrw.toLocaleString()} KRW`)
    console.log(`${coinSymbol} 최소 보유량: ${minCoinBalance.toLocaleString()} ${coinSymbol}`)
    console.log(`${coinSymbol} 사용 가능: ${effectiveCoinBalance.toLocaleString()} ${coinSymbol}`)
    console.log(`${coinSymbol} 현재가: ${currentPrice.toLocaleString()} KRW`)
    if (isFirstRun) {
      console.log(`첫 실행: 매수 불가 (초기 보유량만 보유, KRW 잔고 없음)\n`)
    }

    // 8. 거래 실행
    const percentage = decision.percentage / 100
    let finalKrw = myKrw
    let finalCoin = myCoin
    let finalPrice = currentPrice

    if (decision.decision === 'buy') {
      // 첫 실행 시에는 매수 불가 (초기 보유량만 보유, KRW 잔고 없음)
      if (isFirstRun) {
        console.log(`매수 불가: 첫 실행에서는 초기 보유량(${initialCoinBalance.toLocaleString()} ${coinSymbol})만 보유하고 있습니다. 매수할 KRW 잔고가 없습니다.\n`)
        // 결정을 hold로 변경
        decision.decision = 'hold'
        decision.percentage = 0
      } else {
        const amount = myKrw * percentage * (1 - FEE_RATE)

        if (amount > MIN_ORDER_AMOUNT) {
          console.log(`매수 주문: ${Math.floor(amount).toLocaleString()} KRW`)
          await upbit.buyMarketOrder(market, amount, config)
          console.log('매수 주문 완료\n')

          // 거래 처리 대기
          await new Promise((resolve) => setTimeout(resolve, 2000))

          // 잔고 재확인
          const actualKrw = await upbit.getBalance('KRW', config)
          const actualCoin = await upbit.getBalance(coinSymbol, config)

          // 가상 잔고 업데이트: 실제 거래 반영
          finalKrw = actualKrw
          finalCoin = actualCoin
          finalPrice = await upbit.getCurrentPrice(market)
        } else {
          console.log(`매수 실패: 금액 (${Math.floor(amount).toLocaleString()} KRW)이 최소 주문액(${MIN_ORDER_AMOUNT.toLocaleString()} KRW) 미만입니다\n`)
        }
      }
    } else if (decision.decision === 'sell') {
      // 사용 가능한 코인이 없으면 매도하지 않음
      if (effectiveCoinBalance <= 0) {
        console.log(`매도 실패: 사용 가능한 코인이 없습니다 (${effectiveCoinBalance.toLocaleString()} ${coinSymbol})\n`)
      } else {
        const coinAmount = effectiveCoinBalance * percentage * (1 - FEE_RATE)
        const value = coinAmount * currentPrice

        if (value > MIN_ORDER_AMOUNT) {
          console.log(`매도 주문: ${coinAmount.toFixed(8)} ${coinSymbol}`)
          await upbit.sellMarketOrder(market, coinAmount, config)
          console.log('매도 주문 완료\n')

          // 거래 처리 대기
          await new Promise((resolve) => setTimeout(resolve, 2000))

          // 잔고 재확인
          const actualKrw = await upbit.getBalance('KRW', config)
          const actualCoin = await upbit.getBalance(coinSymbol, config)

          // 가상 잔고 업데이트: 실제 거래 반영
          finalKrw = actualKrw
          finalCoin = actualCoin
          finalPrice = await upbit.getCurrentPrice(market)
        } else {
          console.log(`매도 실패: 가치 (${Math.floor(value).toLocaleString()} KRW)이 최소 주문액(${MIN_ORDER_AMOUNT.toLocaleString()} KRW) 미만입니다\n`)
        }
      }
    } else {
      console.log('보유 유지\n')
    }

    // 6. DB에 거래 기록 저장
    console.log('DB 저장 중...')
    const portfolioValue = finalKrw + finalCoin * finalPrice

    await db.insert(trades).values({
      decision: decision.decision,
      percentage: decision.percentage.toString(),
      coin_symbol: coinSymbol,
      btc_price: finalPrice.toString(),
      btc_balance: finalCoin.toString(),
      krw_balance: finalKrw.toString(),
      portfolio_value: portfolioValue.toString(),
      reason: decision.reason,
    })

    console.log('DB 저장 완료\n')
    console.log('거래 실행 완료!')
    console.log(`최종 포트폴리오 가치: ${Math.floor(portfolioValue).toLocaleString()} KRW`)
  } catch (error) {
    console.error('거래 실행 실패:', error)
    throw error
  }
}

// 직접 실행 시
if (require.main === module) {
  executeTrade()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('오류 발생:', error)
      process.exit(1)
    })
}


