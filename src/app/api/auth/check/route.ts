import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const payload = await verifyToken(accessToken);
    if (!payload) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: { pk: payload.pk, id: payload.id, name: payload.name } });
  } catch (error) {
    console.error('토큰 확인 오류:', error);
    return NextResponse.json({ error: '토큰 확인 중 오류가 발생했습니다' }, { status: 500 });
  }
}