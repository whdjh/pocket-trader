'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/business/useAuth';

export default function SignupPage() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { isAuthenticated, setAuth } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.push('/');
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!id.trim() || !password || !name.trim()) {
      setError('모든 필드를 입력해주세요');
      return;
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id.trim(), password, name: name.trim() }),
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        setAuth(data.accessToken, data.user); // Access token을 메모리에 저장
        router.push('/');
      } else {
        setError(data.error || '회원가입 실패');
      }
    } catch {
      setError('회원가입 중 오류가 발생했습니다');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">자동 트레이딩</CardTitle>
          <CardDescription className="text-center">회원가입</CardDescription>
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
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력하세요" required />
            </div>
            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
            <Button type="submit" className="w-full">회원가입</Button>
            <div className="text-center text-sm">
              <button type="button" onClick={() => router.push('/login')} className="text-primary hover:underline">
                이미 계정이 있으신가요? 로그인
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

