import { db, schema } from './index';
import { eq } from 'drizzle-orm';
import type { TradingSettings } from '@/types/api-type';

// DB 결과를 TradingSettings 타입으로 변환
function mapToTradingSettings(row: any): TradingSettings {
  return {
    pk: row.pk,
    userPk: row.userPk,
    coin: row.coin,
    rsiBuyThreshold: row.rsiBuyThreshold,
    rsiSellThreshold: row.rsiSellThreshold,
    investmentPercent: parseFloat(String(row.investmentPercent)),
    stopLossPercent: parseFloat(String(row.stopLossPercent)),
    takeProfitPercent: parseFloat(String(row.takeProfitPercent)),
    isAutoTrading: row.isAutoTrading,
    tradingInterval: row.tradingInterval,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// 사용자별 트레이딩 설정 조회
export async function getTradingSettingsByUserPk(userPk: number): Promise<TradingSettings | null> {
  const [settings] = await db.select().from(schema.tradingSettings).where(eq(schema.tradingSettings.userPk, userPk)).limit(1);
  return settings ? mapToTradingSettings(settings) : null;
}

// 트레이딩 설정 생성 (기본값)
export async function createTradingSettings(userPk: number): Promise<TradingSettings> {
  const [created] = await db.insert(schema.tradingSettings).values({ userPk }).returning();
  return mapToTradingSettings(created);
}

// 트레이딩 설정 업데이트
export async function updateTradingSettings(userPk: number, data: Partial<Omit<TradingSettings, 'pk' | 'userPk' | 'createdAt' | 'updatedAt'>>): Promise<TradingSettings> {
  const updateData: Partial<{
    coin: string | null;
    rsiBuyThreshold: number;
    rsiSellThreshold: number;
    investmentPercent: string;
    stopLossPercent: string;
    takeProfitPercent: string;
    isAutoTrading: boolean;
    tradingInterval: number;
    updatedAt: Date;
  }> = { updatedAt: new Date() };

  if (data.coin !== undefined) updateData.coin = data.coin;
  if (data.rsiBuyThreshold !== undefined) updateData.rsiBuyThreshold = data.rsiBuyThreshold;
  if (data.rsiSellThreshold !== undefined) updateData.rsiSellThreshold = data.rsiSellThreshold;
  if (data.investmentPercent !== undefined) updateData.investmentPercent = String(data.investmentPercent);
  if (data.stopLossPercent !== undefined) updateData.stopLossPercent = String(data.stopLossPercent);
  if (data.takeProfitPercent !== undefined) updateData.takeProfitPercent = String(data.takeProfitPercent);
  if (data.isAutoTrading !== undefined) updateData.isAutoTrading = data.isAutoTrading;
  if (data.tradingInterval !== undefined) updateData.tradingInterval = data.tradingInterval;

  const [updated] = await db.update(schema.tradingSettings).set(updateData).where(eq(schema.tradingSettings.userPk, userPk)).returning();
  return mapToTradingSettings(updated);
}

// 트레이딩 설정 생성 또는 업데이트 (upsert)
export async function upsertTradingSettings(userPk: number, data?: Partial<Omit<TradingSettings, 'pk' | 'userPk' | 'createdAt' | 'updatedAt'>>): Promise<TradingSettings> {
  const existing = await getTradingSettingsByUserPk(userPk);
  if (existing) {
    return data ? updateTradingSettings(userPk, data) : existing;
  }
  const created = await createTradingSettings(userPk);
  return data ? updateTradingSettings(userPk, data) : created;
}

