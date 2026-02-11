/**
 * Payment Hub — Gateway Billing Integration
 *
 * Wraps the existing OpenAI and OpenResponses HTTP handlers with:
 * 1. POI API Key authentication (alongside existing gateway token auth)
 * 2. Pre-request credit balance check
 * 3. Post-response credit settlement
 *
 * This module does NOT modify the existing handler files.
 * Instead, it intercepts requests before they reach the handlers.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { handleApiKeysRequest } from "./api-keys.js";
import { checkCreditsGate, settleUsage } from "./credits-gate.js";
import {
  authenticateRequest,
  hasPoiApiKey,
  toAuthenticatedUser,
  type PoiAuthenticatedUser,
} from "./poi-auth.js";

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Billing context attached to a request after POI auth succeeds.
 * Stored on the request object for post-response settlement.
 */
export interface BillingContext {
  user: PoiAuthenticatedUser;
  model: string;
  discountRate: number;
  startTime: number;
}

// WeakMap to store billing context per request (avoids modifying IncomingMessage type)
const billingContexts = new WeakMap<IncomingMessage, BillingContext>();

// ─── Feature Flag ───────────────────────────────────────────────────────────

function isPaymentHubEnabled(): boolean {
  return process.env.PAYMENT_HUB_ENABLED === "true";
}

// ─── Pre-Request Hook ───────────────────────────────────────────────────────

function sendBillingJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

/**
 * Pre-request billing hook.
 *
 * Called before the existing handler processes the request.
 * If the request uses a POI API key:
 *   - Authenticates the key
 *   - Checks credit balance
 *   - Stores billing context for post-response settlement
 *   - Returns true (request should proceed) or false (rejected)
 *
 * If the request does NOT use a POI API key:
 *   - Returns true (let existing gateway auth handle it)
 */
export async function preRequestBillingHook(
  req: IncomingMessage,
  res: ServerResponse,
  model: string,
): Promise<{ proceed: boolean; poiAuthenticated: boolean }> {
  if (!isPaymentHubEnabled()) {
    return { proceed: true, poiAuthenticated: false };
  }

  // Only intercept requests with POI API keys
  if (!hasPoiApiKey(req)) {
    return { proceed: true, poiAuthenticated: false };
  }

  // Authenticate POI API key
  const authResult = await authenticateRequest(req);
  const user = toAuthenticatedUser(authResult);
  if (!user) {
    sendBillingJson(res, 401, {
      error: {
        message: authResult.reason === "expired" ? "API key has expired" : "Invalid API key",
        type: "authentication_error",
        code: authResult.reason ?? "invalid_api_key",
      },
    });
    return { proceed: false, poiAuthenticated: false };
  }

  // Check credits gate
  const gate = await checkCreditsGate(user, model);
  if (!gate.allowed) {
    sendBillingJson(res, 402, {
      error: {
        message: gate.error ?? "Insufficient credits",
        type: "billing_error",
        code: "insufficient_credits",
        balance: gate.balance,
      },
    });
    return { proceed: false, poiAuthenticated: false };
  }

  // Store billing context for post-response settlement
  billingContexts.set(req, {
    user,
    model,
    discountRate: gate.discountRate,
    startTime: Date.now(),
  });

  return { proceed: true, poiAuthenticated: true };
}

/**
 * Post-response billing hook.
 *
 * Called after the response is sent with actual token usage.
 * Deducts credits based on real token counts.
 */
export async function postResponseBillingHook(
  req: IncomingMessage,
  tokensIn: number,
  tokensOut: number,
  runId?: string,
): Promise<void> {
  const ctx = billingContexts.get(req);
  if (!ctx) {
    return;
  } // Not a POI-authenticated request

  billingContexts.delete(req);

  // Only settle if there was actual usage
  if (tokensIn + tokensOut === 0) {
    return;
  }

  try {
    await settleUsage(ctx.user.userId, ctx.model, tokensIn, tokensOut, ctx.discountRate, runId);
  } catch (err) {
    // Log but don't fail the response — credits will be reconciled later
    console.error("[payment-hub] Settlement failed:", err);
  }
}

/**
 * Check if a request was POI-authenticated (has billing context).
 */
export function isPoiAuthenticatedRequest(req: IncomingMessage): boolean {
  return billingContexts.has(req);
}

/**
 * Get billing context for a request (if POI-authenticated).
 */
export function getBillingContext(req: IncomingMessage): BillingContext | undefined {
  return billingContexts.get(req);
}

// ─── Combined Request Handler ───────────────────────────────────────────────

/**
 * Handle payment hub routes (/api/keys/*, /api/internal/*).
 *
 * Returns true if the request was handled by payment hub, false otherwise.
 */
export async function handlePaymentHubRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  if (!isPaymentHubEnabled()) {
    return false;
  }

  return handleApiKeysRequest(req, res);
}
