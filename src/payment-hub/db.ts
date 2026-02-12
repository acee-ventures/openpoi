/**
 * Payment Hub — Database Connection
 *
 * Connects to the shared Neon PostgreSQL database used by ProofOfInfluence.
 * Uses DATABASE_URL (shared with POI main app) as primary connection string.
 * Uses @neondatabase/serverless for HTTP-based queries (no persistent connections needed).
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) {
    return _db;
  }

  const databaseUrl = process.env.DATABASE_URL || process.env.PAYMENT_HUB_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("[payment-hub] Missing DATABASE_URL environment variable");
  }

  // Strip params unsupported by Neon HTTP driver (channel_binding is wire-protocol only)
  const sanitized = new URL(databaseUrl);
  sanitized.searchParams.delete("channel_binding");
  const cleanUrl = sanitized.toString();

  const sql = neon(cleanUrl);
  _db = drizzle(sql, { schema });
  return _db;
}

export type PaymentHubDb = ReturnType<typeof getDb>;
