import { NextResponse } from 'next/server';

interface FearGreedResponse {
  name: string;
  data: Array<{
    value: string;
    value_classification: string;
    timestamp: string;
    time_until_update?: string;
  }>;
  metadata: {
    error?: string;
  };
}

export async function GET() {
  try {
    const response = await fetch('https://api.alternative.me/fng/', {
      next: { revalidate: 300 }, // 5분마다 캐시 갱신
    });

    if (!response.ok) {
      throw new Error(`Fear & Greed API error: ${response.status}`);
    }

    const data: FearGreedResponse = await response.json();

    if (data.metadata?.error) {
      throw new Error(`Fear & Greed API error: ${data.metadata.error}`);
    }

    const latest = data.data[0];
    
    return NextResponse.json({
      value: parseInt(latest.value),
      classification: latest.value_classification,
      timestamp: latest.timestamp,
    });
  } catch (error) {
    console.error('Error fetching fear & greed index:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fear & greed index', value: null, classification: null },
      { status: 500 }
    );
  }
}

