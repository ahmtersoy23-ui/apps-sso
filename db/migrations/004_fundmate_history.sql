-- FundMate analysis history table
CREATE TABLE IF NOT EXISTS fundmate_analysis_history (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id),
  company VARCHAR(255) NOT NULL DEFAULT '-',
  country VARCHAR(5) NOT NULL,
  month VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  currency VARCHAR(10) NOT NULL,
  max_pct NUMERIC(5,2) NOT NULL DEFAULT 20,
  support_pct NUMERIC(5,2) NOT NULL DEFAULT 50,
  rate NUMERIC(12,4) NOT NULL DEFAULT 1,
  total_sales NUMERIC(14,2) NOT NULL DEFAULT 0,
  order_fees NUMERIC(14,2) NOT NULL DEFAULT 0,
  refund_fees NUMERIC(14,2) NOT NULL DEFAULT 0,
  storage_fees NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_fees NUMERIC(14,2) NOT NULL DEFAULT 0,
  eligible_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  support_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  support_amount_try NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fundmate_history_created ON fundmate_analysis_history(created_at DESC);
CREATE INDEX idx_fundmate_history_company ON fundmate_analysis_history(company);
