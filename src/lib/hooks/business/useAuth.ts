import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AuthUser {
  pk: number;
  id: string;
  name: string;
}

const ACCESS_TOKEN_KEY = 'accessToken';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadTokenFromStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      return token;
    }
    return null;
  }, []);

  const saveTokenToStorage = useCallback((token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
  }, []);

  const removeTokenFromStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const token = accessToken || loadTokenFromStorage();
      if (!token) {
        setUser(null);
        setAccessToken(null);
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/auth/check', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAccessToken(token);
        setUser(data.user);
        saveTokenToStorage(token);
      } else {
        removeTokenFromStorage();
        setUser(null);
        setAccessToken(null);
        router.push('/login');
      }
    } catch {
      removeTokenFromStorage();
      setUser(null);
      setAccessToken(null);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, loadTokenFromStorage, saveTokenToStorage, removeTokenFromStorage, router]);

  useEffect(() => {
    const token = loadTokenFromStorage();
    if (token) {
      setAccessToken(token);
    }
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAuth = useCallback((token: string, userData: AuthUser) => {
    setAccessToken(token);
    setUser(userData);
    saveTokenToStorage(token);
    setIsLoading(false);
  }, [saveTokenToStorage]);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      removeTokenFromStorage();
      setUser(null);
      setAccessToken(null);
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return {
    user,
    accessToken,
    isAuthenticated: !!user,
    isLoading,
    checkAuth,
    setAuth,
    logout,
  };
}