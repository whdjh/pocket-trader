import { useQuery } from '@tanstack/react-query';

export interface Coin {
  symbol: string;
  name: string;
  price: number;
  volume24h: number;
  change24h: number;
}

export function useCoins() {
  return useQuery<Coin[]>({
    queryKey: ['coins'],
    queryFn: async () => {
      const response = await fetch('/api/coins');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.coins || [];
    },
    staleTime: 1000 * 60, // 1분간 캐시 유지
  });
}

