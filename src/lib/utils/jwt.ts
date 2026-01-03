import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const encodedKey = new TextEncoder().encode(secretKey);

export interface TokenPayload {
  pk: number;
  id: string;
  name: string;
}

// JWT 토큰 생성 (24시간 만료)
export async function generateToken(payload: TokenPayload): Promise<string> {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('24h').sign(encodedKey);
  return token;
}

// JWT 토큰 검증
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}
