CREATE TABLE "trade_history" (
	"pk" serial PRIMARY KEY NOT NULL,
	"user_pk" integer NOT NULL,
	"coin" varchar(10) NOT NULL,
	"trading_mode" varchar(10) NOT NULL,
	"datetime" timestamp NOT NULL,
	"decision" varchar(10) NOT NULL,
	"reason" text NOT NULL,
	"fear_and_greed" integer NOT NULL,
	"krw_balance" numeric(20, 8) NOT NULL,
	"coin_balance" numeric(20, 8) NOT NULL,
	"action_result" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trading_settings" (
	"pk" serial PRIMARY KEY NOT NULL,
	"user_pk" integer NOT NULL,
	"coin" varchar(10),
	"rsi_buy_threshold" integer DEFAULT 30 NOT NULL,
	"rsi_sell_threshold" integer DEFAULT 70 NOT NULL,
	"investment_percent" numeric(5, 2) DEFAULT '5.00' NOT NULL,
	"stop_loss_percent" numeric(5, 2) DEFAULT '-3.00' NOT NULL,
	"take_profit_percent" numeric(5, 2) DEFAULT '6.00' NOT NULL,
	"is_auto_trading" boolean DEFAULT false NOT NULL,
	"trading_interval" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trading_settings_user_pk_unique" UNIQUE("user_pk")
);
--> statement-breakpoint
ALTER TABLE "trade_history" ADD CONSTRAINT "trade_history_user_pk_users_pk_fk" FOREIGN KEY ("user_pk") REFERENCES "public"."users"("pk") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trading_settings" ADD CONSTRAINT "trading_settings_user_pk_users_pk_fk" FOREIGN KEY ("user_pk") REFERENCES "public"."users"("pk") ON DELETE no action ON UPDATE no action;