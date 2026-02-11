/**
 * Payment Hub — Database Connection
 *
 * Connects to the shared Neon PostgreSQL database used by ProofOfInfluence.
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

  const databaseUrl = process.env.PAYMENT_HUB_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "[payment-hub] Missing PAYMENT_HUB_DATABASE_URL or DATABASE_URL environment variable",
    );
  }

  const sql = neon(databaseUrl);
  _db = drizzle(sql, { schema });
  return _db;
}

export type PaymentHubDb = ReturnType<typeof getDb>;
