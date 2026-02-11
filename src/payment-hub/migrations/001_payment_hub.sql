-- Payment Hub: Schema Migration 001
-- Creates unified_ledger, api_keys, crypto_deposits, model_pricing tables
-- Run against the shared Neon PostgreSQL database (same as ProofOfInfluence)
--
-- Prerequisites: users, user_balances, poi_tiers tables must already exist.

BEGIN;

-- ─── 1. unified_ledger ─────────────────────────────────────────────────────
-- Upgrade of immortality_ledger: multi-scene + AI token tracking

CREATE TABLE IF NOT EXISTS unified_ledger (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL,              -- 'credit' | 'debit'
  amount_credits INTEGER NOT NULL,
  scene VARCHAR NOT NULL,             -- 'agent' | 'immortality' | 'otc_fee' | 'merchant' | 'airdrop' | 'topup' | 'migration'
  source VARCHAR NOT NULL,            -- 'stripe' | 'usdc_onchain' | 'usdt_topup' | 'sol_deposit' | 'poi_burn' | 'manual' | 'usage' | 'migration'
  model VARCHAR,                      -- e.g. 'claude-sonnet-4.5' (agent scene only)
  tokens_in INTEGER,                  -- input tokens (agent scene only)
  tokens_out INTEGER,                 -- output tokens (agent scene only)
  reference VARCHAR,                  -- tx_hash / session_id / order_id
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unified_ledger_user_id ON unified_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_unified_ledger_scene ON unified_ledger(scene);
CREATE INDEX IF NOT EXISTS idx_unified_ledger_source ON unified_ledger(source);
CREATE INDEX IF NOT EXISTS idx_unified_ledger_created_at ON unified_ledger(created_at);

-- ─── 2. api_keys ───────────────────────────────────────────────────────────
-- Multi-tenant API keys for programmatic access

CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  key_hash VARCHAR NOT NULL UNIQUE,   -- SHA-256 of full key
  key_prefix VARCHAR(12) NOT NULL,    -- 'poi_sk_xxxx' for display
  name VARCHAR NOT NULL,
  scopes JSONB DEFAULT '["agent"]'::jsonb,
  rate_limit_rpm INTEGER DEFAULT 60,
  rate_limit_tpm INTEGER DEFAULT 100000,
  allowed_models JSONB,               -- null = all models
  status VARCHAR NOT NULL DEFAULT 'active',  -- 'active' | 'suspended' | 'revoked'
  last_used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);

-- ─── 3. crypto_deposits ────────────────────────────────────────────────────
-- USDC/USDT/SOL multi-chain deposit records

CREATE TABLE IF NOT EXISTS crypto_deposits (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  tx_hash VARCHAR NOT NULL UNIQUE,
  chain VARCHAR NOT NULL,             -- 'base' | 'ethereum' | 'polygon' | 'solana'
  token VARCHAR NOT NULL,             -- 'USDC' | 'USDT' | 'SOL'
  amount NUMERIC(20,8) NOT NULL,      -- 8 decimals for SOL precision
  amount_usd NUMERIC(20,6),           -- USD equivalent at deposit time
  exchange_rate NUMERIC(20,6),        -- price oracle rate snapshot
  credits_granted INTEGER NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',  -- 'pending' | 'confirmed' | 'credited' | 'failed'
  block_number BIGINT,
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crypto_deposits_user_id ON crypto_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_status ON crypto_deposits(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_crypto_deposits_tx_hash ON crypto_deposits(tx_hash);

-- ─── 4. model_pricing ──────────────────────────────────────────────────────
-- AI model pricing configuration

CREATE TABLE IF NOT EXISTS model_pricing (
  id SERIAL PRIMARY KEY,
  model_name VARCHAR NOT NULL UNIQUE,
  provider VARCHAR NOT NULL,          -- 'anthropic' | 'openai' | 'deepseek' | 'google' | 'qwen'
  credits_per_m_input INTEGER NOT NULL,   -- Credits per 1M input tokens
  credits_per_m_output INTEGER NOT NULL,  -- Credits per 1M output tokens
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── 5. Seed model pricing data ────────────────────────────────────────────
-- $1 USD = 100 Credits. Prices include 20% platform markup.

INSERT INTO model_pricing (model_name, provider, credits_per_m_input, credits_per_m_output) VALUES
  ('claude-sonnet-4.5', 'anthropic', 36, 180),
  ('claude-haiku-4.5', 'anthropic', 12, 60),
  ('claude-opus-4.6', 'anthropic', 180, 900),
  ('gpt-5', 'openai', 15, 120),
  ('gpt-5-mini', 'openai', 3, 24),
  ('gpt-4o', 'openai', 60, 240),
  ('gpt-4o-mini', 'openai', 2, 7),
  ('deepseek-v3', 'deepseek', 3, 11),
  ('deepseek-r1', 'deepseek', 7, 28),
  ('qwen-local', 'qwen', 1, 3),
  ('gemini-2.0-flash', 'google', 1, 5)
ON CONFLICT (model_name) DO NOTHING;

COMMIT;
