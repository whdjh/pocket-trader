import OpenAI from 'openai'
import { OHLCVData } from './bithumb'
import { NewsArticle } from './serpapi'

// 타입 정의
export interface TradingDecision {
  decision: 'buy' | 'sell' | 'hold'
  percentage: number
  reason: string
}

interface ChartDataPayload {
  short_term: OHLCVData[] | null
  mid_term: OHLCVData[] | null
  long_term: OHLCVData[] | null
  news: NewsArticle[]
}

/**
 * OpenAI를 사용하여 트레이딩 결정을 분석합니다.
 */
export async function analyzeTradingDecision(
  shortTermData: OHLCVData[] | null,
  midTermData: OHLCVData[] | null,
  longTermData: OHLCVData[] | null,
  newsArticles: NewsArticle[]
): Promise<TradingDecision> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 환경변수가 설정되지 않았습니다')
  }

  const client = new OpenAI({ apiKey })

  // 데이터 페이로드 준비
  const dataPayload: ChartDataPayload = {
    short_term: shortTermData,
    mid_term: midTermData,
    long_term: longTermData,
    news: newsArticles,
  }

  const systemPrompt = `
You are an expert in cryptocurrency investing.

You invest according to the following principles:
Rule No.1: Never lose money.
Rule No.2: Never forget Rule No.1.

Analyze the provided data:
1. **Chart Data:** Multi-timeframe OHLCV data ('short_term': 1h, 'mid_term': 4h, 'long_term': daily). Use this for technical analysis.
2. **News Data:** A list of recent cryptocurrency news articles under the 'news' key, each containing 'title' and 'date'. Evaluate sentiment and potential market impact.

**Task:** Based on BOTH technical analysis AND news sentiment/implications, decide whether to **buy**, **sell**, or **hold** cryptocurrency.

**Output Format:** Respond ONLY in JSON format like the examples below.
{"decision": "buy", "percentage": 20, "reason": "some technical reason"}
{"decision": "sell", "percentage": 50, "reason": "some technical reason"}
{"decision": "hold", "percentage": 0, "reason": "some technical reason"}
`

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: JSON.stringify(dataPayload),
        },
      ],
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('OpenAI 응답이 비어있습니다')
    }

    const result = JSON.parse(content) as TradingDecision

    // 응답 검증
    if (!result.decision || !['buy', 'sell', 'hold'].includes(result.decision)) {
      throw new Error('잘못된 결정 형식입니다')
    }

    if (typeof result.percentage !== 'number' || result.percentage < 0 || result.percentage > 100) {
      throw new Error('잘못된 비율 형식입니다 (0-100 사이여야 함)')
    }

    if (!result.reason || typeof result.reason !== 'string') {
      throw new Error('이유가 제공되지 않았습니다')
    }

    return result
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`OpenAI 응답 파싱 실패: ${error.message}`)
    }
    if (error instanceof Error) {
      throw new Error(`OpenAI 분석 실패: ${error.message}`)
    }
    throw error
  }
}

/**
 * 환경변수에서 API 키를 가져와서 트레이딩 결정을 분석합니다.
 */
export async function analyzeTradingDecisionFromEnv(
  shortTermData: OHLCVData[] | null,
  midTermData: OHLCVData[] | null,
  longTermData: OHLCVData[] | null,
  newsArticles: NewsArticle[]
): Promise<TradingDecision> {
  return analyzeTradingDecision(shortTermData, midTermData, longTermData, newsArticles)
}

