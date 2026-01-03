import { NextResponse } from 'next/server';
// import { db } from '@/lib/db';
// import { trades } from '@/lib/db/schema';
// import { desc } from 'drizzle-orm';

// 임시 목 데이터 (UI 확인용)
const mockTrades = [
  {
    id: 1,
    timestamp: new Date('2024-01-15T10:30:00').toISOString(),
    decision: 'buy' as const,
    percentage: 30,
    btc_price: 95000000,
    btc_balance: 0.00157895,
    krw_balance: 850000,
    portfolio_value: 1000000,
    profit_loss: 0,
    profit_loss_pct: 0,
    reason: 'Price broke resistance on 4h chart, supported by positive institutional adoption news. Technical indicators show strong bullish momentum.',
  },
  {
    id: 2,
    timestamp: new Date('2024-01-15T14:20:00').toISOString(),
    decision: 'hold' as const,
    percentage: 0,
    btc_price: 96500000,
    btc_balance: 0.00157895,
    krw_balance: 850000,
    portfolio_value: 1002450,
    profit_loss: 2450,
    profit_loss_pct: 0.25,
    reason: 'Consolidating price action, mixed news signals. Waiting for confirmation before next move.',
  },
  {
    id: 3,
    timestamp: new Date('2024-01-15T18:45:00').toISOString(),
    decision: 'sell' as const,
    percentage: 50,
    btc_price: 98000000,
    btc_balance: 0.00078947,
    krw_balance: 1274000,
    portfolio_value: 1007894,
    profit_loss: 7894,
    profit_loss_pct: 0.79,
    reason: 'Bearish divergence on daily chart, combined with negative regulatory news. Taking partial profits.',
  },
  {
    id: 4,
    timestamp: new Date('2024-01-16T09:15:00').toISOString(),
    decision: 'buy' as const,
    percentage: 25,
    btc_price: 97500000,
    btc_balance: 0.00106410,
    krw_balance: 1025000,
    portfolio_value: 1006250,
    profit_loss: 6250,
    profit_loss_pct: 0.63,
    reason: 'Support level held strong, RSI oversold bounce. Good entry point for accumulation.',
  },
  {
    id: 5,
    timestamp: new Date('2024-01-16T15:30:00').toISOString(),
    decision: 'hold' as const,
    percentage: 0,
    btc_price: 97200000,
    btc_balance: 0.00106410,
    krw_balance: 1025000,
    portfolio_value: 1005341,
    profit_loss: 5341,
    profit_loss_pct: 0.53,
    reason: 'Price consolidating in tight range. No clear directional bias. Waiting for breakout.',
  },
  {
    id: 6,
    timestamp: new Date('2024-01-17T11:00:00').toISOString(),
    decision: 'buy' as const,
    percentage: 20,
    btc_price: 98500000,
    btc_balance: 0.00126903,
    krw_balance: 825000,
    portfolio_value: 1004799,
    profit_loss: 4799,
    profit_loss_pct: 0.48,
    reason: 'Bullish flag pattern forming, volume increasing. Positive sentiment from major exchange listing news.',
  },
  {
    id: 7,
    timestamp: new Date('2024-01-17T16:45:00').toISOString(),
    decision: 'sell' as const,
    percentage: 30,
    btc_price: 100000000,
    btc_balance: 0.00088832,
    krw_balance: 1133000,
    portfolio_value: 1002132,
    profit_loss: 2132,
    profit_loss_pct: 0.21,
    reason: 'Reached target resistance level. Profit taking recommended. Market showing signs of overextension.',
  },
  {
    id: 8,
    timestamp: new Date('2024-01-18T10:20:00').toISOString(),
    decision: 'hold' as const,
    percentage: 0,
    btc_price: 99500000,
    btc_balance: 0.00088832,
    krw_balance: 1133000,
    portfolio_value: 1001888,
    profit_loss: 1888,
    profit_loss_pct: 0.19,
    reason: 'Minor pullback after recent gains. Healthy correction expected. Holding position.',
  },
];

export async function GET() {
  // 임시로 목 데이터 반환 (UI 확인용)
  return NextResponse.json({ trades: mockTrades });

  // 실제 데이터베이스 사용 코드 (주석 처리)
  // try {
  //   const allTrades = await db.select().from(trades).orderBy(desc(trades.timestamp));
  //   
  //   const formattedTrades = allTrades.map((trade) => ({
  //     ...trade,
  //     timestamp: trade.timestamp.toISOString(),
  //     percentage: Number(trade.percentage),
  //     btc_price: Number(trade.btc_price),
  //     btc_balance: Number(trade.btc_balance),
  //     krw_balance: Number(trade.krw_balance),
  //     portfolio_value: Number(trade.portfolio_value),
  //     profit_loss: trade.profit_loss ? Number(trade.profit_loss) : null,
  //     profit_loss_pct: trade.profit_loss_pct ? Number(trade.profit_loss_pct) : null,
  //   }));
  //   
  //   return NextResponse.json({ trades: formattedTrades });
  // } catch (error) {
  //   console.error('Error fetching trades:', error);
  //   return NextResponse.json(
  //     { error: 'Failed to fetch trades', trades: [] },
  //     { status: 500 }
  //   );
  // }
}

