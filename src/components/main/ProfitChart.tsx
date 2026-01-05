import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { type Trade } from '@/lib/hooks/queries/useTrades'

interface ProfitChartProps {
  trades: Trade[]
}

export function ProfitChart({ trades }: ProfitChartProps) {
  // 시간순으로 정렬
  const sortedTrades = [...trades].reverse()

  const chartData = sortedTrades.map((trade) => ({
    time: format(new Date(trade.timestamp), 'MM/dd HH:mm'),
    timestamp: trade.timestamp,
    수익률: Number(trade.profit_loss_pct),
    decision: trade.decision,
  }))

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
            const trade = sortedTrades.find(t => format(new Date(t.timestamp), 'MM/dd HH:mm') === label)
            return trade ? format(new Date(trade.timestamp), 'yyyy-MM-dd HH:mm') : label
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
  )
}

