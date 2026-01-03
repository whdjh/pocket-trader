import { pgTable, varchar, timestamp, serial, integer, decimal, text, boolean } from 'drizzle-orm/pg-core';

// Users: pk(int4, serial), id(로그인용, 고유), password(bcrypt), name
export const users = pgTable('users', {
  pk: serial('pk').primaryKey(),
  id: varchar('id', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Trading Settings: users.pk 참조 (1:1), 코인 선택 및 거래 설정
export const tradingSettings = pgTable('trading_settings', {
  pk: serial('pk').primaryKey(),
  userPk: integer('user_pk').notNull().unique().references(() => users.pk),
  coin: varchar('coin', { length: 10 }), // 수동 모드용 코인 (BTC, ETH 등), AI 모드일 때는 null
  rsiBuyThreshold: integer('rsi_buy_threshold').notNull().default(30),
  rsiSellThreshold: integer('rsi_sell_threshold').notNull().default(70),
  investmentPercent: decimal('investment_percent', { precision: 5, scale: 2 }).notNull().default('5.00'),
  stopLossPercent: decimal('stop_loss_percent', { precision: 5, scale: 2 }).notNull().default('-3.00'),
  takeProfitPercent: decimal('take_profit_percent', { precision: 5, scale: 2 }).notNull().default('6.00'),
  isAutoTrading: boolean('is_auto_trading').notNull().default(false),
  tradingInterval: integer('trading_interval').notNull().default(5), // 분 단위
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Trade History: users.pk 참조, 거래 기록
export const tradeHistory = pgTable('trade_history', {
  pk: serial('pk').primaryKey(),
  userPk: integer('user_pk').notNull().references(() => users.pk),
  coin: varchar('coin', { length: 10 }).notNull(), // 거래한 코인
  tradingMode: varchar('trading_mode', { length: 10 }).notNull(), // 'manual' | 'ai'
  datetime: timestamp('datetime').notNull(),
  decision: varchar('decision', { length: 10 }).notNull(), // 'buy' | 'sell' | 'hold'
  reason: text('reason').notNull(),
  fearAndGreed: integer('fear_and_greed').notNull(),
  krwBalance: decimal('krw_balance', { precision: 20, scale: 8 }).notNull(),
  coinBalance: decimal('coin_balance', { precision: 20, scale: 8 }).notNull(), // 코인별 잔고
  actionResult: text('action_result').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
