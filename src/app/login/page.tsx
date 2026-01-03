'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/business/useAuth';

export default function LoginPage() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { isAuthenticated, setAuth } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.push('/');
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!id.trim() || !password) {
      setError('아이디와 비밀번호를 입력해주세요');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id.trim(), password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        // Access token을 메모리에 저장
        setAuth(data.accessToken, data.user);
        router.push('/');
      } else {
        setError(data.error || '로그인 실패');
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">자동 트레이딩</CardTitle>
          <CardDescription className="text-center">로그인</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id">아이디</Label>
              <Input id="id" type="text" value={id} onChange={(e) => setId(e.target.value)} placeholder="아이디를 입력하세요" required autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호를 입력하세요" required />
            </div>
            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
            <Button type="submit" className="w-full">로그인</Button>
            <div className="text-center text-sm">
              <button type="button" onClick={() => router.push('/signup')} className="text-primary hover:underline">
                계정이 없으신가요? 회원가입
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
