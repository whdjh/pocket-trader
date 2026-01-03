import { db, schema } from './index';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { User } from '@/types/api-type';

// 사용자 생성: pk 자동생성, password 해시
export async function createUser(id: string, password: string, name: string): Promise<User> {
  const pk = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const [created] = await db.insert(schema.users).values({ pk, id, password: passwordHash, name }).returning();
  return created;
}

// PK로 조회
export async function getUserByPk(pk: string): Promise<User | null> {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.pk, pk)).limit(1);
  return user || null;
}

// ID(로그인용)로 조회
export async function getUserById(id: string): Promise<User | null> {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  return user || null;
}

// 사용자 정보 업데이트: password 있으면 해시 처리
export async function updateUser(pk: string, data: { name?: string; password?: string }): Promise<User> {
  const updateData: Partial<{ name: string; password: string; updatedAt: Date }> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.password !== undefined) updateData.password = await bcrypt.hash(data.password, 10);
  const [updated] = await db.update(schema.users).set(updateData).where(eq(schema.users.pk, pk)).returning();
  return updated;
}

// 비밀번호 검증
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
