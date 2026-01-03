'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="p-8">
      <h1 className="text-2xl font-bold">Pocket Trader</h1>
      <p className="text-muted-foreground mt-2">개발 중...</p>
    </div>
  );
}
