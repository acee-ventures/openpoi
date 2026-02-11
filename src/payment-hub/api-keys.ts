/**
 * Payment Hub — API Key Management
 *
 * CRUD operations for API keys + internal validation endpoint.
 * HTTP handlers work with native Node.js IncomingMessage/ServerResponse.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes, createHash } from "node:crypto";
import { getDb } from "./db.js";
import { authenticateRequest, toAuthenticatedUser } from "./poi-auth.js";
import { apiKeys, users } from "./schema.js";

// ─── Constants ──────────────────────────────────────────────────────────────

const API_KEY_PREFIX = "poi_sk_";
const MAX_KEYS_PER_USER = 10;

// ─── Helpers ────────────────────────────────────────────────────────────────

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: IncomingMessage, maxBytes = 1024 * 64): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf-8");
        resolve(text ? JSON.parse(text) : null);
      } catch {
        resolve(null);
      }
    });
    req.on("error", reject);
  });
}

/**
 * Generate a new API key.
 *
 * Returns the plaintext key (shown to user ONCE) and the hash (stored in DB).
 */
function generateApiKey(): { key: string; keyHash: string; keyPrefix: string } {
  const keyBytes = randomBytes(32).toString("hex"); // 64 hex chars
  const key = `${API_KEY_PREFIX}${keyBytes}`;
  const keyHash = createHash("sha256").update(key).digest("hex");
  const keyPrefix = key.substring(0, 12); // "poi_sk_xxxxx"
  return { key, keyHash, keyPrefix };
}

// ─── Internal Auth (for service-to-service calls) ───────────────────────────

function validateInternalToken(req: IncomingMessage): boolean {
  const token =
    req.headers.authorization?.replace("Bearer ", "") ||
    (req.headers["x-internal-token"] as string);
  const expected = process.env.WORKER_INTERNAL_TOKEN || process.env.POI_INTERNAL_KEY;
  return Boolean(token && expected && token === expected);
}

// ─── HTTP Handlers ──────────────────────────────────────────────────────────

/**
 * Handle all /api/keys/* routes.
 *
 * Returns true if the request was handled, false if path doesn't match.
 */
