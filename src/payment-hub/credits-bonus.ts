/**
 * Credit Bonus System — Idempotent bonus grants for user acquisition.
 *
 * All bonuses are checked against unified_ledger to prevent double-granting.
 * Uses creditBalance() which auto-provisions users via upsert.
 */

import { eq, and } from "drizzle-orm";
import { creditBalance } from "./credits-engine.js";
import { getDb } from "./db.js";
import { unifiedLedger } from "./schema.js";

// ─── Bonus Amounts ──────────────────────────────────────────────────────────

const WELCOME_BONUS = 1_000;
const WALLET_BONUS = 5_000;
const EMAIL_BONUS = 10_000;

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Check if a bonus has already been granted for this user + source combo.
 */
async function hasBonusBeenGranted(userId: string, source: string): Promise<boolean> {
  const db = getDb();
  const existing = await db
    .select({ id: unifiedLedger.id })
    .from(unifiedLedger)
    .where(
      and(
        eq(unifiedLedger.userId, userId),
        eq(unifiedLedger.scene, "bonus"),
        eq(unifiedLedger.source, source),
      ),
    )
    .limit(1);
  return existing.length > 0;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Grant welcome bonus (1,000 credits) to a new user on first chat.
 *
 * @returns true if bonus was granted, false if already claimed.
 */
export async function grantWelcomeBonus(userId: string): Promise<boolean> {
  if (await hasBonusBeenGranted(userId, "welcome")) {
    return false;
  }
  await creditBalance(userId, WELCOME_BONUS, "welcome", "bonus", {
    reference: `welcome:${userId}`,
  });
  return true;
}

/**
 * Grant wallet connection bonus (5,000 credits).
 *
 * @returns true if bonus was granted, false if already claimed.
 */
export async function grantWalletBonus(userId: string, walletAddress: string): Promise<boolean> {
  if (await hasBonusBeenGranted(userId, "wallet_connect")) {
    return false;
  }
  await creditBalance(userId, WALLET_BONUS, "wallet_connect", "bonus", {
    reference: `wallet:${walletAddress}`,
  });
  return true;
}

/**
 * Grant email registration bonus (10,000 credits).
 *
 * @returns true if bonus was granted, false if already claimed.
 */
export async function grantEmailBonus(userId: string, email: string): Promise<boolean> {
  if (await hasBonusBeenGranted(userId, "email_register")) {
    return false;
  }
  await creditBalance(userId, EMAIL_BONUS, "email_register", "bonus", {
    reference: `email:${email}`,
  });
  return true;
}
