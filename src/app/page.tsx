'use client';

import { useAuth } from '@/lib/hooks/business/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useFearAndGreed } from '@/lib/hooks/queries/useFearAndGreed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 공포탐욕지수 색상 및 레이블
const getFearGreedColor = (value: number) => {
  if (value >= 75) return 'text-red-600';
  if (value >= 55) return 'text-orange-600';
  if (value >= 45) return 'text-yellow-600';
  if (value >= 25) return 'text-green-600';
  return 'text-blue-600';
};

const getFearGreedLabel = (value: number) => {
  if (value >= 75) return '극도의 탐욕';
  if (value >= 55) return '탐욕';
  if (value >= 45) return '중립';
  if (value >= 25) return '공포';
  return '극도의 공포';
};

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { data: fearAndGreed, isLoading: isLoadingFearGreed } = useFearAndGreed();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="p-8">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden p-3">
      {/* 헤더 */}
      <div className="mb-2">
        <h1 className="text-lg font-bold">Pocket Trader</h1>
        {user && <p className="text-xs text-muted-foreground">안녕하세요, {user.name}님!</p>}
      </div>

      {/* 공포탐욕지수 - 맨 상단 */}
      <Card className="mb-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">공포탐욕지수</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingFearGreed ? (
            <div className="text-[10px] text-muted-foreground text-center py-2">로딩 중...</div>
          ) : fearAndGreed ? (
            <div className="flex items-center gap-4">
              <div className="relative w-32 h-20">
                {/* 반원 게이지 */}
                <svg className="w-full h-full" viewBox="0 0 200 100">
                  {/* 배경 반원 */}
                  <path
                    d="M 20 80 A 80 80 0 0 1 180 80"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* 값에 따른 반원 */}
                  {(() => {
                    const value = parseInt(fearAndGreed.value);
                    const angle = (value / 100) * 180;
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
                        strokeWidth="8"
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    );
                  })()}
                </svg>
                {/* 중앙 값 표시 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold">
                    {fearAndGreed.value}
                  </div>
                  <div className={`text-[10px] font-semibold mt-0.5 ${getFearGreedColor(parseInt(fearAndGreed.value))}`}>
                    {getFearGreedLabel(parseInt(fearAndGreed.value))}
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="text-xs text-muted-foreground">
                  <div>분류: {fearAndGreed.valueClassification}</div>
                  <div className="text-[10px]">업데이트: {new Date(parseInt(fearAndGreed.timestamp) * 1000).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-muted-foreground text-center py-2">데이터를 불러올 수 없습니다</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
