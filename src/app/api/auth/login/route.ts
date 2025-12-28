import { NextRequest, NextResponse } from 'next/server';
import { readUsers, verifyPassword } from '@/lib/users';
import { createSession } from '@/lib/session-file';

export async function POST(request: NextRequest) {
  try {
    const { id, password } = await request.json();

    if (!id || !password) {
      return NextResponse.json(
        { error: 'ID와 비밀번호를 입력해주세요' },
        { status: 400 }
      );
    }

    const users = await readUsers();
    const user = users.find(u => u.id === id);

    if (!user) {
      return NextResponse.json(
        { error: 'ID 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'ID 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      );
    }

    // 세션 생성
    const sessionId = await createSession(user.id);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
      },
    });

    // 쿠키 설정
    response.cookies.set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24시간
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

