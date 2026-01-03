import { NextRequest, NextResponse } from 'next/server';
import { getUserById, verifyPassword } from '@/lib/db/users';
import { generateToken } from '@/lib/utils/jwt';

export async function POST(request: NextRequest) {
  try {
    const { id, password } = await request.json();

    if (!id || !password) {
      return NextResponse.json({ error: '아이디와 비밀번호를 입력해주세요' }, { status: 400 });
    }

    const user = await getUserById(id.trim());
    if (!user) {
      return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      console.error('비밀번호 검증 실패:', { userId: user.id, passwordLength: password.length, storedPasswordLength: user.password.length, storedPasswordStart: user.password.substring(0, 10) });
      return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다' }, { status: 401 });
    }

    const accessToken = await generateToken({ pk: user.pk, id: user.id, name: user.name });

    return NextResponse.json({ success: true, accessToken, user: { pk: user.pk, id: user.id, name: user.name } });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '로그인 중 오류가 발생했습니다' }, { status: 500 });
  }
}
