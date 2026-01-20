import axios from 'axios'
import { OHLCVData } from './upbit'
import { NewsArticle } from './serpapi'

const AIMODEL = process.env.GEMINI_MODEL

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

// Gemini를 사용하여 트레이딩 결정을 분석합니다.
export async function analyzeTradingDecision(
  shortTermData: OHLCVData[] | null,
  midTermData: OHLCVData[] | null,
  longTermData: OHLCVData[] | null,
  newsArticles: NewsArticle[]
): Promise<TradingDecision> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다')
  }

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

**IMPORTANT:** You MUST respond with ONLY valid JSON format, no additional text or markdown. Use this exact format:
{"decision": "buy", "percentage": 20, "reason": "some technical reason"}
{"decision": "sell", "percentage": 50, "reason": "some technical reason"}
{"decision": "hold", "percentage": 0, "reason": "some technical reason"}
`

  const prompt = `${systemPrompt}\n\nData:\n${JSON.stringify(dataPayload, null, 2)}\n\nRespond with JSON only:`

  const url = `https://generativelanguage.googleapis.com/v1/models/${AIMODEL}:generateContent?key=${apiKey}`

  try {
    const response = await axios.post(
      url,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text

    // JSON 추출 (마크다운 코드 블록 제거)
    let jsonText = content.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '')
    }

    const parsed = JSON.parse(jsonText) as TradingDecision

    return parsed
  } catch (error) {
    throw error
  }
}

// 환경변수에서 API 키를 가져와서 트레이딩 결정을 분석합니다.
export async function analyzeTradingDecisionFromEnv(
  shortTermData: OHLCVData[] | null,
  midTermData: OHLCVData[] | null,
  longTermData: OHLCVData[] | null,
  newsArticles: NewsArticle[]
): Promise<TradingDecision> {
  return analyzeTradingDecision(shortTermData, midTermData, longTermData, newsArticles)
}
