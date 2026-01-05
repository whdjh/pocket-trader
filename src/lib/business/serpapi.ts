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

// 주요 코인 목록
const MAJOR_COINS = ['bitcoin', 'ethereum', 'solana']

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

/** 주요 코인들의 뉴스를 모두 수집하여 반환 */
export async function getCryptoNews(params: GetCryptoNewsParams): Promise<NewsArticle[]> {
  const {
    apiKey,
    location = 'us',
    language = 'en',
    numResultsPerCoin = 5,
  } = params

  if (!apiKey) throw new Error('SERPAPI_API_KEY가 필요합니다')

  // 모든 주요 코인에 대해 병렬로 뉴스 수집
  const newsPromises = MAJOR_COINS.map((coin) =>
    getNewsForCoin(apiKey, coin, numResultsPerCoin, location, language)
  )

  const allNewsArrays = await Promise.all(newsPromises)

  // 모든 뉴스를 하나의 배열로 합치기
  const allNews: NewsArticle[] = []
  for (const newsArray of allNewsArrays) {
    allNews.push(...newsArray)
  }

  return allNews
}

/** 환경변수에서 API 키를 가져와서 주요 코인들의 뉴스를 수집 */
export async function getCryptoNewsFromEnv(
  numResultsPerCoin: number = 5
): Promise<NewsArticle[]> {
  const apiKey = process.env.SERPAPI_API_KEY

  if (!apiKey) {
    throw new Error('SERPAPI_API_KEY 환경변수가 설정되지 않았습니다')
  }

  return getCryptoNews({
    apiKey,
    location: 'us',
    language: 'en',
    numResultsPerCoin,
  })
}

