import axios from 'axios'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

// OHLCVData 인터페이스 정의
export interface OHLCVData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Balance 인터페이스 정의
export interface Balance {
  total: number
  available: number
  inUse: number
}

// BithumbConfig 인터페이스 정의
export interface BithumbConfig {
  accessKey: string
  secretKey: string
}

// Interval 타입 정의
export type Interval = '1m' | '3m' | '5m' | '10m' | '30m' | '1h' | '6h' | '12h' | '24h' | 'day'

// 빗썸 API 기본 URL
const BITHUMB_API_URL = 'https://api.bithumb.com'

// Interval 매핑 (python_bithumb 스타일)
const INTERVAL_MAP: Record<string, Interval> = {
  minute1: '1m',
  minute3: '3m',
  minute5: '5m',
  minute10: '10m',
  minute30: '30m',
  minute60: '1h',
  minute240: '6h',
  minute720: '12h',
  day: '24h',
}

// 빗썸 API 응답 타입
interface BithumbApiResponse {
  status?: string
  message?: string
  data?: Record<string, unknown> | unknown[]
}

// 잔고 정보 타입
interface BalanceInfo {
  currency: string
  balance: string
  locked: string
  avg_buy_price: string
  avg_buy_price_modified: boolean
  unit_currency: string
}

/**
 * JWT 토큰 생성 (빗썸 API 방식)
 */
function createBithumbToken(
  accessKey: string,
  secretKey: string,
  queryHash?: string
): string {
  const payload: Record<string, string | number> = {
    access_key: accessKey,
    nonce: uuidv4(),
    timestamp: Math.round(Date.now()),
  }

  if (queryHash) {
    payload.query_hash = queryHash
    payload.query_hash_alg = 'SHA512'
  }

  const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' })
  return `Bearer ${token}`
}

/**
 * 빗썸 비공개 API 요청
 */
async function privateApiRequest(
  endpoint: string,
  params: Record<string, string>,
  config: BithumbConfig,
  method: 'GET' | 'POST' = 'POST'
): Promise<BithumbApiResponse> {
  const url = `${BITHUMB_API_URL}${endpoint}`

  let queryHash: string | undefined
  let requestData: string | undefined

  if (method === 'POST' && Object.keys(params).length > 0) {
    // POST 요청: query_hash 생성 (SHA512) - JSON 문자열을 해싱
    requestData = JSON.stringify(params)
    queryHash = crypto.createHash('sha512').update(requestData).digest('hex')
  } else if (method === 'GET' && Object.keys(params).length > 0) {
    // GET 요청: query_hash 생성 - URL 인코딩된 쿼리 문자열을 해싱
    const queryString = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&')
    queryHash = crypto.createHash('sha512').update(queryString).digest('hex')
  }

  const token = createBithumbToken(config.accessKey, config.secretKey, queryHash)

  const headers: Record<string, string> = {
    Authorization: token,
  }

  if (method === 'POST') {
    headers['Content-Type'] = 'application/json'
  }

  try {
    let response
    if (method === 'GET') {
      response = await axios.get(url, { headers, params })
    } else {
      response = await axios.post(url, requestData, { headers })
    }
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data
      const errorMessage =
        errorData?.error?.message ||
        errorData?.message ||
        errorData?.status ||
        error.message
      throw new Error(`빗썸 API 요청 실패: ${errorMessage}`)
    }
    throw error
  }
}

/**
 * OHLCV 차트 데이터 수집
 */
export async function getOHLCV(
  market: string,
  interval: string,
  count: number
): Promise<OHLCVData[]> {
  const bithumbInterval = INTERVAL_MAP[interval] || interval

  // market 형식: "KRW-BTC" -> base는 BTC
  const parts = market.split('-')
  const base = parts[parts.length - 1] // 마지막 부분이 base 통화
  const symbol = `${base}_KRW`

  const url = `${BITHUMB_API_URL}/public/candlestick/${symbol}/${bithumbInterval}`

  try {
    const response = await axios.get(url)
    const data = response.data

    if (data.status !== '0000') {
      throw new Error(`빗썸 API 오류: ${data.message || '알 수 없는 오류'}`)
    }

    // 빗썸 API 응답 형식에 맞게 파싱
    const ohlcvData: OHLCVData[] = []
    const candles = data.data || []

    // 최신 데이터부터 count개만큼 가져오기
    for (let i = 0; i < Math.min(count, candles.length); i++) {
      const candle = candles[i]
      ohlcvData.push({
        time: parseInt(candle[0]),
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
      })
    }

    return ohlcvData.reverse() // 시간순으로 정렬
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`차트 데이터 수집 실패: ${error.message}`)
    }
    throw error
  }
}

