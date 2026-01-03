'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { useCoins } from '@/lib/hooks/queries/useCoins';

interface CoinSearchProps {
  selectedCoin: string;
  onCoinChange: (coin: string) => void;
}

export function CoinSearch({ selectedCoin, onCoinChange }: CoinSearchProps) {
  const { data: coins = [] } = useCoins();
  const [searchQuery, setSearchQuery] = useState('');

  // 검색 필터링
  const filteredCoins = useMemo(() => {
    if (!searchQuery) {
      return coins.slice(0, 20); // 검색어가 없으면 상위 20개만 표시
    }

    const query = searchQuery.toUpperCase();
    return coins.filter(
      (coin) =>
        coin.symbol.includes(query) || coin.name.includes(query)
    );
  }, [coins, searchQuery]);

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="코인 검색 (예: BTC, ETH)"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full"
      />
      {searchQuery && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredCoins.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">
              검색 결과가 없습니다
            </div>
          ) : (
            filteredCoins.map((coin) => (
              <button
                key={coin.symbol}
                onClick={() => {
                  onCoinChange(coin.symbol);
                  setSearchQuery('');
                }}
                className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors ${selectedCoin === coin.symbol ? 'bg-muted' : ''
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{coin.symbol}</span>
                  <span className="text-sm text-muted-foreground">
                    ₩{coin.price.toLocaleString('ko-KR')}원
                  </span>
                </div>
                {coin.change24h !== 0 && (
                  <span
                    className={`text-xs ${coin.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                  >
                    {coin.change24h >= 0 ? '+' : ''}
                    {coin.change24h.toFixed(2)}%
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

