import { format } from 'date-fns'
import { type Trade } from '@/lib/hooks/queries/useTrades'

interface TradeDetailsProps {
  trades: Trade[]
  selectedIndex: number
  onSelectChange: (index: number) => void
}

export function TradeDetails({
  trades,
  selectedIndex,
  onSelectChange
}: TradeDetailsProps) {
  if (trades.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        거래 데이터가 없습니다.
      </div>
    )
  }

  const selectedTrade = trades[selectedIndex] || trades[0]

  if (!selectedTrade) {
    return (
      <div className="text-center text-muted-foreground py-8">
        거래 데이터를 불러올 수 없습니다.
      </div>
    )
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
  )
}

