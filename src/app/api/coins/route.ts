import { NextResponse } from 'next/server';

interface BithumbTickerResponse {
  status: string;
  data: Record<string, {
    opening_price: string;
    closing_price: string;
    min_price: string;
    max_price: string;
    units_traded: string;
    acc_trade_value: string;
    prev_closing_price: string;
    units_traded_24H: string;
    acc_trade_value_24H: string;
    fluctate_24H: string;
    fluctate_rate_24H: string;
  }>;
}

export async function GET() {
  try {
    const response = await fetch('https://api.bithumb.com/public/ticker/ALL_KRW', {
      next: { revalidate: 60 }, // 1분마다 캐시 갱신
    });

    if (!response.ok) {
      throw new Error(`Bithumb API error: ${response.status}`);
    }

    const data: BithumbTickerResponse = await response.json();

    if (data.status !== '0000') {
      throw new Error(`Bithumb API error: ${data.status}`);
    }

    // 코인 목록 추출 및 정렬 (거래량 기준)
    const coins = Object.entries(data.data)
      .map(([symbol, ticker]) => ({
        symbol: symbol.replace('_KRW', ''),
        name: symbol.replace('_KRW', ''),
        price: parseFloat(ticker.closing_price),
        volume24h: parseFloat(ticker.acc_trade_value_24H),
        change24h: parseFloat(ticker.fluctate_rate_24H),
      }))
      .filter((coin) => coin.volume24h > 0) // 거래량이 있는 코인만
      .sort((a, b) => b.volume24h - a.volume24h); // 거래량 순으로 정렬

    return NextResponse.json({ coins });
  } catch (error) {
    console.error('Error fetching coins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coins', coins: [] },
      { status: 500 }
    );
  }
}

