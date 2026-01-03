'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TradeHistory {
  datetime: string;
  decision: 'buy' | 'sell' | 'hold';
  reason: string;
  fear_and_greed: number;
  krw_balance: number;
  btc_balance: number;
  action_result: string;
}

interface FearAndGreedIndex {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update?: string;
}

export default function Home() {
  const router = useRouter();
  const [isTradingActive] = useState(false); // 향후 스케줄링 기능에서 사용 예정
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [fearAndGreed, setFearAndGreed] = useState<FearAndGreedIndex | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    fetch('/api/auth/check')
      .then(res => {
        if (!res.ok) {
          router.push('/login');
        } else {
          // SSE로 거래 기록 구독 시작
          eventSource = new EventSource('/api/trading/history/stream');

          eventSource.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data);

              if (message.type === 'initial' || message.type === 'update') {
                setTradeHistory(message.data);
                setIsLoading(false);
              }
            } catch (error) {
              console.error('SSE 메시지 파싱 오류:', error);
            }
          };

          eventSource.onerror = (error) => {
            console.error('SSE 연결 오류:', error);
            eventSource?.close();
            // 재연결 시도
            setTimeout(() => {
              if (eventSource) {
                eventSource = new EventSource('/api/trading/history/stream');
              }
            }, 3000);
          };

          loadFearAndGreed();
        }
      })
      .catch(() => {
        router.push('/login');
      });

    // 컴포넌트 언마운트 시 연결 종료
    return () => {
      eventSource?.close();
    };
  }, [router]);

  // 공포탐욕지수 주기적 갱신 (5분마다)
  useEffect(() => {
    loadFearAndGreed();
    const interval = setInterval(() => {
      loadFearAndGreed();
    }, 5 * 60 * 1000); // 5분

    return () => clearInterval(interval);
  }, []);


  const loadFearAndGreed = async () => {
    try {
      const res = await fetch('/api/trading/fear-greed');
      const data = await res.json();
      if (data.success) {
        setFearAndGreed(data.data);
      }
    } catch (error) {
      console.error('공포탐욕지수 로드 실패:', error);
    }
  };

  const handleExecuteTrading = async () => {
    setIsExecuting(true);
    try {
      const res = await fetch('/api/trading/execute', {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        alert(`자동매매 실행 완료!\n결정: ${data.decision}\n이유: ${data.reason}\n결과: ${data.action_result}`);
        // SSE가 자동으로 업데이트하므로 수동 새로고침 불필요
        // 필요시 loadTradeHistory() 호출 가능
      } else {
        alert(`오류: ${data.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('자동매매 실행 실패:', error);
      alert('자동매매 실행 중 오류가 발생했습니다');
    } finally {
      setIsExecuting(false);
    }
  };

  // 최신 잔고 정보 (가장 최근 거래 기록에서)
  const latestBalance = tradeHistory[0] || null;
  const krwBalance = latestBalance?.krw_balance || 0;
  const btcBalance = latestBalance?.btc_balance || 0;

  // 공포탐욕지수 색상 및 레이블
  const getFearGreedColor = (value: number) => {
    if (value >= 75) return 'text-red-600 bg-red-50';
    if (value >= 55) return 'text-orange-600 bg-orange-50';
    if (value >= 45) return 'text-yellow-600 bg-yellow-50';
    if (value >= 25) return 'text-green-600 bg-green-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getFearGreedLabel = (value: number) => {
    if (value >= 75) return '극도의 탐욕';
    if (value >= 55) return '탐욕';
    if (value >= 45) return '중립';
    if (value >= 25) return '공포';
    return '극도의 공포';
  };

  return (
    <div className="p-8 space-y-6">
      {/* 트레이딩 제어 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            className="flex items-center gap-2"
            onClick={handleExecuteTrading}
            disabled={isExecuting}
          >
            <span className={`w-3 h-3 rounded-full ${isTradingActive ? 'bg-green-500' : 'bg-gray-400'}`} />
            {isExecuting ? '실행 중...' : '자동매매 실행'}
          </Button>
          <div className="text-sm text-muted-foreground">
            상태: {isTradingActive ? '실행 중' : '중지'}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          전략: AI 자동매매 | 코인: BTC
        </div>
      </div>

      {/* 공포탐욕지수 */}
      <Card>
        <CardHeader>
          <CardTitle>공포탐욕지수 (Fear & Greed Index)</CardTitle>
        </CardHeader>
        <CardContent>
          {fearAndGreed ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="relative w-64 h-40">
                  {/* 반원 게이지 */}
                  <svg className="w-full h-full" viewBox="0 0 200 100">
                    {/* 배경 반원 */}
                    <path
                      d="M 20 80 A 80 80 0 0 1 180 80"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    {/* 값에 따른 반원 (0-100을 0-180도로 변환) */}
                    {(() => {
                      const value = parseInt(fearAndGreed.value);
                      const angle = (value / 100) * 180; // 0-100을 0-180도로
                      const radians = (angle * Math.PI) / 180;
                      const x = 100 + 80 * Math.cos(Math.PI - radians);
                      const y = 80 - 80 * Math.sin(Math.PI - radians);
                      const largeArc = value > 50 ? 1 : 0;

                      return (
                        <path
                          d={`M 20 80 A 80 80 0 ${largeArc} 1 ${x} ${y}`}
                          fill="none"
                          stroke={
                            value >= 75 ? '#ef4444' :
                              value >= 55 ? '#f97316' :
                                value >= 45 ? '#eab308' :
                                  value >= 25 ? '#22c55e' :
                                    '#3b82f6'
                          }
                          strokeWidth="12"
                          strokeLinecap="round"
                          className="transition-all duration-500"
                        />
                      );
                    })()}
                  </svg>
                  {/* 중앙 값 표시 */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-5xl font-bold">
                      {fearAndGreed.value}
                    </div>
                    <div className={`text-sm font-semibold mt-1 ${getFearGreedColor(parseInt(fearAndGreed.value)).split(' ')[0]}`}>
                      {getFearGreedLabel(parseInt(fearAndGreed.value))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground px-4">
                <div>극도의 공포</div>
                <div>중립</div>
                <div>극도의 탐욕</div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1 text-center">
                <div>분류: {fearAndGreed.value_classification}</div>
                <div>업데이트: {new Date(parseInt(fearAndGreed.timestamp) * 1000).toLocaleString('ko-KR')}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">로딩 중...</div>
          )}
        </CardContent>
      </Card>

      {/* 전략 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>전략 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>RSI 매수 기준</Label>
                <Input type="number" defaultValue="30" placeholder="30" />
              </div>
              <div className="space-y-2">
                <Label>RSI 매도 기준</Label>
                <Input type="number" defaultValue="70" placeholder="70" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>투입금 (총 자산의 %)</Label>
              <Input type="number" defaultValue="5" placeholder="5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>손절 (%)</Label>
                <Input type="number" defaultValue="-3" placeholder="-3" />
              </div>
              <div className="space-y-2">
                <Label>익절 (%)</Label>
                <Input type="number" defaultValue="6" placeholder="6" />
              </div>
            </div>
            <Button>저장</Button>
          </div>
        </CardContent>
      </Card>

      {/* 포지션/보유 코인 */}
      <Card>
        <CardHeader>
          <CardTitle>보유 포지션</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {btcBalance > 0 ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">BTC {btcBalance.toFixed(8)}</div>
                  <div className="text-sm text-muted-foreground">보유 중</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">-</div>
                  <div className="text-sm text-muted-foreground">현재가 조회 필요</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">보유 포지션이 없습니다</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 실시간 거래 로그 */}
      <Card>
        <CardHeader>
          <CardTitle>실시간 거래 로그</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">로딩 중...</div>
          ) : tradeHistory.length > 0 ? (
            <div className="space-y-2 text-sm font-mono max-h-60 overflow-y-auto">
              {tradeHistory.slice(0, 10).map((trade, index) => (
                <div key={index} className="border-b pb-2">
                  <div className="font-semibold">
                    {new Date(trade.datetime).toLocaleString('ko-KR')} - {trade.decision.toUpperCase()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {trade.reason}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    결과: {trade.action_result} | 공포탐욕지수: {trade.fear_and_greed}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">거래 기록이 없습니다</div>
          )}
        </CardContent>
      </Card>

      {/* 잔고 */}
      <Card>
        <CardHeader>
          <CardTitle>잔고</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">로딩 중...</div>
          ) : (
            <div className="space-y-2">
              <div>KRW: {krwBalance.toLocaleString('ko-KR')}원</div>
              <div>BTC: {btcBalance.toFixed(8)}</div>
              {latestBalance && (
                <div className="pt-2 border-t font-semibold">
                  마지막 업데이트: {new Date(latestBalance.datetime).toLocaleString('ko-KR')}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 거래 내역 */}
      <Card>
        <CardHeader>
          <CardTitle>거래 내역</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">로딩 중...</div>
          ) : tradeHistory.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-6 gap-4 text-sm font-medium pb-2 border-b">
                <div>시간</div>
                <div>결정</div>
                <div>이유</div>
                <div>KRW 잔고</div>
                <div>BTC 잔고</div>
                <div>결과</div>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {tradeHistory.map((trade, index) => (
                  <div key={index} className="grid grid-cols-6 gap-4 text-sm border-b pb-2">
                    <div className="text-xs">{new Date(trade.datetime).toLocaleString('ko-KR')}</div>
                    <div className={`font-semibold ${trade.decision === 'buy' ? 'text-green-600' :
                      trade.decision === 'sell' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                      {trade.decision.toUpperCase()}
                    </div>
                    <div className="text-xs text-muted-foreground truncate" title={trade.reason}>
                      {trade.reason}
                    </div>
                    <div>{trade.krw_balance.toLocaleString('ko-KR')}원</div>
                    <div>{trade.btc_balance.toFixed(8)}</div>
                    <div className="text-xs text-muted-foreground">{trade.action_result}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">거래 내역이 없습니다</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
