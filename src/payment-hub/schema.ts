/**
 * Payment Hub — Database Schema (Drizzle ORM)
 *
 * These tables extend the existing ProofOfInfluence database.
 * Shares the same Neon PostgreSQL instance.
 *
 * Existing tables referenced (read/write from this service):
 *   - users(id, wallet_address, email, email_verified, role, plan)
 *   - user_identities(id, user_id, provider, provider_user_id, email, email_verified, wallet_address)
 *   - user_balances(user_id PK, immortality_credits, poi_credits, updated_at)
 *   - poi_tiers(id, name, min_poi, fee_discount_rate, ...)
 *   - immortality_ledger(id, user_id, type, amount_credits, source, reference, metadata, created_at)
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  integer,
  bigint,
  numeric,
  boolean,
  serial,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Existing tables (read/write references) ────────────────────────────────

/** users — reference (owned by ProofOfInfluence, columns already exist in DB) */
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  walletAddress: varchar("wallet_address"),
  email: varchar("email").unique(),
  emailVerified: boolean("email_verified").default(false),
  role: varchar("role"),
  plan: varchar("plan"),
});

/**
 * user_identities — reference (owned by ProofOfInfluence)
 *
 * Multi-provider identity binding. OpenPOI adds provider="device" for deviceId tracking.
 * Existing providers: email | google | apple | wallet
 */
