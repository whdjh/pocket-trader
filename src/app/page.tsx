'use client';

import { useAuth } from '@/lib/hooks/business/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

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
    <div className="p-8">
      <h1 className="text-2xl font-bold">Pocket Trader</h1>
      <p className="text-muted-foreground mt-2">개발 중...</p>
      {user && <p className="mt-4">안녕하세요, {user.name}님!</p>}
    </div>
  );
}
