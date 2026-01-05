import { useQuery } from '@tanstack/react-query'

export interface FearGreedData {
  value: number
  classification: string
  timestamp: string
}

export function useFearGreed() {
  return useQuery<FearGreedData>({
    queryKey: ['fear-greed'],
    queryFn: async () => {
      const response = await fetch('/api/fear-greed')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error || data.value === null) {
        throw new Error('Failed to fetch fear & greed index')
      }

      return data
    },
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
    refetchInterval: 1000 * 60 * 5, // 5분마다 자동 갱신
  })
}

