'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTrades } from '@/lib/hooks/queries/useTrades'
import { ProfitChart } from '@/components/main/ProfitChart'
import { PriceChart } from '@/components/main/PriceChart'
import { TradeDetails } from '@/components/main/TradeDetails'
import { FearGreedIndex } from '@/components/main/FearGreedIndex'

export default function Home() {
  const { data: trades = [] } = useTrades()
  const [selectedTrade, setSelectedTrade] = useState<number>(0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">AI 트레이딩 대시보드</h1>
        <FearGreedIndex />
      </div>

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

        {/* 코인 가격 차트 - 리플(XRP) */}
        <Card>
          <CardHeader>
            <CardTitle>XRP 가격 변화</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceChart coin="XRP" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
