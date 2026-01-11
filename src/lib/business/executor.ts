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

// 테스트용 최대 코인 수량 (환경변수에서 설정)
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
    console.log(`차트 데이터 수집 중... (${coinSymbol})`)
    const shortTermData = await upbit.getOHLCV(market, 'minute60', 24)
    const midTermData = await upbit.getOHLCV(market, 'minute240', 30)
    const longTermData = await upbit.getOHLCV(market, 'day', 30)
    console.log(`차트 데이터 수집 완료\n`)

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
    const myKrw = await upbit.getBalance('KRW', config)
    const myCoin = await upbit.getBalance(coinSymbol, config)
    const currentPrice = await upbit.getCurrentPrice(market)

    // 초기 보유량 추정: DB에서 첫 거래 기록 조회
    const firstTrade = await db.select().from(trades).orderBy(asc(trades.timestamp)).limit(1)
    const initialCoinBalance = firstTrade.length > 0
      ? parseFloat(firstTrade[0].btc_balance)
      : myCoin // 첫 거래가 없으면 현재 보유량을 초기값으로 사용

    // 최소 보유량 계산:
    // - 초기 보유량 >= MAX_COUNT_AMOUNT: 최소 보유량 = 초기 보유량 - MAX_COUNT_AMOUNT (예: 1001개면 최소 1개 유지)
    // - 초기 보유량 < MAX_COUNT_AMOUNT: 최소 보유량 = 0 (전체 보유량 사용 가능)
    const minCoinBalance = Math.max(0, initialCoinBalance - MAX_COUNT_AMOUNT)

    // 사용 가능한 코인: 현재 보유량 - 최소 보유량
    // 초기 보유량이 MAX_COUNT_AMOUNT 이상이면 최소 보유량만큼 남기고 거래 가능
    // 초기 보유량이 MAX_COUNT_AMOUNT 미만이면 전체 보유량 사용 가능
    const effectiveCoinBalance = Math.max(0, myCoin - minCoinBalance)

    console.log(`KRW 잔고: ${myKrw.toLocaleString()} KRW`)
    console.log(`${coinSymbol} 실제 잔고: ${myCoin} ${coinSymbol}`)
    console.log(`${coinSymbol} 초기 보유량: ${initialCoinBalance.toLocaleString()} ${coinSymbol}`)
    console.log(`${coinSymbol} 최소 보유량: ${minCoinBalance.toLocaleString()} ${coinSymbol}`)
    console.log(`${coinSymbol} 사용 가능: ${effectiveCoinBalance.toLocaleString()} ${coinSymbol} (최대 ${MAX_COUNT_AMOUNT.toLocaleString()}개)`)
    console.log(`${coinSymbol} 현재가: ${currentPrice.toLocaleString()} KRW\n`)

    // 8. 결정 출력
    console.log('AI 결정:')
    console.log(`결정: ${decision.decision.toUpperCase()}`)
    console.log(`비율: ${decision.percentage}%`)
    console.log(`이유: ${decision.reason}\n`)

    // 9. 거래 실행
    const percentage = decision.percentage / 100
    let finalKrw = myKrw
    let finalCoin = myCoin
    let finalPrice = currentPrice

    if (decision.decision === 'buy') {
      const amount = myKrw * percentage * (1 - FEE_RATE)

      if (amount > MIN_ORDER_AMOUNT) {
        console.log(`매수 주문: ${Math.floor(amount).toLocaleString()} KRW`)
        await upbit.buyMarketOrder(market, amount, config)
        console.log('매수 주문 완료\n')

        // 거래 처리 대기
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // 잔고 재확인
        finalKrw = await upbit.getBalance('KRW', config)
        finalCoin = await upbit.getBalance(coinSymbol, config)
        finalPrice = await upbit.getCurrentPrice(market)
      } else {
        console.log(`매수 실패: 금액 (${Math.floor(amount).toLocaleString()} KRW)이 최소 주문액(${MIN_ORDER_AMOUNT.toLocaleString()} KRW) 미만입니다\n`)
      }
    } else if (decision.decision === 'sell') {
      // 사용 가능한 코인이 없으면 매도하지 않음
      if (effectiveCoinBalance <= 0) {
        console.log(`매도 실패: 사용 가능한 코인이 없습니다 (${effectiveCoinBalance.toLocaleString()} ${coinSymbol})\n`)
      } else {
        // 테스트용: 실제 보유량 대신 테스트용 잔고 사용
        const coinAmount = effectiveCoinBalance * percentage * (1 - FEE_RATE)
        const value = coinAmount * currentPrice

        if (value > MIN_ORDER_AMOUNT) {
          console.log(`매도 주문: ${coinAmount.toFixed(8)} ${coinSymbol} (테스트용 잔고 기준)`)
          await upbit.sellMarketOrder(market, coinAmount, config)
          console.log('매도 주문 완료\n')

          // 거래 처리 대기
          await new Promise((resolve) => setTimeout(resolve, 2000))

          // 잔고 재확인
          finalKrw = await upbit.getBalance('KRW', config)
          finalCoin = await upbit.getBalance(coinSymbol, config)
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


