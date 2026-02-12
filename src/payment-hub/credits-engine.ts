/**
 * Payment Hub — Credits Engine
 *
 * Core credit accounting service: balance queries, deductions, crediting, and usage recording.
 * Uses PostgreSQL row-level locking (SELECT FOR UPDATE) to prevent race conditions.
 *
 * All amounts are in credits (integer). $1 USD = 100 credits.
 * poiCredits is the unified consumption balance.
 */

import { eq, sql } from "drizzle-orm";
import { getDb } from "./db.js";
import { calculateCreditCost, type ModelPrice } from "./pricing.js";
import { users, userBalances, unifiedLedger, immortalityLedger, poiTiers } from "./schema.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BalanceInfo {
  poiCredits: number;
  immortalityCredits: number;
  total: number;
}

export interface DeductOptions {
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface CreditOptions {
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface UsageRecord {
  model: string;
  tokensIn: number;
  tokensOut: number;
  creditsCost: number;
  reference?: string;
}

// ─── Credits Engine ─────────────────────────────────────────────────────────

/**
 * Get user's credit balance.
 */
export async function getBalance(userId: string): Promise<BalanceInfo> {
  const db = getDb();
  const [balance] = await db.select().from(userBalances).where(eq(userBalances.userId, userId));

  if (!balance) {
    return { poiCredits: 0, immortalityCredits: 0, total: 0 };
  }

  return {
    poiCredits: balance.poiCredits,
    immortalityCredits: balance.immortalityCredits,
    total: balance.poiCredits + balance.immortalityCredits,
  };
}

/**
 * Deduct credits from user's poiCredits balance.
 *
 * Uses raw SQL with SELECT FOR UPDATE to prevent race conditions.
 * Returns false if insufficient balance.
 */
export async function deductCredits(
  userId: string,
  amount: number,
  scene: string,
  opts: DeductOptions = {},
): Promise<boolean> {
  if (amount <= 0) {
    return true;
  }

  const db = getDb();
  const metadataJson = opts.metadata ? JSON.stringify(opts.metadata) : null;

  // Atomic balance deduction + ledger insert using CTE.
  // Single SQL statement ensures atomicity under Neon HTTP mode
  // (each db.execute is a separate transaction boundary).
  const result = await db.execute(sql`
    WITH deducted AS (
      UPDATE user_balances
      SET poi_credits = poi_credits - ${amount},
          updated_at = NOW()
      WHERE user_id = ${userId}
        AND poi_credits >= ${amount}
      RETURNING user_id, poi_credits
    ),
    logged AS (
      INSERT INTO unified_ledger (user_id, type, amount_credits, scene, source, model, tokens_in, tokens_out, reference, metadata)
      SELECT
        user_id, 'debit', ${amount}, ${scene}, 'usage',
        ${opts.model ?? null}, ${opts.tokensIn ?? null}, ${opts.tokensOut ?? null},
        ${opts.reference ?? null},
        CASE WHEN ${metadataJson}::text IS NOT NULL
             THEN ${metadataJson}::jsonb
             ELSE NULL
        END
      FROM deducted
      RETURNING id
    )
    SELECT COUNT(*)::int AS cnt FROM logged
  `);

  const rows = result as unknown as Array<{ cnt: number }>;
  return (rows?.[0]?.cnt ?? 0) > 0;
}

/**
 * Credit (add) credits to user's poiCredits balance.
 *
 * Used by all payment channels: Stripe, USDC, USDT, SOL, POI burn, manual.
 */
export async function creditBalance(
  userId: string,
  amount: number,
  source: string,
  scene: string,
  opts: CreditOptions = {},
): Promise<void> {
  if (amount <= 0) {
    return;
  }

  const db = getDb();

  // Auto-provision user if not exists (FK: user_balances.user_id → users.id)
  await db.insert(users).values({ id: userId }).onConflictDoNothing();

  // Upsert balance (create if not exists)
  await db
    .insert(userBalances)
    .values({
      userId,
      poiCredits: amount,
      immortalityCredits: 0,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userBalances.userId,
      set: {
        poiCredits: sql`${userBalances.poiCredits} + ${amount}`,
        updatedAt: new Date(),
      },
    });

  // Record in unified_ledger
  await db.insert(unifiedLedger).values({
    userId,
    type: "credit",
    amountCredits: amount,
    scene,
    source,
    reference: opts.reference ?? null,
    metadata: opts.metadata ?? null,
  });

  // Backward compat: dual-write to immortality_ledger
  await db.insert(immortalityLedger).values({
    userId,
    type: "credit",
    amountCredits: amount,
    source,
    reference: opts.reference ?? null,
    metadata: opts.metadata ?? null,
  });
}

/**
 * Record AI usage and deduct credits in one operation.
 *
 * Called after an AI response is received with actual token counts.
 */
export async function recordUsageAndDeduct(
  userId: string,
  usage: UsageRecord,
  discountRate = 0,
  pricingOverrides?: Record<string, ModelPrice>,
): Promise<{ success: boolean; creditsCost: number }> {
  const creditsCost =
    usage.creditsCost > 0
      ? usage.creditsCost
      : calculateCreditCost(
          usage.model,
          usage.tokensIn,
          usage.tokensOut,
          discountRate,
          pricingOverrides,
        );

  const success = await deductCredits(userId, creditsCost, "agent", {
    model: usage.model,
    tokensIn: usage.tokensIn,
    tokensOut: usage.tokensOut,
    reference: usage.reference,
  });

  return { success, creditsCost };
}

/**
 * Get user's POI tier discount rate.
 *
 * Looks up the highest matching tier based on the user's POI balance.
 * Returns 0 if no tier matches (Free tier).
 */
export async function getUserDiscountRate(poiBalance: number): Promise<number> {
  const db = getDb();
  const tiers = await db
    .select()
    .from(poiTiers)
    .orderBy(sql`${poiTiers.minPoi} DESC`);

  for (const tier of tiers) {
    if (poiBalance >= tier.minPoi) {
      return Number(tier.feeDiscountRate);
    }
  }

  return 0;
}

/**
 * Migrate all immortalityCredits to poiCredits for all users.
 *
 * One-time migration: atomically moves immortalityCredits into poiCredits.
 * Records each migration in unified_ledger for audit trail.
 */
export async function migrateImmortalityToPoiCredits(): Promise<{
  usersAffected: number;
  totalCreditsMigrated: number;
}> {
  const db = getDb();

  // Get all users with positive immortalityCredits
  const usersWithCredits = await db
    .select({
      userId: userBalances.userId,
      immortalityCredits: userBalances.immortalityCredits,
    })
    .from(userBalances)
    .where(sql`${userBalances.immortalityCredits} > 0`);

  if (usersWithCredits.length === 0) {
    return { usersAffected: 0, totalCreditsMigrated: 0 };
  }

  // Atomic migration: move immortalityCredits → poiCredits
  await db.execute(sql`
    UPDATE user_balances
    SET poi_credits = poi_credits + immortality_credits,
        immortality_credits = 0,
        updated_at = NOW()
    WHERE immortality_credits > 0
  `);

  // Record migration in unified_ledger
  const ledgerEntries = usersWithCredits.map(
    (u: { userId: string; immortalityCredits: number }) => ({
      userId: u.userId,
      type: "credit" as const,
      amountCredits: u.immortalityCredits,
      scene: "migration",
      source: "migration",
      reference: "immortality_to_poi_credits",
      metadata: { migratedFrom: "immortalityCredits", originalAmount: u.immortalityCredits },
    }),
  );

  if (ledgerEntries.length > 0) {
    await db.insert(unifiedLedger).values(ledgerEntries);
  }

  const totalCreditsMigrated = usersWithCredits.reduce(
    (sum: number, u: { immortalityCredits: number }) => sum + u.immortalityCredits,
    0,
  );

  return {
    usersAffected: usersWithCredits.length,
    totalCreditsMigrated,
  };
}
