// 메모리 기반 세션 관리
interface Session {
  userId: string;
  expiresAt: number;
}

// Next.js는 각 요청마다 모듈을 분리할 수 있으므로 global 객체 사용
declare global {
  var __sessions: Map<string, Session> | undefined;
}

const sessions = globalThis.__sessions || new Map<string, Session>();
if (!globalThis.__sessions) {
  globalThis.__sessions = sessions;
}

// 만료된 세션 정리 (주기적으로 실행)
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(sessionId);
    }
  }
}

// 1분마다 만료된 세션 정리
setInterval(cleanupExpiredSessions, 60 * 1000);

export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24시간

  sessions.set(sessionId, { userId, expiresAt });

  return sessionId;
}

export async function getSession(sessionId: string): Promise<string | null> {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  // 만료 체크
  if (session.expiresAt < Date.now()) {
    sessions.delete(sessionId);
    return null;
  }

  return session.userId;
}

export async function deleteSession(sessionId: string): Promise<void> {
  sessions.delete(sessionId);
}