export const userIdentities = pgTable(
  "user_identities",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    provider: varchar("provider", { length: 32 }).notNull(), // email | google | apple | wallet | device
    providerUserId: varchar("provider_user_id", { length: 255 }), // sub/email/address/deviceId
    email: varchar("email", { length: 255 }),
    emailVerified: boolean("email_verified").default(false).notNull(),
    walletAddress: varchar("wallet_address", { length: 64 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uniq_identity_provider_uid")
      .on(table.provider, table.providerUserId)
      .where(sql`provider_user_id IS NOT NULL`),
    uniqueIndex("uniq_identity_wallet")
      .on(table.walletAddress)
      .where(sql`wallet_address IS NOT NULL`),
    index("idx_identity_user").on(table.userId),
    index("idx_identity_email").on(table.email),
  ],
);

/** user_balances — read + write (poi_credits is the unified balance) */
export const userBalances = pgTable("user_balances", {
  userId: varchar("user_id").primaryKey(),
  immortalityCredits: integer("immortality_credits").default(0).notNull(),
  poiCredits: integer("poi_credits").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** poi_tiers — read-only (membership levels for discount) */
export const poiTiers = pgTable("poi_tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  minPoi: bigint("min_poi", { mode: "number" }).notNull(),
  feeDiscountRate: numeric("fee_discount_rate", { precision: 5, scale: 4 }).notNull().default("0"),
});

/** immortality_ledger — write-only for backward compat dual-write */
export const immortalityLedger = pgTable("immortality_ledger", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  type: varchar("type").notNull(),
  amountCredits: integer("amount_credits").notNull(),
  source: varchar("source").notNull(),
  reference: varchar("reference"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── New tables (owned by Payment Hub) ──────────────────────────────────────

/**
 * unified_ledger — Upgrade of immortality_ledger with multi-scene + AI token tracking
 *
 * Every credit/debit across the ACEE ecosystem is recorded here.
 */
export const unifiedLedger = pgTable(
  "unified_ledger",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    type: varchar("type").notNull(), // 'credit' | 'debit'
    amountCredits: integer("amount_credits").notNull(),
    scene: varchar("scene").notNull(), // 'agent' | 'immortality' | 'otc_fee' | 'merchant' | 'airdrop' | 'topup'
    source: varchar("source").notNull(), // 'stripe' | 'usdc_onchain' | 'usdt_topup' | 'sol_deposit' | 'poi_burn' | 'manual' | 'migration'
    model: varchar("model"), // e.g. 'claude-sonnet-4.5' (agent scene only)
    tokensIn: integer("tokens_in"), // input tokens (agent scene only)
    tokensOut: integer("tokens_out"), // output tokens (agent scene only)
    reference: varchar("reference"), // tx_hash / session_id / order_id
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_unified_ledger_user_id").on(table.userId),
    index("idx_unified_ledger_scene").on(table.scene),
    index("idx_unified_ledger_source").on(table.source),
    index("idx_unified_ledger_created_at").on(table.createdAt),
  ],
);

// ─── API Keys ─────────────────────────────────────────────────────────────────
// Multi-tenant access keys
/**
 * poi_api_keys — Multi-tenant API keys for programmatic access to OpenPOI gateway
 *
 * Key format: poi_sk_ + 32-byte hex (64 chars)
 * Storage: SHA-256 hash of full key
 */
export const apiKeys = pgTable(
  "poi_api_keys",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    keyHash: varchar("key_hash").notNull().unique(), // SHA-256 of the key
    keyPrefix: varchar("key_prefix", { length: 12 }).notNull(), // 'poi_sk_xxxx' for display
    name: varchar("name").notNull(),
    scopes: jsonb("scopes").default(sql`'["agent"]'::jsonb`),
    rateLimitRpm: integer("rate_limit_rpm").default(60), // requests per minute
    rateLimitTpm: integer("rate_limit_tpm").default(100000), // tokens per minute
    allowedModels: jsonb("allowed_models"), // null = all models
    status: varchar("status").default("active").notNull(), // 'active' | 'suspended' | 'revoked'
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => [
    index("idx_api_keys_user_id").on(table.userId),
    uniqueIndex("idx_api_keys_key_hash").on(table.keyHash),
    index("idx_api_keys_status").on(table.status),
  ],
);

/**
 * crypto_deposits — USDC/USDT/SOL multi-chain deposit records
 *
 * USDT TRC20 uses existing creditTopupOrders table (owned by POI).
 * This table handles USDC (EVM) and SOL deposits.
 */
export const cryptoDeposits = pgTable(
  "crypto_deposits",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    txHash: varchar("tx_hash").notNull().unique(),
    chain: varchar("chain").notNull(), // 'base' | 'ethereum' | 'polygon' | 'solana'
    token: varchar("token").notNull(), // 'USDC' | 'USDT' | 'SOL'
    amount: numeric("amount", { precision: 20, scale: 8 }).notNull(), // 8 decimals for SOL precision
    amountUsd: numeric("amount_usd", { precision: 20, scale: 6 }), // USD equivalent (for SOL, at deposit time)
    exchangeRate: numeric("exchange_rate", { precision: 20, scale: 6 }), // price oracle rate snapshot
    creditsGranted: integer("credits_granted").notNull(),
    status: varchar("status").default("pending").notNull(), // 'pending' | 'confirmed' | 'credited' | 'failed'
    blockNumber: bigint("block_number", { mode: "number" }),
    confirmedAt: timestamp("confirmed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_crypto_deposits_user_id").on(table.userId),
    index("idx_crypto_deposits_status").on(table.status),
    uniqueIndex("idx_crypto_deposits_tx_hash").on(table.txHash),
  ],
);

/**
 * model_pricing — AI model pricing configuration
 *
 * Credits per 1M tokens (input/output separately).
 * $1 USD = 100 Credits. Includes 20% platform markup over provider cost.
 */
export const modelPricing = pgTable("model_pricing", {
  id: serial("id").primaryKey(),
  modelName: varchar("model_name").notNull().unique(),
  provider: varchar("provider").notNull(), // 'anthropic' | 'openai' | 'deepseek' | 'google' | 'qwen'
  creditsPerMInput: integer("credits_per_m_input").notNull(), // Credits per 1M input tokens
  creditsPerMOutput: integer("credits_per_m_output").notNull(), // Credits per 1M output tokens
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Identity — Progressive Identity (owned by OpenPOI) ────────────────────

/**
 * account_recovery_log — Audit trail for credit transfers during account recovery
 */
export const accountRecoveryLog = pgTable(
  "account_recovery_log",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    oldUserId: varchar("old_user_id").notNull(),
    newUserId: varchar("new_user_id").notNull(),
    creditsTransferred: integer("credits_transferred").notNull(),
    method: varchar("method").notNull(), // 'google' | 'wallet'
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_recovery_old_user").on(table.oldUserId),
    index("idx_recovery_new_user").on(table.newUserId),
  ],
);

// ─── Types ──────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type UserIdentity = typeof userIdentities.$inferSelect;
export type InsertUserIdentity = typeof userIdentities.$inferInsert;
export type UserBalance = typeof userBalances.$inferSelect;
export type PoiTier = typeof poiTiers.$inferSelect;

export type UnifiedLedgerEntry = typeof unifiedLedger.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type CryptoDeposit = typeof cryptoDeposits.$inferSelect;
export type ModelPricingEntry = typeof modelPricing.$inferSelect;
export type AccountRecoveryLogEntry = typeof accountRecoveryLog.$inferSelect;
