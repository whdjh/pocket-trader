import { NextResponse } from 'next/server';
import { getFearAndGreedIndex } from '@/lib/fear-greed-index';

export async function GET() {
  try {
    const data = await getFearAndGreedIndex();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('공포탐욕지수 조회 오류:', error);
    return NextResponse.json({ error: '공포탐욕지수 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

