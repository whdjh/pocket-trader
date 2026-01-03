'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Trade {
  id: number;
  timestamp: string;
  decision: 'buy' | 'sell' | 'hold';
  percentage: number;
  btc_price: number;
  btc_balance: number;
  krw_balance: number;
  portfolio_value: number;
  profit_loss: number;
  profit_loss_pct: number;
  reason: string;
}

export default function Home() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<number>(0);
  const [selectedCoin, setSelectedCoin] = useState<string>('BTC');

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const response = await fetch('/api/trades');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        setTrades([]);
        return;
      }

      const data = JSON.parse(text);
      setTrades(data.trades || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
      setTrades([]);
    }
  };

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

// 수익률 차트 컴포넌트
function ProfitChart({ trades }: { trades: Trade[] }) {
  // 시간순으로 정렬
  const sortedTrades = [...trades].reverse();

  const chartData = sortedTrades.map((trade) => ({
    time: format(new Date(trade.timestamp), 'MM/dd HH:mm'),
    timestamp: trade.timestamp,
    수익률: Number(trade.profit_loss_pct),
    decision: trade.decision,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `${value.toFixed(1)}%`}
        />
        <Tooltip
          formatter={(value: number | undefined) => value !== undefined ? [`${value.toFixed(2)}%`, '수익률'] : ['', '']}
          labelFormatter={(label) => {
            const trade = sortedTrades.find(t => format(new Date(t.timestamp), 'MM/dd HH:mm') === label);
            return trade ? format(new Date(trade.timestamp), 'yyyy-MM-dd HH:mm') : label;
          }}
          contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px' }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="수익률"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4, fill: '#3b82f6' }}
          activeDot={{ r: 6 }}
        />
        {/* 0% 기준선 */}
        <Line
          type="monotone"
          dataKey={() => 0}
          stroke="#9ca3af"
          strokeWidth={1}
          strokeDasharray="5 5"
          dot={false}
          legendType="none"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// 코인 가격 차트 컴포넌트
function PriceChart({ coin, trades }: { coin: string; trades: Trade[] }) {
  // 시간순으로 정렬
  const sortedTrades = [...trades].reverse();

  const chartData = sortedTrades.map((trade) => ({
    time: format(new Date(trade.timestamp), 'MM/dd HH:mm'),
    timestamp: trade.timestamp,
    가격: Number(trade.btc_price),
    decision: trade.decision,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `₩${(value / 1000000).toFixed(1)}M`}
        />
        <Tooltip
          formatter={(value: number | undefined) => value !== undefined ? [`₩${value.toLocaleString()}`, `${coin} 가격`] : ['', '']}
          labelFormatter={(label) => {
            const trade = sortedTrades.find(t => format(new Date(t.timestamp), 'MM/dd HH:mm') === label);
            return trade ? format(new Date(trade.timestamp), 'yyyy-MM-dd HH:mm') : label;
          }}
          contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px' }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="가격"
          stroke="#f97316"
          strokeWidth={2}
          dot={{ r: 4, fill: '#f97316' }}
          activeDot={{ r: 6 }}
          name={`${coin} 가격`}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// 거래 상세 정보 컴포넌트
function TradeDetails({
  trades,
  selectedIndex,
  onSelectChange
}: {
  trades: Trade[];
  selectedIndex: number;
  onSelectChange: (index: number) => void;
}) {
  if (trades.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        거래 데이터가 없습니다.
      </div>
    );
  }

  const selectedTrade = trades[selectedIndex] || trades[0];

  if (!selectedTrade) {
    return (
      <div className="text-center text-muted-foreground py-8">
        거래 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium mb-1.5 block">거래 선택:</label>
        <select
          value={selectedIndex}
          onChange={(e) => onSelectChange(Number(e.target.value))}
          className="w-full p-2 border rounded-md"
        >
          {trades.map((trade, idx) => (
            <option key={trade.id} value={idx}>
              {format(new Date(trade.timestamp), 'yyyy-MM-dd HH:mm')} - {trade.decision.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <h3 className="font-semibold mb-1.5">거래 세부사항</h3>
          <div className="space-y-1.5 text-sm">
            <div>
              <span className="text-muted-foreground">결정:</span>{' '}
              <span className="font-medium">
                {selectedTrade.decision.toUpperCase()} {selectedTrade.percentage}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">비트코인 가격:</span>{' '}
              <span className="font-medium">₩{selectedTrade.btc_price.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">거래 후 BTC 잔고:</span>{' '}
              <span className="font-medium">{selectedTrade.btc_balance.toFixed(8)} BTC</span>
            </div>
            <div>
              <span className="text-muted-foreground">거래 후 KRW 잔고:</span>{' '}
              <span className="font-medium">₩{selectedTrade.krw_balance.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">포트폴리오 가치:</span>{' '}
              <span className="font-medium">₩{selectedTrade.portfolio_value.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">수익률:</span>{' '}
              <span className={`font-medium ${selectedTrade.profit_loss_pct >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                {selectedTrade.profit_loss_pct.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-1.5">AI 판단 이유</h3>
          <div className="text-sm bg-muted p-3 rounded-md">
            {selectedTrade.reason}
          </div>
        </div>
      </div>
    </div>
  );
}
