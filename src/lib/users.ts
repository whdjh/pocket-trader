import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import bcrypt from 'bcrypt';
import type { User } from '@/types/api';

const USERS_FILE = join(process.cwd(), 'data', 'users.json');

export async function readUsers(): Promise<User[]> {
  try {
    const data = await readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeUsers(users: User[]): Promise<void> {
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

export async function findUserById(id: string): Promise<User | null> {
  const users = await readUsers();
  return users.find(u => u.id === id) || null;
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

