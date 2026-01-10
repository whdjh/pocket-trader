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

export interface CoinSelection {
  coin: string
  reason: string
  sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative'
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

    if (!content) {
      throw new Error('Gemini 응답이 비어있습니다')
    }

    // JSON 추출 (마크다운 코드 블록 제거)
    let jsonText = content.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '')
    }

    const parsed = JSON.parse(jsonText) as TradingDecision

    // 응답 검증
    if (!parsed.decision || !['buy', 'sell', 'hold'].includes(parsed.decision)) {
      throw new Error('잘못된 결정 형식입니다')
    }

    if (typeof parsed.percentage !== 'number' || parsed.percentage < 0 || parsed.percentage > 100) {
      throw new Error('잘못된 비율 형식입니다 (0-100 사이여야 함)')
    }

    if (!parsed.reason || typeof parsed.reason !== 'string') {
      throw new Error('이유가 제공되지 않았습니다')
    }

    return parsed
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const errorData = error.response?.data?.error
      const errorMsg = errorData?.message || error.message
      throw new Error(`Gemini API 오류 (${status}): ${errorMsg}`)
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Gemini 응답 파싱 실패: ${error.message}`)
    }
    if (error instanceof Error) {
      throw new Error(`Gemini 분석 실패: ${error.message}`)
    }
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

// 여러 코인의 뉴스를 분석하여 가장 호재가 있는 코인을 선택합니다.
export async function selectBestCoinFromNews(
  newsByCoin: Record<string, NewsArticle[]>
): Promise<CoinSelection> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다')
  }

  const systemPrompt = `
You are an expert in cryptocurrency market analysis specializing in identifying positive news and market opportunities.

Analyze the provided news articles for multiple cryptocurrencies. Each coin has a list of recent news articles with 'title' and 'date'.

**Task:** Based on the news sentiment and potential positive impact, select the ONE cryptocurrency that has the most positive news (호재) and is most likely to have a price increase.

**Criteria:**
- Look for positive news such as partnerships, adoption, technological breakthroughs, regulatory approvals, major exchange listings, etc.
- Avoid coins with mostly negative news or no significant news
- Consider the recency and importance of the news

**IMPORTANT:** You MUST respond with ONLY valid JSON format, no additional text or markdown. Use this exact format:
{"coin": "BTC", "reason": "Multiple positive news including...", "sentiment": "very_positive"}
{"coin": "ETH", "reason": "Positive news about...", "sentiment": "positive"}
{"coin": "SOL", "reason": "Neutral news, no significant developments", "sentiment": "neutral"}

Sentiment options: "very_positive", "positive", "neutral", "negative"
`

  const prompt = `${systemPrompt}\n\nNews Data:\n${JSON.stringify(newsByCoin, null, 2)}\n\nRespond with JSON only:`

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`

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

    if (!content) {
      throw new Error('Gemini 응답이 비어있습니다')
    }

    // JSON 추출 (마크다운 코드 블록 제거)
    let jsonText = content.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '')
    }

    const parsed = JSON.parse(jsonText) as CoinSelection

    // 응답 검증
    if (!parsed.coin || typeof parsed.coin !== 'string') {
      throw new Error('코인이 선택되지 않았습니다')
    }

    if (!parsed.reason || typeof parsed.reason !== 'string') {
      throw new Error('이유가 제공되지 않았습니다')
    }

    if (!parsed.sentiment || !['very_positive', 'positive', 'neutral', 'negative'].includes(parsed.sentiment)) {
      throw new Error('잘못된 감정 형식입니다')
    }

    return parsed
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const errorData = error.response?.data?.error
      const errorMsg = errorData?.message || error.message
      throw new Error(`Gemini API 오류 (${status}): ${errorMsg}`)
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Gemini 응답 파싱 실패: ${error.message}`)
    }
    if (error instanceof Error) {
      throw new Error(`코인 선택 실패: ${error.message}`)
    }
    throw error
  }
}