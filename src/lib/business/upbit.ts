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

// UpbitConfig 인터페이스 정의
export interface UpbitConfig {
  accessKey: string
  secretKey: string
}

// Interval 타입 정의
export type Interval = '1m' | '3m' | '5m' | '10m' | '15m' | '30m' | '60m' | '240m' | 'day' | 'week' | 'month'

// 업비트 API 기본 URL
const UPBIT_API_URL = 'https://api.upbit.com/v1'

// Interval 매핑 (업비트 API 형식)
const INTERVAL_MAP: Record<string, number> = {
  '1m': 1,
  '3m': 3,
  '5m': 5,
  '10m': 10,
  '15m': 15,
  '30m': 30,
  '60m': 60,
  '1h': 60,
  '240m': 240,
  '6h': 240,
  '12h': 720,
  '720m': 720,
  '24h': 1440,
  'day': 1440,
}

// 업비트 API 응답 타입
interface UpbitApiResponse {
  error?: {
    name: string
    message: string
  }
  [key: string]: unknown
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

// 티커 정보 타입
interface TickerInfo {
  market: string
  trade_price: number
  [key: string]: unknown
}

// 캔들 정보 타입
interface CandleInfo {
  market: string
  candle_date_time_utc: string
  candle_date_time_kst: string
  opening_price: number
  high_price: number
  low_price: number
  trade_price: number
  timestamp: number
  candle_acc_trade_volume: number
  candle_acc_trade_price: number
  [key: string]: unknown
}

/**
 * 쿼리 문자열 생성 (업비트 API 방식)
 */
function createQueryString(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')
}

/**
 * JWT 토큰 생성 (업비트 API 방식)
 */
function createUpbitToken(
  accessKey: string,
  secretKey: string,
  queryString?: string
): string {
  const payload: Record<string, string | number> = {
    access_key: accessKey,
    nonce: uuidv4(),
  }

  if (queryString) {
    const hash = crypto.createHash('sha512').update(queryString, 'utf-8').digest('hex')
    payload.query_hash = hash
    payload.query_hash_alg = 'SHA512'
  }

  const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' })
  return `Bearer ${token}`
}

/**
 * 업비트 비공개 API 요청
 */
async function privateApiRequest(
  endpoint: string,
  params: Record<string, string>,
  config: UpbitConfig,
  method: 'GET' | 'POST' = 'GET'
): Promise<UpbitApiResponse> {
  const url = `${UPBIT_API_URL}${endpoint}`

  let queryString: string | undefined
  const headers: Record<string, string> = {}

  if (Object.keys(params).length > 0) {
    queryString = createQueryString(params)
  }

  const token = createUpbitToken(config.accessKey, config.secretKey, queryString)
  headers['Authorization'] = token

  try {
    let response
    if (method === 'GET') {
      response = await axios.get(url, { headers, params })
    } else {
      headers['Content-Type'] = 'application/json'
      response = await axios.post(url, params, { headers })
    }

    // 업비트 API는 배열을 직접 반환할 수 있음
    if (Array.isArray(response.data)) {
      return response.data as unknown as UpbitApiResponse
    }

    // 에러 응답 체크
    if (response.data.error) {
      throw new Error(`업비트 API 오류: ${response.data.error.message || response.data.error.name}`)
    }

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data
      const errorMessage =
        errorData?.error?.message ||
        errorData?.error?.name ||
        errorData?.message ||
        error.message
      throw new Error(`업비트 API 요청 실패: ${errorMessage}`)
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
  count: number,
  to?: string // 특정 시점 이전 데이터 가져오기 (ISO 8601 형식)
): Promise<OHLCVData[]> {
  let url: string

  // interval에 따라 적절한 엔드포인트 선택
  if (interval === 'day' || interval === '24h') {
    // 일봉
    url = `${UPBIT_API_URL}/candles/days`
  } else if (interval === 'week') {
    // 주봉
    url = `${UPBIT_API_URL}/candles/weeks`
  } else if (interval === 'month') {
    // 월봉
    url = `${UPBIT_API_URL}/candles/months`
  } else {
    // 분봉
    const upbitInterval = INTERVAL_MAP[interval] || 60 // 기본값 60분
    url = `${UPBIT_API_URL}/candles/minutes/${upbitInterval}`
  }

  try {
    const params: Record<string, string> = {
      market,
      count: Math.min(count, 200).toString(), // 업비트 최대 200개
    }

    if (to) {
      params.to = to
    }

    const response = await axios.get(url, { params })

    const candles = response.data as CandleInfo[]

    if (!Array.isArray(candles)) {
      throw new Error('차트 데이터 형식이 올바르지 않습니다')
    }

    // 업비트 API 응답 형식에 맞게 파싱
    const ohlcvData: OHLCVData[] = candles.map((candle) => ({
      time: candle.timestamp,
      open: candle.opening_price,
      high: candle.high_price,
      low: candle.low_price,
      close: candle.trade_price,
      volume: candle.candle_acc_trade_volume,
    }))

    // 업비트는 최신 데이터가 마지막에 오므로 역순으로 정렬
    return ohlcvData.reverse()
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`업비트 API: ${market} 마켓을 찾을 수 없습니다`)
      }
      const errorMessage = error.response?.data?.error?.message || error.message
      throw new Error(`차트 데이터 수집 실패: ${errorMessage}`)
    }
    throw error
  }
}

