// 명령어: npm run trade
// TODO: 주기적으로 실행하는 코드 추가 예정
import 'dotenv/config'
import * as upbit from './upbit'
import { getCryptoNewsFromEnv } from './serpapi'
import { analyzeTradingDecisionFromEnv } from './trading-ai'
import { db } from '../db'
import { trades } from '../db/schema'

// 거래 대상 코인 (리플 고정)
const COIN_SYMBOL = 'XRP'

// 최소 주문 금액 (KRW)
const MIN_ORDER_AMOUNT = 5000

// 수수료율 (0.3%)
const FEE_RATE = 0.003

// 코인 심볼을 마켓 형식으로 변환 (예: BTC -> KRW-BTC)
function getMarketFromCoin(coinSymbol: string): string {
  return `KRW-${coinSymbol}`
}

// 거래 실행 함수
export async function executeTrade(): Promise<void> {
  console.log('🚀 거래 실행 시작... (거래소: UPBIT)\n')

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
    console.log(`KRW 잔고: ${myKrw.toLocaleString()} KRW`)
    console.log(`${coinSymbol} 잔고: ${myCoin} ${coinSymbol}`)
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
      const coinAmount = myCoin * percentage * (1 - FEE_RATE)
      const value = coinAmount * currentPrice

      if (value > MIN_ORDER_AMOUNT) {
        console.log(`매도 주문: ${coinAmount.toFixed(8)} ${coinSymbol}`)
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