export async function handleApiKeysRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url ?? "/", `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  // ─── Internal validation endpoint (called by other services) ──────────
  if (pathname === "/api/internal/validate-key" && req.method === "POST") {
    return handleValidateKey(req, res);
  }
  if (pathname === "/api/internal/check-balance" && req.method === "POST") {
    return handleCheckBalance(req, res);
  }
  if (pathname === "/api/internal/deduct-credits" && req.method === "POST") {
    return handleDeductCredits(req, res);
  }

  // ─── User-facing API key management ───────────────────────────────────
  if (pathname === "/api/user/api-keys") {
    if (req.method === "POST") {
      return handleCreateKey(req, res);
    }
    if (req.method === "GET") {
      return handleListKeys(req, res);
    }
    sendJson(res, 405, { error: "Method not allowed" });
    return true;
  }

  // DELETE /api/user/api-keys/:id
  const deleteMatch = pathname.match(/^\/api\/user\/api-keys\/([^/]+)$/);
  if (deleteMatch && req.method === "DELETE") {
    return handleRevokeKey(req, res, deleteMatch[1]!);
  }

  return false; // Not our route
}

// ─── User-Facing Handlers ───────────────────────────────────────────────────

async function handleCreateKey(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const auth = await authenticateRequest(req);
  const user = toAuthenticatedUser(auth);
  if (!user) {
    sendJson(res, 401, { error: "Unauthorized" });
    return true;
  }

  const body = (await readJsonBody(req)) as { name?: string } | null;
  const name = body?.name?.trim();
  if (!name) {
    sendJson(res, 400, { error: "Missing 'name' field" });
    return true;
  }

  // Check key limit
  const db = getDb();
  const existingKeys = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, user.userId), eq(apiKeys.status, "active")));

  if (existingKeys.length >= MAX_KEYS_PER_USER) {
    sendJson(res, 400, { error: `Maximum ${MAX_KEYS_PER_USER} active keys allowed` });
    return true;
  }

  const { key, keyHash, keyPrefix } = generateApiKey();

  await db.insert(apiKeys).values({
    userId: user.userId,
    keyHash,
    keyPrefix,
    name,
  });

  // Return plaintext key ONLY ONCE
  sendJson(res, 201, {
    key, // ⚠️ Only time the full key is returned
    keyPrefix,
    name,
    message: "Save this key securely. It will not be shown again.",
  });
  return true;
}

async function handleListKeys(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const auth = await authenticateRequest(req);
  const user = toAuthenticatedUser(auth);
  if (!user) {
    sendJson(res, 401, { error: "Unauthorized" });
    return true;
  }

  const db = getDb();
  const keys = await db
    .select({
      id: apiKeys.id,
      keyPrefix: apiKeys.keyPrefix,
      name: apiKeys.name,
      status: apiKeys.status,
      rateLimitRpm: apiKeys.rateLimitRpm,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
      expiresAt: apiKeys.expiresAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.userId))
    .orderBy(desc(apiKeys.createdAt));

  sendJson(res, 200, { keys });
  return true;
}

async function handleRevokeKey(
  req: IncomingMessage,
  res: ServerResponse,
  keyId: string,
): Promise<boolean> {
  const auth = await authenticateRequest(req);
  const user = toAuthenticatedUser(auth);
  if (!user) {
    sendJson(res, 401, { error: "Unauthorized" });
    return true;
  }

  const db = getDb();
  const [updated] = await db
    .update(apiKeys)
    .set({ status: "revoked" })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, user.userId)))
    .returning();

  if (!updated) {
    sendJson(res, 404, { error: "Key not found" });
    return true;
  }

  sendJson(res, 200, { ok: true, message: "Key revoked" });
  return true;
}

// ─── Internal Service Handlers ──────────────────────────────────────────────

async function handleValidateKey(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  if (!validateInternalToken(req)) {
    sendJson(res, 401, { error: "Unauthorized" });
    return true;
  }

  const body = (await readJsonBody(req)) as { key?: string } | null;
  if (!body?.key) {
    sendJson(res, 400, { error: "Missing 'key' field" });
    return true;
  }

  const { validateApiKey } = await import("./poi-auth.js");
  const result = await validateApiKey(body.key);

  if (!result.ok) {
    sendJson(res, 200, { valid: false, reason: result.reason });
    return true;
  }

  sendJson(res, 200, {
    valid: true,
    userId: result.userId,
    keyId: result.keyId,
    role: result.role,
    rateLimits: result.rateLimits,
    allowedModels: result.allowedModels,
  });
  return true;
}

async function handleCheckBalance(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  if (!validateInternalToken(req)) {
    sendJson(res, 401, { error: "Unauthorized" });
    return true;
  }

  const body = (await readJsonBody(req)) as { userId?: string } | null;
  if (!body?.userId) {
    sendJson(res, 400, { error: "Missing 'userId' field" });
    return true;
  }

  const { getBalance } = await import("./credits-engine.js");
  const balance = await getBalance(body.userId);

  sendJson(res, 200, balance);
  return true;
}

async function handleDeductCredits(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  if (!validateInternalToken(req)) {
    sendJson(res, 401, { error: "Unauthorized" });
    return true;
  }

  const body = (await readJsonBody(req)) as {
    userId?: string;
    amount?: number;
    scene?: string;
    model?: string;
    tokensIn?: number;
    tokensOut?: number;
    reference?: string;
  } | null;

  if (!body?.userId || !body?.amount || !body?.scene) {
    sendJson(res, 400, { error: "Missing required fields: userId, amount, scene" });
    return true;
  }

  const { deductCredits } = await import("./credits-engine.js");
  const success = await deductCredits(body.userId, body.amount, body.scene, {
    model: body.model,
    tokensIn: body.tokensIn,
    tokensOut: body.tokensOut,
    reference: body.reference,
  });

  sendJson(res, 200, { success });
  return true;
}
