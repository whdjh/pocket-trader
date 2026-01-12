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

// 주요 코인 목록 (호재 분석 대상)
const MAJOR_COINS = ['XRP']

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
      return []
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

  if (!apiKey) throw new Error('SERPAPI_API_KEY가 필요합니다')

  // 코인 이름 결정
  let coinName: string
  if (coin) {
    // 코인 심볼이 제공된 경우 맵에서 찾거나 소문자로 변환
    coinName = COIN_NAME_MAP[coin.toUpperCase()] || coin.toLowerCase()
  } else {
    // 코인이 제공되지 않은 경우 기본값 사용 (하위 호환성)
    coinName = 'ripple'
  }

  // 해당 코인에 대한 뉴스 수집
  return getNewsForCoin(apiKey, coinName, numResultsPerCoin, location, language)
}

/** 환경변수에서 API 키를 가져와서 특정 코인의 뉴스를 수집 */
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

/** 여러 주요 코인의 뉴스를 수집하여 반환 (코인별로 그룹화) */
export async function getMultipleCoinsNewsFromEnv(
  coinSymbols: string[] = MAJOR_COINS,
  numResultsPerCoin: number = 3
): Promise<Record<string, NewsArticle[]>> {
  const apiKey = process.env.SERPAPI_API_KEY

  if (!apiKey) {
    throw new Error('SERPAPI_API_KEY 환경변수가 설정되지 않았습니다')
  }

  const newsByCoin: Record<string, NewsArticle[]> = {}

  // 모든 코인에 대해 병렬로 뉴스 수집
  const newsPromises = coinSymbols.map(async (coinSymbol) => {
    const news = await getCryptoNews({
      apiKey,
      location: 'us',
      language: 'en',
      numResultsPerCoin,
      coin: coinSymbol,
    })
    return { coinSymbol, news }
  })

  const results = await Promise.all(newsPromises)

  // 결과를 코인별로 그룹화
  for (const { coinSymbol, news } of results) {
    newsByCoin[coinSymbol] = news
  }

  return newsByCoin
}

