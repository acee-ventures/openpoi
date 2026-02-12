/**
 * Identity Service — Progressive Identity Management (Google OAuth)
 *
 * Follows Firebase/Supabase progressive identity patterns:
 * - Guest connects → device identity auto-registered
 * - Bind Google → frontend gets ID Token → backend verifies → user_identities
 * - Bind wallet → user_identities + users.walletAddress
 * - Recovery → find old user via Google, transfer credits, reassign identity
 *
 * Uses POI's shared user_identities table (provider="device" | "google" | "wallet").
 * userId is never changed on upgrade (Firebase pattern).
 */

import { eq, and } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";
import { grantEmailBonus, grantWalletBonus } from "./credits-bonus.js";
import { creditBalance, getBalance } from "./credits-engine.js";
import { getDb } from "./db.js";
import { users, userIdentities, accountRecoveryLog } from "./schema.js";

// ─── Google OAuth2 Client ───────────────────────────────────────────────────

let _oauth2Client: OAuth2Client | null = null;

function getGoogleClient(): OAuth2Client {
  if (_oauth2Client) {
    return _oauth2Client;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("[identity] Missing GOOGLE_CLIENT_ID");
  }

  _oauth2Client = new OAuth2Client(clientId);
  return _oauth2Client;
}

interface GoogleTokenPayload {
  sub: string; // Google user ID (stable across sessions)
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

/**
 * Verify a Google ID Token (from frontend Google Sign-In).
 * Returns the decoded payload containing sub, email, etc.
 */
async function verifyGoogleIdToken(credential: string): Promise<GoogleTokenPayload> {
  const client = getGoogleClient();
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new Error("Invalid Google ID token");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: payload.email_verified ?? false,
    name: payload.name,
    picture: payload.picture,
  };
}

// ─── Device Registration ────────────────────────────────────────────────────

/**
 * Register a device identity for a new user.
 * Called on first WebSocket connect when user has a new deviceId.
 * Idempotent: skips if device identity already exists.
 */
export async function registerDevice(userId: string): Promise<void> {
  const db = getDb();

  const existing = await db
    .select({ id: userIdentities.id })
    .from(userIdentities)
    .where(and(eq(userIdentities.provider, "device"), eq(userIdentities.providerUserId, userId)))
    .limit(1);

  if (existing.length > 0) {
    return;
  }

  await db.insert(userIdentities).values({
    userId,
    provider: "device",
    providerUserId: userId,
    updatedAt: new Date(),
  });

  console.log(`[identity] Registered device identity for ${userId.slice(0, 8)}...`);
}

// ─── Google Binding ─────────────────────────────────────────────────────────

/**
 * Bind a Google account to the user via ID Token.
 *
 * 1. Verify ID Token → extract sub, email
 * 2. Check if Google identity already bound to another user
 * 3. Upsert google identity in user_identities
 * 4. Update users.email + users.emailVerified
 * 5. Grant email bonus (idempotent)
 *
 * @returns { email, bonusGranted }
 */
export async function bindGoogle(
  userId: string,
  credential: string,
): Promise<{ email: string; bonusGranted: boolean; googleSub: string }> {
  const db = getDb();
  const payload = await verifyGoogleIdToken(credential);

  // Check if Google identity is already bound to a DIFFERENT user
  const existingBinding = await db
    .select({ userId: userIdentities.userId })
    .from(userIdentities)
    .where(
      and(eq(userIdentities.provider, "google"), eq(userIdentities.providerUserId, payload.sub)),
    )
    .limit(1);

  if (existingBinding.length > 0 && existingBinding[0].userId !== userId) {
    throw new Error("This Google account is already linked to another user.");
  }

  // Upsert google identity
  await db
    .insert(userIdentities)
    .values({
      userId,
      provider: "google",
      providerUserId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userIdentities.provider, userIdentities.providerUserId],
      set: {
        userId,
        email: payload.email,
        emailVerified: payload.email_verified,
        updatedAt: new Date(),
      },
    });

  // Update users table with email from Google
  await db
    .update(users)
    .set({ email: payload.email, emailVerified: payload.email_verified })
    .where(eq(users.id, userId));

  // Grant email bonus (idempotent)
  const bonusGranted = await grantEmailBonus(userId, payload.email);

  console.log(`[identity] Google bound: ${payload.email} → user ${userId.slice(0, 8)}...`);

  return { email: payload.email, bonusGranted, googleSub: payload.sub };
}

// ─── Wallet Binding ─────────────────────────────────────────────────────────

/**
 * Bind a wallet address to the user.
 *
 * 1. Creates wallet identity in user_identities
 * 2. Updates users.walletAddress
 * 3. Grants wallet bonus (idempotent)
 */
