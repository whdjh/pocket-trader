'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrades } from '@/lib/hooks/queries/useTrades';
import { ProfitChart } from '@/components/main/ProfitChart';
import { PriceChart } from '@/components/main/PriceChart';
import { TradeDetails } from '@/components/main/TradeDetails';

export default function Home() {
  const { data: trades = [] } = useTrades();
  const [selectedTrade, setSelectedTrade] = useState<number>(0);
  const [selectedCoin, setSelectedCoin] = useState<string>('BTC');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Bitcoin AI Trading Dashboard</h1>

      {/* 거래 상세 정보 - 맨 상단 */}
      <Card>
        <CardHeader>
          <CardTitle>거래 상세 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <TradeDetails
            trades={trades}
            selectedIndex={selectedTrade}
            onSelectChange={setSelectedTrade}
          />
        </CardContent>
      </Card>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 수익률 차트 */}
        <Card>
          <CardHeader>
            <CardTitle>수익률 변화</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfitChart trades={trades} />
          </CardContent>
        </Card>

        {/* 코인 가격 차트 - 선택 가능 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>가격 변화</CardTitle>
              <select
                value={selectedCoin}
                onChange={(e) => setSelectedCoin(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="XRP">XRP</option>
                <option value="ADA">ADA</option>
                <option value="DOGE">DOGE</option>
                <option value="SOL">SOL</option>
                <option value="DOT">DOT</option>
                <option value="MATIC">MATIC</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <PriceChart coin={selectedCoin} trades={trades} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
