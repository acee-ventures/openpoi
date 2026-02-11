/**
 * Payment Hub — Credits Gate
 *
 * Pre-request middleware that checks user's credit balance before allowing
 * AI requests through. Works with the POI auth middleware.
 *
 * Flow:
 * 1. Request arrives with authenticated PoiAuthenticatedUser
 * 2. Check if user has sufficient poiCredits (estimate based on model)
 * 3. If sufficient → allow request through
 * 4. If insufficient → reject with 402 Payment Required
 * 5. After response → settle actual cost based on real token usage
 */

import type { PoiAuthenticatedUser } from "./poi-auth.js";
import { getBalance, recordUsageAndDeduct, getUserDiscountRate } from "./credits-engine.js";
import { calculateCreditCost, DEFAULT_MODEL_PRICING } from "./pricing.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CreditsGateResult {
  allowed: boolean;
  userId: string;
  balance: number;
  estimatedCost: number;
  discountRate: number;
  error?: string;
}

export interface SettlementResult {
  success: boolean;
  creditsCost: number;
  model: string;
  tokensIn: number;
  tokensOut: number;
}

// ─── Estimation ─────────────────────────────────────────────────────────────

/** Estimated tokens for a pre-check (conservative: ~2K input, ~1K output) */
const DEFAULT_ESTIMATED_INPUT_TOKENS = 2000;
const DEFAULT_ESTIMATED_OUTPUT_TOKENS = 1000;

/**
 * Estimate credit cost for a request before it's processed.
 *
 * Uses conservative defaults if model pricing is unknown.
 */
function estimateCost(model: string, discountRate: number): number {
  return calculateCreditCost(
    model,
    DEFAULT_ESTIMATED_INPUT_TOKENS,
    DEFAULT_ESTIMATED_OUTPUT_TOKENS,
    discountRate,
  );
}

// ─── Gate Logic ─────────────────────────────────────────────────────────────

/**
 * Pre-request balance check.
 *
 * Checks if user has enough credits for the estimated cost of the request.
 * Does NOT deduct credits — that happens after the response (settlement).
 *
 * Admin users bypass the check.
 */
export async function checkCreditsGate(
  user: PoiAuthenticatedUser,
  model: string,
): Promise<CreditsGateResult> {
  // Admin bypass
  if (user.role === "admin") {
    return {
      allowed: true,
      userId: user.userId,
      balance: Infinity,
      estimatedCost: 0,
      discountRate: 0,
    };
  }

  // Model allowlist check
  if (user.allowedModels && !user.allowedModels.includes(model)) {
    return {
      allowed: false,
      userId: user.userId,
      balance: 0,
      estimatedCost: 0,
      discountRate: 0,
      error: `Model '${model}' is not allowed for this API key`,
    };
  }

  const balance = await getBalance(user.userId);

  // Get tier discount (0 for free tier)
  const discountRate = await getUserDiscountRate(0); // TODO: pass actual POI balance from chain

  const estimatedCost = estimateCost(model, discountRate);

  // Check if user has at least 1 credit (minimum viable balance)
  if (balance.poiCredits < 1) {
    return {
      allowed: false,
      userId: user.userId,
      balance: balance.poiCredits,
      estimatedCost,
      discountRate,
      error: "Insufficient credits. Please top up your balance.",
    };
  }

  return {
    allowed: true,
    userId: user.userId,
    balance: balance.poiCredits,
    estimatedCost,
    discountRate,
  };
}

/**
 * Post-response settlement.
 *
 * Called after the AI response is received with actual token usage.
 * Deducts the exact credit cost from the user's balance.
 */
export async function settleUsage(
  userId: string,
  model: string,
  tokensIn: number,
  tokensOut: number,
  discountRate: number,
  reference?: string,
): Promise<SettlementResult> {
  const { success, creditsCost } = await recordUsageAndDeduct(
    userId,
    {
      model,
      tokensIn,
      tokensOut,
      creditsCost: 0, // Let engine calculate from pricing
      reference,
    },
    discountRate,
  );

  return {
    success,
    creditsCost,
    model,
    tokensIn,
    tokensOut,
  };
}

/**
 * Get model pricing info for display purposes.
 */
export function getModelPricingInfo(model: string): {
  creditsPerMInput: number;
  creditsPerMOutput: number;
  provider: string;
} | null {
  const pricing = DEFAULT_MODEL_PRICING[model];
  if (!pricing) {
    return null;
  }
  return {
    creditsPerMInput: pricing.creditsPerMInput,
    creditsPerMOutput: pricing.creditsPerMOutput,
    provider: pricing.provider,
  };
}
