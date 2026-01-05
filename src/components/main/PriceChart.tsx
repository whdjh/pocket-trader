import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { usePriceStream } from '@/lib/hooks/queries/usePriceStream'

interface PriceChartProps {
  coin: string
}

export function PriceChart({ coin }: PriceChartProps) {
  const priceData = usePriceStream(coin)

  // 첫 번째 유효한 가격(>0)이 들어온 후부터의 데이터만 사용
  // 초기 연결 시의 0원 데이터는 제외하되, 이후 실제로 0원이 되는 경우는 포함
  const firstValidIndex = priceData.findIndex((data) => data.price > 0)
  const validPriceData = firstValidIndex >= 0
    ? priceData.slice(firstValidIndex)
    : []

  // 가격 데이터가 없으면 로딩 표시
  if (validPriceData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        가격 데이터를 불러오는 중...
      </div>
    )
  }

  // 차트 데이터 생성 (첫 유효 가격 이후의 모든 데이터 포함, 0원도 포함)
  const chartData = validPriceData.map((data) => ({
    time: format(new Date(data.timestamp), 'HH:mm:ss'),
    timestamp: data.timestamp,
    가격: data.price,
  }))

  // Y축 포맷 결정 (가격 범위에 따라) - 한국어 단위 사용
  const maxPrice = Math.max(...chartData.map((d) => d.가격))
  const formatYAxis = (value: number) => {
    if (maxPrice >= 100000000) {
      // 억 단위 (100,000,000 이상)
      return `₩${(value / 100000000).toFixed(1)}억`
    } else if (maxPrice >= 10000000) {
      // 천만 단위 (10,000,000 이상)
      return `₩${(value / 10000000).toFixed(1)}천만`
    } else if (maxPrice >= 1000000) {
      // 백만 단위 (1,000,000 이상)
      return `₩${(value / 1000000).toFixed(1)}백만`
    } else if (maxPrice >= 1000) {
      // 천 단위 (1,000 이상)
      return `₩${(value / 1000).toFixed(1)}천`
    }
    return `₩${value.toLocaleString('ko-KR')}`
  }

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
          tickFormatter={formatYAxis}
        />
        <Tooltip
          formatter={(value: number | undefined) =>
            value !== undefined ? [`₩${value.toLocaleString('ko-KR')}원`, `${coin} 가격 (원화)`] : ['', '']
          }
          labelFormatter={(label) => {
            const data = chartData.find((d) => d.time === label)
            return data ? format(new Date(data.timestamp), 'yyyy-MM-dd HH:mm:ss') : label
          }}
          contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px' }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="가격"
          stroke="#f97316"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
          name={`${coin} 가격 (원화)`}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

