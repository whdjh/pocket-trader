// API 타입 정의

// User 타입
export interface User {
  pk: number;
  id: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Trading Settings 타입
export interface TradingSettings {
  pk: number;
  userPk: number;
  coin: string | null;
  rsiBuyThreshold: number;
  rsiSellThreshold: number;
  investmentPercent: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  isAutoTrading: boolean;
  tradingInterval: number;
  createdAt: Date;
  updatedAt: Date;
}

// Trade History 타입
export interface TradeHistory {
  pk: number;
  userPk: number;
  coin: string;
  tradingMode: 'manual' | 'ai';
  datetime: Date;
  decision: 'buy' | 'sell' | 'hold';
  reason: string;
  fearAndGreed: number;
  krwBalance: number;
  coinBalance: number;
  actionResult: string;
  createdAt: Date;
}