/**
 * 현재가 조회
 */
export async function getCurrentPrice(market: string): Promise<number> {
  // market 형식: "KRW-BTC" -> base는 BTC
  const parts = market.split('-')
  const base = parts[parts.length - 1] // 마지막 부분이 base 통화
  // 빗썸 API는 통화 코드만 사용 (예: BTC, ETH)
  const url = `${BITHUMB_API_URL}/public/ticker/${base}_KRW`

  try {
    const response = await axios.get(url)
    const data = response.data

    // 빗썸 API 응답 형식: { status: "0000", data: { closing_price: "..." } }
    if (data.status && data.status !== '0000') {
      throw new Error(`빗썸 API 오류: ${data.message || '알 수 없는 오류'}`)
    }

    // data.data.closing_price 형식
    if (data.data && data.data.closing_price) {
      return parseFloat(data.data.closing_price)
    }

    throw new Error('현재가 정보를 찾을 수 없습니다')
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // 404 등 HTTP 오류 처리
      if (error.response?.status === 404) {
        throw new Error(`빗썸 API: ${base} 코인을 찾을 수 없습니다`)
      }
      throw new Error(`현재가 조회 실패: ${error.message}`)
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error('알 수 없는 오류가 발생했습니다')
  }
}

/**
 * 잔고 조회
 */
export async function getBalance(currency: string, config: BithumbConfig): Promise<number> {
  const endpoint = '/v1/accounts'
  const params: Record<string, string> = {}

  try {
    const response = await privateApiRequest(endpoint, params, config, 'GET')

    // 빗썸 API 응답은 배열 형태
    if (Array.isArray(response)) {
      const currencyUpper = currency.toUpperCase()
      const balanceInfo = response.find(
        (bal: BalanceInfo) => bal.currency === currencyUpper
      ) as BalanceInfo | undefined
      return balanceInfo ? parseFloat(balanceInfo.balance || '0') : 0
    }

    // 응답이 객체인 경우
    if (response.status && response.status !== '0000') {
      throw new Error(`빗썸 API 오류: ${response.message || '알 수 없는 오류'}`)
    }

    // data가 배열인 경우
    if (Array.isArray(response.data)) {
      const currencyUpper = currency.toUpperCase()
      const balanceInfo = (response.data as BalanceInfo[]).find(
        (bal) => bal.currency === currencyUpper
      )
      return balanceInfo ? parseFloat(balanceInfo.balance || '0') : 0
    }

    return 0
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`잔고 조회 실패: ${error.message}`)
    }
    throw error
  }
}

/**
 * 시장가 매수
 */
export async function buyMarketOrder(
  market: string,
  amount: number,
  config: BithumbConfig
): Promise<BithumbApiResponse> {
  const parts = market.split('-')
  const base = parts[parts.length - 1]
  const endpoint = '/v1/orders'
  const params: Record<string, string> = {
    market: `${base}-KRW`,
    side: 'bid',
    ord_type: 'price',
    price: amount.toFixed(0), // KRW 금액
  }

  try {
    const response = await privateApiRequest(endpoint, params, config, 'POST')

    if (response.status && response.status !== '0000') {
      throw new Error(`빗썸 API 오류: ${response.message || '알 수 없는 오류'}`)
    }

    return response
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`매수 주문 실패: ${error.message}`)
    }
    throw error
  }
}

/**
 * 시장가 매도
 */
export async function sellMarketOrder(
  market: string,
  quantity: number,
  config: BithumbConfig
): Promise<BithumbApiResponse> {
  const parts = market.split('-')
  const base = parts[parts.length - 1]
  const endpoint = '/v1/orders'
  const params: Record<string, string> = {
    market: `${base}-KRW`,
    side: 'ask',
    volume: quantity.toFixed(8),
    ord_type: 'market',
  }

  try {
    const response = await privateApiRequest(endpoint, params, config, 'POST')

    if (response.status && response.status !== '0000') {
      throw new Error(`빗썸 API 오류: ${response.message || '알 수 없는 오류'}`)
    }

    return response
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`매도 주문 실패: ${error.message}`)
    }
    throw error
  }
}

/**
 * 환경변수에서 설정을 가져와서 BithumbConfig 생성
 */
export function getBithumbConfigFromEnv(): BithumbConfig {
  const accessKey = process.env.BITHUMB_ACCESS_KEY
  const secretKey = process.env.BITHUMB_SECRET_KEY

  if (!accessKey || !secretKey) {
    throw new Error('BITHUMB_ACCESS_KEY와 BITHUMB_SECRET_KEY 환경변수가 필요합니다')
  }

  return { accessKey, secretKey }
}

