import { pgTable, serial, text, numeric, timestamp } from 'drizzle-orm/pg-core';

export const trades = pgTable('trades', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  decision: text('decision').notNull(), // 'buy', 'sell', 'hold'
  percentage: numeric('percentage').notNull(),
  btc_price: numeric('btc_price').notNull(),
  btc_balance: numeric('btc_balance').notNull(),
  krw_balance: numeric('krw_balance').notNull(),
  portfolio_value: numeric('portfolio_value').notNull(),
  profit_loss: numeric('profit_loss'),
  profit_loss_pct: numeric('profit_loss_pct'),
  reason: text('reason'),
});

