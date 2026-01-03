import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { trades } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const allTrades = await db.select().from(trades).orderBy(desc(trades.timestamp));

    const formattedTrades = allTrades.map((trade) => ({
      ...trade,
      timestamp: trade.timestamp.toISOString(),
      percentage: Number(trade.percentage),
      btc_price: Number(trade.btc_price),
      btc_balance: Number(trade.btc_balance),
      krw_balance: Number(trade.krw_balance),
      portfolio_value: Number(trade.portfolio_value),
      profit_loss: trade.profit_loss ? Number(trade.profit_loss) : null,
      profit_loss_pct: trade.profit_loss_pct ? Number(trade.profit_loss_pct) : null,
    }));

    return NextResponse.json({ trades: formattedTrades });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades', trades: [] },
      { status: 500 }
    );
  }
}

