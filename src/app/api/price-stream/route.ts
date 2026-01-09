import { NextRequest } from 'next/server';

interface PriceData {
  symbol: string;
  price: number;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const coin = searchParams.get('coin') || 'BTC';

  // SSE 스트림 생성
  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: PriceData) => {
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('Error sending SSE message:', error);
        }
      };

      // 즉시 첫 번째 가격 데이터 가져오기
      const fetchAndSendPrice = async () => {
        try {
          const market = `KRW-${coin}`;
          const response = await fetch(
            `https://api.upbit.com/v1/ticker?markets=${market}`,
            {
              cache: 'no-store',
            }
          );

          if (!response.ok) {
            throw new Error(`Upbit API error: ${response.status}`);
          }

          const data = await response.json();

          if (Array.isArray(data) && data.length > 0 && data[0].trade_price) {
            send({
              symbol: coin,
              price: data[0].trade_price,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Error fetching price:', error);
        }
      };

      // 즉시 첫 번째 가격 가져오기
      fetchAndSendPrice();

      // 주기적으로 업비트 API 호출하여 가격 업데이트
      intervalId = setInterval(async () => {
        try {
          const market = `KRW-${coin}`;
          const response = await fetch(
            `https://api.upbit.com/v1/ticker?markets=${market}`,
            {
              cache: 'no-store',
            }
          );

          if (!response.ok) {
            throw new Error(`Upbit API error: ${response.status}`);
          }

          const data = await response.json();

          if (Array.isArray(data) && data.length > 0 && data[0].trade_price) {
            send({
              symbol: coin,
              price: data[0].trade_price,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Error fetching price:', error);
          // 에러 발생 시에도 스트림 유지
        }
      }, 2000); // 2초마다 업데이트
    },
    cancel() {
      // 클라이언트 연결 종료 시 정리
      if (intervalId) {
        clearInterval(intervalId);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Nginx 버퍼링 비활성화
    },
  });
}