export async function bindWallet(
  userId: string,
  walletAddress: string,
): Promise<{ bonusGranted: boolean }> {
  const db = getDb();
  const normalizedWallet = walletAddress.toLowerCase();

  // Check if wallet is bound to another user
  const existingBinding = await db
    .select({ userId: userIdentities.userId })
    .from(userIdentities)
    .where(eq(userIdentities.walletAddress, normalizedWallet))
    .limit(1);

  if (existingBinding.length > 0 && existingBinding[0].userId !== userId) {
    throw new Error("This wallet is already linked to another account.");
  }

  // Upsert wallet identity
  await db
    .insert(userIdentities)
    .values({
      userId,
      provider: "wallet",
      walletAddress: normalizedWallet,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userIdentities.walletAddress],
      set: {
        userId,
        updatedAt: new Date(),
      },
    });

  // Update users table
  await db.update(users).set({ walletAddress: normalizedWallet }).where(eq(users.id, userId));

  // Grant wallet bonus (idempotent)
  const bonusGranted = await grantWalletBonus(userId, normalizedWallet);

  console.log(
    `[identity] Wallet bound: ${normalizedWallet.slice(0, 10)}... → user ${userId.slice(0, 8)}...`,
  );

  return { bonusGranted };
}

// ─── Account Recovery ───────────────────────────────────────────────────────

/**
 * Recover an account via Google identity.
 *
 * Flow:
 * 1. Verify Google ID Token → get sub
 * 2. Find old user via google identity (provider=google, providerUserId=sub)
 * 3. Transfer all credits from old to new (via ledger)
 * 4. Reassign google identity to new userId
 * 5. Log in account_recovery_log
 *
 * Does NOT delete old user (audit trail preserved).
 */
export async function recoverByGoogle(
  credential: string,
  newUserId: string,
): Promise<{ recovered: boolean; creditsTransferred: number; oldUserId?: string; email?: string }> {
  const db = getDb();
  const payload = await verifyGoogleIdToken(credential);

  // Find old user via google identity
  const [googleIdentity] = await db
    .select()
    .from(userIdentities)
    .where(
      and(eq(userIdentities.provider, "google"), eq(userIdentities.providerUserId, payload.sub)),
    )
    .limit(1);

  if (!googleIdentity || googleIdentity.userId === newUserId) {
    return { recovered: false, creditsTransferred: 0 };
  }

  const oldUserId = googleIdentity.userId;

  // Get old user's balance
  const balance = await getBalance(oldUserId);
  const totalCredits = balance.total;

  if (totalCredits > 0) {
    // Debit old user
    await creditBalance(oldUserId, -totalCredits, "account_recovery_out", "recovery", {
      reference: `recovery:${oldUserId}→${newUserId}`,
    });

    // Credit new user
    await creditBalance(newUserId, totalCredits, "account_recovery_in", "recovery", {
      reference: `recovery:${oldUserId}→${newUserId}`,
    });
  }

  // Reassign google identity to new user
  await db
    .update(userIdentities)
    .set({ userId: newUserId, updatedAt: new Date() })
    .where(eq(userIdentities.id, googleIdentity.id));

  // Update users table
  await db
    .update(users)
    .set({ email: payload.email, emailVerified: payload.email_verified })
    .where(eq(users.id, newUserId));

  // Clear email from old user
  await db.update(users).set({ email: null, emailVerified: false }).where(eq(users.id, oldUserId));

  // Log recovery
  await db.insert(accountRecoveryLog).values({
    oldUserId,
    newUserId,
    creditsTransferred: totalCredits,
    method: "google",
  });

  console.log(
    `[identity] Account recovered via Google: ${oldUserId.slice(0, 8)}... → ${newUserId.slice(0, 8)}... (${totalCredits} credits)`,
  );

  return { recovered: true, creditsTransferred: totalCredits, oldUserId, email: payload.email };
}

// ─── Account Info ───────────────────────────────────────────────────────────

export interface AccountInfo {
  userId: string;
  email: string | null;
  emailVerified: boolean;
  walletAddress: string | null;
  identityCount: number;
}

/**
 * Get account identity status.
 */
export async function getAccountInfo(userId: string): Promise<AccountInfo> {
  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  const identities = await db
    .select({ id: userIdentities.id })
    .from(userIdentities)
    .where(eq(userIdentities.userId, userId));

  return {
    userId,
    email: user?.email ?? null,
    emailVerified: user?.emailVerified ?? false,
    walletAddress: user?.walletAddress ?? null,
    identityCount: identities.length,
  };
}
