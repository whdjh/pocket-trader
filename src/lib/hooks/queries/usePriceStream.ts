import { useEffect, useState, useRef } from 'react'

export interface PriceData {
  symbol: string
  price: number
  timestamp: string
}

export function usePriceStream(coin: string) {
  const [priceData, setPriceData] = useState<PriceData[]>([])
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    // 기존 연결 종료
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // 새 SSE 연결 생성
    const eventSource = new EventSource(`/api/price-stream?coin=${coin}`)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data: PriceData = JSON.parse(event.data)

        setPriceData((prev) => {
          const newData = [...prev, data]
          // 최근 100개 데이터만 유지
          return newData.slice(-100)
        })
      } catch (error) {
        console.error('Error parsing SSE message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      // 에러 발생 시 재연결 시도
      eventSource.close()
    }

    // 클린업
    return () => {
      eventSource.close()
      // 코인이 변경될 때만 초기화 (언마운트 시에는 초기화하지 않음)
      if (eventSourceRef.current === null || eventSourceRef.current.readyState === EventSource.CLOSED) {
        setPriceData([])
      }
    }
  }, [coin])

  // 코인 변경 시 데이터 초기화를 위한 별도 effect
  useEffect(() => {
    return () => {
      setPriceData([])
    }
  }, [coin])

  return priceData
}

