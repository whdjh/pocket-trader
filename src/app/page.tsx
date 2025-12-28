'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/check')
      .then(res => {
        if (!res.ok) {
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  return (
    <div className="p-8 space-y-6">
      {/* 트레이딩 제어 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            트레이딩 시작
          </Button>
          <div className="text-sm text-muted-foreground">
            상태: 중지
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          전략: RSI 전략 | 코인: BTC, ETH
        </div>
      </div>

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
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">BTC 0.015</div>
                <div className="text-sm text-muted-foreground">평단: 39,300,000원</div>
              </div>
              <div className="text-right">
                <div className="font-medium">40,200,000원</div>
                <div className="text-sm text-green-600">+3.2%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 실시간 거래 로그 */}
      <Card>
        <CardHeader>
          <CardTitle>실시간 거래 로그</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono">
            <div>15:03 BTC 매수 0.005 (평단 39,850,000)</div>
            <div>15:12 RSI &gt; 70 → 50% 매도익절</div>
            <div>15:16 RSI 재진입 구간 진입 대기 중...</div>
          </div>
        </CardContent>
      </Card>

      {/* 잔고 */}
      <Card>
        <CardHeader>
          <CardTitle>잔고</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>KRW: 1,000,000원</div>
            <div>BTC: 0.001</div>
            <div>ETH: 0.1</div>
            <div className="pt-2 border-t font-semibold">총 자산: 1,500,000원</div>
          </div>
        </CardContent>
      </Card>

      {/* 거래 내역 */}
      <Card>
        <CardHeader>
          <CardTitle>거래 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-4 text-sm font-medium pb-2 border-b">
              <div>시간</div>
              <div>코인</div>
              <div>타입</div>
              <div>가격</div>
              <div>수량</div>
            </div>
            <div className="grid grid-cols-5 gap-4 text-sm">
              <div>2024-01-01 10:00</div>
              <div>BTC</div>
              <div>매수</div>
              <div>50,000,000원</div>
              <div>0.001</div>
            </div>
            <div className="grid grid-cols-5 gap-4 text-sm">
              <div>2024-01-01 11:00</div>
              <div>ETH</div>
              <div>매수</div>
              <div>3,000,000원</div>
              <div>0.1</div>
            </div>
            <div className="grid grid-cols-5 gap-4 text-sm">
              <div>2024-01-01 12:00</div>
              <div>BTC</div>
              <div>매도</div>
              <div>52,000,000원</div>
              <div>0.001</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
