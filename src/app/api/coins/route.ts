import { NextResponse } from 'next/server';

interface UpbitMarketResponse {
  market: string;
  korean_name: string;
  english_name: string;
}

interface UpbitTickerResponse {
  market: string;
  trade_price: number;
  acc_trade_volume_24h: number;
  acc_trade_price_24h: number;
  signed_change_rate_24h: number;
  [key: string]: unknown;
}

export async function GET() {
  try {
    // 1. 모든 KRW 마켓 조회
    const marketsResponse = await fetch('https://api.upbit.com/v1/market/all?isDetails=false', {
      next: { revalidate: 3600 }, // 1시간마다 캐시 갱신 (마켓 목록은 자주 바뀌지 않음)
    });

    if (!marketsResponse.ok) {
      throw new Error(`Upbit API error: ${marketsResponse.status}`);
    }

    const marketsData: UpbitMarketResponse[] = await marketsResponse.json();
    const krwMarkets = marketsData
      .filter((m) => m.market.startsWith('KRW-'))
      .map((m) => m.market);

    if (krwMarkets.length === 0) {
      throw new Error('No KRW markets found');
    }

    // 2. 모든 마켓의 티커 정보 조회 (최대 100개씩 나눠서 요청)
    const batchSize = 100;
    const allTickers: UpbitTickerResponse[] = [];

    for (let i = 0; i < krwMarkets.length; i += batchSize) {
      const batch = krwMarkets.slice(i, i + batchSize);
      const marketsParam = batch.join(',');

      const tickerResponse = await fetch(`https://api.upbit.com/v1/ticker?markets=${marketsParam}`, {
        next: { revalidate: 60 }, // 1분마다 캐시 갱신
      });

      if (!tickerResponse.ok) {
        console.error(`Failed to fetch tickers for batch ${i}-${i + batchSize}`);
        continue;
      }

      const tickerData: UpbitTickerResponse[] = await tickerResponse.json();
      if (Array.isArray(tickerData)) {
        allTickers.push(...tickerData);
      }
    }

    // 3. 마켓 정보와 티커 정보 결합
    const marketMap = new Map(marketsData.map((m) => [m.market, m]));

    const coins = allTickers
      .map((ticker) => {
        const marketInfo = marketMap.get(ticker.market);
        const symbol = ticker.market.replace('KRW-', '');
        return {
          symbol,
          name: marketInfo?.korean_name || symbol,
          price: ticker.trade_price,
          volume24h: ticker.acc_trade_price_24h,
          change24h: ticker.signed_change_rate_24h * 100, // 퍼센트로 변환
        };
      })
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

