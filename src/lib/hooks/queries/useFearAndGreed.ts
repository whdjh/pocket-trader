import { useQuery } from '@tanstack/react-query';
import type { FearAndGreedIndex } from '@/lib/fear-greed-index';

export function useFearAndGreed() {
  return useQuery<FearAndGreedIndex>({
    queryKey: ['fearAndGreed'],
    queryFn: async () => {
      const res = await fetch('/api/trading/fear-greed');
      if (!res.ok) throw new Error('공포탐욕지수 조회 실패');
      const data = await res.json();
      return data.data;
    },
    refetchInterval: 60 * 1000, // 1분마다 갱신
  });
}

