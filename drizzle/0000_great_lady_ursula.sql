CREATE TABLE "trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"decision" text NOT NULL,
	"percentage" numeric NOT NULL,
	"coin_symbol" text,
	"btc_price" numeric NOT NULL,
	"btc_balance" numeric NOT NULL,
	"krw_balance" numeric NOT NULL,
	"portfolio_value" numeric NOT NULL,
	"profit_loss" numeric,
	"profit_loss_pct" numeric,
	"reason" text
);
