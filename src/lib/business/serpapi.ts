import axios from 'axios'

// NewsArticle 인터페이스 정의
export interface NewsArticle {
  title: string | null
  date: string | null
}

// SerpAPI 응답 타입 정의
interface SerpApiResponse {
  news_results?: Array<{
    title?: string
    date?: string
  }>
}

// 코인 심볼을 뉴스 검색용 이름으로 변환하는 맵
const COIN_NAME_MAP: Record<string, string> = { XRP: 'ripple' }

// GetCryptoNewsParams 인터페이스 정의
interface GetCryptoNewsParams {
  apiKey: string
  location?: string
  language?: string
  numResultsPerCoin?: number
}

/** 단일 코인에 대한 뉴스를 가져오는 내부 함수 */
async function getNewsForCoin(
  apiKey: string,
  coin: string,
  numResults: number,
  location: string,
  language: string
): Promise<NewsArticle[]> {
  const apiUrl = 'https://serpapi.com/search.json'
  const requestParams = {
    engine: 'google_news',
    q: `${coin} news`,
    gl: location,
    hl: language,
    api_key: apiKey,
  }

  try {
    const response = await axios.get<SerpApiResponse>(apiUrl, { params: requestParams })

    const newsData: NewsArticle[] = []

    if (response.data.news_results) {
      for (const newsItem of response.data.news_results.slice(0, numResults)) {
        newsData.push({
          title: newsItem.title || null,
          date: newsItem.date || null,
        })
      }
    }

    return newsData
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`${coin} 뉴스 수집 실패: ${error.message}`)
    }
    throw error
  }
}

/** 특정 코인에 대한 뉴스를 수집하여 반환 */
export async function getCryptoNews(params: GetCryptoNewsParams & { coin?: string }): Promise<NewsArticle[]> {
  const {
    apiKey,
    location = 'us',
    language = 'en',
    numResultsPerCoin = 5,
    coin,
  } = params
  // 코인 이름 결정
  if (!coin) {
    throw new Error('coin 파라미터가 필요합니다.')
  }

  const coinName = COIN_NAME_MAP[coin.toUpperCase()] || coin.toLowerCase()

  // 해당 코인에 대한 뉴스 수집
  return getNewsForCoin(apiKey, coinName, numResultsPerCoin, location, language)
}

/** 환경변수에서 API 키를 가져와서 코인의 뉴스를 수집 */
export async function getCryptoNewsFromEnv(
  coinSymbol?: string,
  numResults: number = 5
): Promise<NewsArticle[]> {
  const apiKey = process.env.SERPAPI_API_KEY

  if (!apiKey) {
    throw new Error('SERPAPI_API_KEY 환경변수가 설정되지 않았습니다')
  }

  return getCryptoNews({
    apiKey,
    location: 'us',
    language: 'en',
    numResultsPerCoin: numResults,
    coin: coinSymbol,
  })
}