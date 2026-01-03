import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { type Trade } from '@/lib/hooks/queries/useTrades';

interface PriceChartProps {
  coin: string;
  trades: Trade[];
}

export function PriceChart({ coin, trades }: PriceChartProps) {
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