/**
 * 현재가 조회
 */
export async function getCurrentPrice(market: string): Promise<number> {
  const url = `${UPBIT_API_URL}/ticker`

  try {
    const response = await axios.get(url, {
      params: {
        markets: market,
      },
    })

    const tickers = response.data as TickerInfo[]

    if (!Array.isArray(tickers) || tickers.length === 0) {
      throw new Error('현재가 정보를 찾을 수 없습니다')
    }

    return tickers[0].trade_price
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`업비트 API: ${market} 마켓을 찾을 수 없습니다`)
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
 * 업비트에서 지원하는 모든 마켓 조회
 */
export async function getAllMarkets(): Promise<string[]> {
  const url = `${UPBIT_API_URL}/market/all`

  try {
    const response = await axios.get(url, {
      params: {
        isDetails: 'false',
      },
    })

    const markets = response.data as Array<{ market: string; korean_name: string; english_name: string }>

    if (!Array.isArray(markets)) {
      throw new Error('마켓 정보 형식이 올바르지 않습니다')
    }

    // KRW 마켓만 필터링
    return markets.filter((m) => m.market.startsWith('KRW-')).map((m) => m.market)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`마켓 목록 조회 실패: ${error.message}`)
    }
    throw error
  }
}

/**
 * 잔고 조회
 */
export async function getBalance(currency: string, config: UpbitConfig): Promise<number> {
  const endpoint = '/accounts'
  const params: Record<string, string> = {}

  try {
    const response = await privateApiRequest(endpoint, params, config, 'GET')

    // 업비트 API는 배열을 직접 반환
    if (!Array.isArray(response)) {
      throw new Error('잔고 정보 형식이 올바르지 않습니다')
    }

    const currencyUpper = currency.toUpperCase()
    const balanceInfo = (response as BalanceInfo[]).find(
      (bal) => bal.currency === currencyUpper
    )

    return balanceInfo ? parseFloat(balanceInfo.balance || '0') : 0
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
  config: UpbitConfig
): Promise<UpbitApiResponse> {
  const endpoint = '/orders'
  const params: Record<string, string> = {
    market,
    side: 'bid',
    ord_type: 'price',
    price: Math.floor(amount).toString(), // KRW 금액 (소수점 제거)
  }

  try {
    const response = await privateApiRequest(endpoint, params, config, 'POST')

    // 에러 체크
    if (response.error) {
      throw new Error(`업비트 API 오류: ${response.error.message || response.error.name}`)
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
  config: UpbitConfig
): Promise<UpbitApiResponse> {
  const endpoint = '/orders'
  const params: Record<string, string> = {
    market,
    side: 'ask',
    ord_type: 'market',
    volume: quantity.toString(),
  }

  try {
    const response = await privateApiRequest(endpoint, params, config, 'POST')

    // 에러 체크
    if (response.error) {
      throw new Error(`업비트 API 오류: ${response.error.message || response.error.name}`)
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
 * 환경변수에서 설정을 가져와서 UpbitConfig 생성
 */
export function getUpbitConfigFromEnv(): UpbitConfig {
  const accessKey = process.env.UPBIT_ACCESS_KEY
  const secretKey = process.env.UPBIT_SECRET_KEY

  if (!accessKey || !secretKey) {
    throw new Error('UPBIT_ACCESS_KEY와 UPBIT_SECRET_KEY 환경변수가 필요합니다')
  }

  return { accessKey, secretKey }
}
