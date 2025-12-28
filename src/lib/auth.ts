import { cookies } from 'next/headers';
import { readUsers } from './users';
import { getSession } from './session-file';
import type { CurrentUser } from '@/types/api';

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return null;
  }

  const userId = await getSession(sessionId);
  if (!userId) {
    return null;
  }

  const users = await readUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    upbitAccessKey: user.upbitAccessKey,
    upbitSecretKey: user.upbitSecretKey,
  };
}

