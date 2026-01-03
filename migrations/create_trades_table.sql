-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  decision TEXT NOT NULL,
  percentage NUMERIC NOT NULL,
  btc_price NUMERIC NOT NULL,
  btc_balance NUMERIC NOT NULL,
  krw_balance NUMERIC NOT NULL,
  portfolio_value NUMERIC NOT NULL,
  profit_loss NUMERIC,
  profit_loss_pct NUMERIC,
  reason TEXT
);

-- Create index on timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp DESC);

