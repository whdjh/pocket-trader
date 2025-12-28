// ============================================
// 사용자 관련 타입
// ============================================

export interface User {
  id: string;
  name: string;
  password: string; // 해시된 비밀번호
  upbitAccessKey: string;
  upbitSecretKey: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  upbitAccessKey: string;
  upbitSecretKey: string;
}

// ============================================
// 인증 API 타입
// ============================================

export interface LoginRequest {
  id: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    name: string;
  };
  error?: string;
}

export interface LogoutResponse {
  success: boolean;
}

// ============================================
// 트레이딩 API 타입 (추후 추가 예정)
// ============================================

export interface TradingStatusResponse {
  isRunning: boolean;
  startedAt?: string;
  lastCheck?: string;
  positions?: Position[];
  recentTrades?: Trade[];
}

export interface Position {
  coin: string;
  amount: number;
  buyPrice: number;
  currentPrice: number;
  profitRate: number;
}

export interface Trade {
  id: string;
  coin: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  timestamp: string;
}

export interface StartTradingResponse {
  success: boolean;
  error?: string;
}

export interface StopTradingResponse {
  success: boolean;
  error?: string;
}

