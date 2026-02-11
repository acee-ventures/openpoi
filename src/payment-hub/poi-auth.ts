/**
 * Payment Hub — POI Auth Middleware
 *
 * Dual-mode authentication for OpenPOI gateway:
 * 1. API Key (Bearer poi_sk_...) — for programmatic multi-tenant access
 * 2. Fallback to existing gateway token auth — for backward compatibility
 *
 * Integrates with the native Node.js HTTP server (not Express).
 */

import type { IncomingMessage } from "node:http";
import { eq, and } from "drizzle-orm";
import { createHash } from "node:crypto";
import { getDb } from "./db.js";
import { apiKeys, users } from "./schema.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PoiAuthResult {
  ok: boolean;
  userId?: string;
  keyId?: string;
  role?: string;
  rateLimits?: { rpm: number; tpm: number };
  allowedModels?: string[] | null;
  method?: "api_key" | "gateway_token" | "admin_bypass";
  reason?: string;
}

export interface PoiAuthenticatedUser {
  userId: string;
  keyId?: string;
  role: string;
  method: "api_key" | "gateway_token" | "admin_bypass";
  rateLimits: { rpm: number; tpm: number };
  allowedModels: string[] | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const API_KEY_PREFIX = "poi_sk_";

// ─── Auth Functions ─────────────────────────────────────────────────────────

/**
 * Extract Bearer token from Authorization header.
 */
function getBearerToken(req: IncomingMessage): string | undefined {
  const header = req.headers.authorization;
  if (!header) {
    return undefined;
  }
  if (typeof header !== "string") {
    return undefined;
  }
  if (!header.startsWith("Bearer ")) {
    return undefined;
  }
  return header.slice(7).trim();
}

/**
 * Validate a POI API key against the database.
 *
 * Returns user info and rate limits if valid, null if invalid.
 */
export async function validateApiKey(key: string): Promise<PoiAuthResult> {
  if (!key.startsWith(API_KEY_PREFIX)) {
    return { ok: false, reason: "not-poi-key" };
  }

  const keyHash = createHash("sha256").update(key).digest("hex");
  const db = getDb();

  const [keyRecord] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.status, "active")));

  if (!keyRecord) {
    return { ok: false, reason: "invalid-or-revoked" };
  }

  // Check expiration
  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
    return { ok: false, reason: "expired" };
  }

  // Look up user role
  const [user] = await db.select().from(users).where(eq(users.id, keyRecord.userId));
  const role = user?.role ?? "user";

  // Update lastUsedAt asynchronously (non-blocking)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyRecord.id))
    .catch(() => {
      /* ignore update errors */
    });

  return {
    ok: true,
    userId: keyRecord.userId,
    keyId: keyRecord.id,
    role,
    rateLimits: {
      rpm: keyRecord.rateLimitRpm ?? 60,
      tpm: keyRecord.rateLimitTpm ?? 100000,
    },
    allowedModels: keyRecord.allowedModels as string[] | null,
    method: "api_key",
  };
}

/**
 * Authenticate an incoming request.
 *
 * Priority:
 * 1. POI API Key (Bearer poi_sk_...)
 * 2. Returns unauthenticated result (let caller decide to fallback to gateway token)
 */
export async function authenticateRequest(req: IncomingMessage): Promise<PoiAuthResult> {
  const token = getBearerToken(req);
  if (!token) {
    return { ok: false, reason: "no-token" };
  }

  // Check if it's a POI API key
  if (token.startsWith(API_KEY_PREFIX)) {
    return validateApiKey(token);
  }

  // Not a POI key — let the caller handle fallback to gateway token auth
  return { ok: false, reason: "not-poi-key" };
}

/**
 * Check if a request has a POI API key (quick check without DB query).
 */
export function hasPoiApiKey(req: IncomingMessage): boolean {
  const token = getBearerToken(req);
  return Boolean(token?.startsWith(API_KEY_PREFIX));
}

/**
 * Convert PoiAuthResult to PoiAuthenticatedUser (for use after successful auth).
 */
export function toAuthenticatedUser(result: PoiAuthResult): PoiAuthenticatedUser | null {
  if (!result.ok || !result.userId) {
    return null;
  }

  return {
    userId: result.userId,
    keyId: result.keyId,
    role: result.role ?? "user",
    method: result.method ?? "api_key",
    rateLimits: result.rateLimits ?? { rpm: 60, tpm: 100000 },
    allowedModels: result.allowedModels ?? null,
  };
}
