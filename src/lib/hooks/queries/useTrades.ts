import { useQuery } from '@tanstack/react-query'

export interface Trade {
  id: number
  timestamp: string
  decision: 'buy' | 'sell' | 'hold'
  percentage: number
  coin_symbol: string | null
  btc_price: number
  btc_balance: number
  krw_balance: number
  portfolio_value: number
  profit_loss: number | null
  profit_loss_pct: number | null
  reason: string
}

export function useTrades() {
  return useQuery<Trade[]>({
    queryKey: ['trades'],
    queryFn: async () => {
      const response = await fetch('/api/trades')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const text = await response.text()
      if (!text) {
        return []
      }

      const data = await JSON.parse(text)
      return data.trades || []
    },
    staleTime: 1000 * 30, // 30초간 캐시 유지
    refetchInterval: 1000 * 60, // 1분마다 자동 갱신
  })
}

