import { db, schema } from './index';
import { eq, desc } from 'drizzle-orm';
import type { TradeHistory } from '@/types/api-type';

// DB 결과를 TradeHistory 타입으로 변환
function mapToTradeHistory(row: any): TradeHistory {
  return {
    pk: row.pk,
    userPk: row.userPk,
    coin: row.coin,
    tradingMode: row.tradingMode as 'manual' | 'ai',
    datetime: row.datetime,
    decision: row.decision as 'buy' | 'sell' | 'hold',
    reason: row.reason,
    fearAndGreed: row.fearAndGreed,
    krwBalance: parseFloat(String(row.krwBalance)),
    coinBalance: parseFloat(String(row.coinBalance)),
    actionResult: row.actionResult,
    createdAt: row.createdAt,
  };
}

// 거래 기록 생성
export async function createTradeHistory(data: Omit<TradeHistory, 'pk' | 'createdAt'>): Promise<TradeHistory> {
  const [created] = await db.insert(schema.tradeHistory).values({
    userPk: data.userPk,
    coin: data.coin,
    tradingMode: data.tradingMode,
    datetime: data.datetime,
    decision: data.decision,
    reason: data.reason,
    fearAndGreed: data.fearAndGreed,
    krwBalance: String(data.krwBalance),
    coinBalance: String(data.coinBalance),
    actionResult: data.actionResult,
  }).returning();
  return mapToTradeHistory(created);
}

// 사용자별 거래 기록 조회 (최신순)
export async function getTradeHistoryByUserPk(userPk: number, limit?: number): Promise<TradeHistory[]> {
  const baseQuery = db.select().from(schema.tradeHistory).where(eq(schema.tradeHistory.userPk, userPk)).orderBy(desc(schema.tradeHistory.datetime));
  const results = limit ? await baseQuery.limit(limit) : await baseQuery;
  return results.map(mapToTradeHistory);
}

// 특정 거래 기록 조회
export async function getTradeHistoryByPk(pk: number): Promise<TradeHistory | null> {
  const [history] = await db.select().from(schema.tradeHistory).where(eq(schema.tradeHistory.pk, pk)).limit(1);
  return history ? mapToTradeHistory(history) : null;
}

