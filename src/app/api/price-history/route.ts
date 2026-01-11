import { NextRequest } from 'next/server'
import { getOHLCV } from '@/lib/business/upbit'

export interface HistoricalPriceData {
  symbol: string
  price: number
  timestamp: string
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const coin = searchParams.get('coin') || 'BTC'

  try {
    const market = `KRW-${coin}`
    
    // 일봉으로 전체 데이터 가져오기 (2017년부터)
    // Upbit API는 한 번에 최대 200개만 가져올 수 있으므로 여러 번 요청
    const allData: HistoricalPriceData[] = []
    let toDate: string | undefined = undefined
    const maxRequests = 20 // 최대 20번 요청 (약 10년치)
    
    for (let i = 0; i < maxRequests; i++) {
      // Rate limit 방지를 위해 요청 간 지연 추가
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 500)) // 0.5초 대기
      }

      let ohlcvData
      let retries = 3
      let lastError

      // 429 에러 발생 시 재시도
      while (retries > 0) {
        try {
          ohlcvData = await getOHLCV(market, 'day', 200, toDate)
          lastError = null
          break
        } catch (error: any) {
          lastError = error
          // 429 에러인 경우에만 재시도
          if (error.message?.includes('429') || error.response?.status === 429) {
            retries--
            if (retries > 0) {
              // 지수 백오프: 1초, 2초, 4초 대기
              const waitTime = Math.pow(2, 3 - retries) * 1000
              await new Promise(resolve => setTimeout(resolve, waitTime))
            }
          } else {
            // 다른 에러는 즉시 throw
            throw error
          }
        }
      }

      if (lastError) {
        throw lastError
      }

      if (!ohlcvData || ohlcvData.length === 0) {
        break
      }

      const batchData: HistoricalPriceData[] = ohlcvData.map((candle) => ({
        symbol: coin,
        price: candle.close,
        timestamp: new Date(candle.time).toISOString(),
      }))

      allData.push(...batchData)

      // 가장 오래된 데이터의 날짜 확인
      const oldestTimestamp = ohlcvData[0].time
      const oldestDate = new Date(oldestTimestamp)
      
      if (oldestDate.getFullYear() < 2017) {
        break
      }

      // 다음 요청을 위한 to 파라미터 설정 (하루 전)
      const prevDayTimestamp = oldestTimestamp - (24 * 60 * 60 * 1000)
      const kstTimestamp = prevDayTimestamp + (9 * 60 * 60 * 1000)
      const kstDate = new Date(kstTimestamp)
      
      const year = kstDate.getUTCFullYear()
      const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0')
      const day = String(kstDate.getUTCDate()).padStart(2, '0')
      toDate = `${year}-${month}-${day}T00:00:00+09:00`

      if (ohlcvData.length < 200) {
        break
      }
    }

    // 타임스탬프 기준으로 정렬 (오래된 것부터)
    allData.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    return Response.json(allData)
  } catch (error) {
    console.error('Error fetching historical price data:', error)
    return Response.json(
      { error: 'Failed to fetch historical price data' },
      { status: 500 }
    )
  }
}
