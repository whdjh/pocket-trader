import { useEffect, useState, useRef } from 'react'

export interface PriceData {
  symbol: string
  price: number
  timestamp: string
}

export function usePriceStream(coin: string) {
  const [priceData, setPriceData] = useState<PriceData[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const eventSourceRef = useRef<EventSource | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    // 코인 변경 시 초기화
    setPriceData([])
    setIsLoadingHistory(true)
    initializedRef.current = false

    // 기존 연결 종료
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    // SSE 연결 함수
    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      const eventSource = new EventSource(`/api/price-stream?coin=${coin}`)
      eventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          const data: PriceData = JSON.parse(event.data)

          setPriceData((prev) => {
            // 중복 제거: 같은 타임스탬프나 매우 가까운 시간의 데이터는 제외
            const newTimestamp = new Date(data.timestamp).getTime()
            const isDuplicate = prev.some((item) => {
              const itemTimestamp = new Date(item.timestamp).getTime()
              // 1초 이내의 데이터는 중복으로 간주
              return Math.abs(newTimestamp - itemTimestamp) < 1000
            })

            if (isDuplicate) {
              return prev
            }

            // 새 데이터 추가 - 전체 데이터 유지 (제한 없음)
            return [...prev, data]
          })
        } catch (error) {
          console.error('Error parsing SSE message:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE error:', error)
        // 에러 발생 시 재연결 시도
        if (eventSource.readyState === EventSource.CLOSED) {
          setTimeout(() => {
            if (initializedRef.current) {
              connectSSE()
            }
          }, 3000) // 3초 후 재연결 시도
        }
      }
    }

    // 과거 데이터 먼저 가져오기 (전체 기간)
    const loadHistoricalData = async () => {
      try {
        const response = await fetch(`/api/price-history?coin=${coin}`)
        if (!response.ok) {
          throw new Error('Failed to fetch historical data')
        }
        const historicalData: PriceData[] = await response.json()
        
        // 타임스탬프 기준으로 정렬 (오래된 것부터)
        const sortedData = historicalData.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
        
        setPriceData(sortedData)
        setIsLoadingHistory(false)
        initializedRef.current = true
        
        // 과거 데이터 로드 완료 후 SSE 연결 시작
        connectSSE()
      } catch (error) {
        console.error('Error loading historical data:', error)
        setIsLoadingHistory(false)
        initializedRef.current = true
        // 에러가 발생해도 실시간 연결은 시작
        connectSSE()
      }
    }

    loadHistoricalData()

    // 클린업
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [coin])

  return priceData
}

