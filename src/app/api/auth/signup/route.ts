import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserById } from '@/lib/db/users';
import { generateToken } from '@/lib/utils/jwt';

export async function POST(request: NextRequest) {
  try {
    const { id, password, name } = await request.json();

    if (!id || !password || !name) {
      return NextResponse.json({ error: '모든 필드를 입력해주세요' }, { status: 400 });
    }

    const existingUser = await getUserById(id.trim());
    if (existingUser) {
      return NextResponse.json({ error: '이미 존재하는 아이디입니다' }, { status: 400 });
    }

    const user = await createUser(id.trim(), password, name.trim());
    const accessToken = await generateToken({ pk: user.pk, id: user.id, name: user.name });

    return NextResponse.json({ success: true, accessToken, user: { pk: user.pk, id: user.id, name: user.name } });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: '회원가입 중 오류가 발생했습니다' }, { status: 500 });
  }
}