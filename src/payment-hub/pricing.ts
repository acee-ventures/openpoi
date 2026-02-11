/**
 * Payment Hub — Model Pricing Constants
 *
 * Credits exchange rate: $1 USD = 100 Credits
 * All prices include 20% platform markup over provider cost.
 *
 * To update pricing: modify DEFAULT_MODEL_PRICING or update model_pricing DB table.
 * DB table takes precedence over these defaults when available.
 */

export interface ModelPrice {
  /** Human-readable provider name */
  provider: string;
  /** Credits per 1M input tokens */
  creditsPerMInput: number;
  /** Credits per 1M output tokens */
  creditsPerMOutput: number;
}

/**
 * Default model pricing — fallback when model_pricing DB table is empty or unreachable.
 *
 * Pricing formula: (provider_cost_per_1M_tokens × 100 credits/$1) × 1.20 markup
 * Example: Claude Sonnet 4.5 input = $3/1M × 100 × 1.2 = 360 → rounded to 36 per 100K
 */
export const DEFAULT_MODEL_PRICING: Record<string, ModelPrice> = {
  // ─── Anthropic ────────────────────────────────────────────
  "claude-sonnet-4.5": { provider: "anthropic", creditsPerMInput: 36, creditsPerMOutput: 180 },
  "claude-haiku-4.5": { provider: "anthropic", creditsPerMInput: 12, creditsPerMOutput: 60 },
  "claude-opus-4.6": { provider: "anthropic", creditsPerMInput: 180, creditsPerMOutput: 900 },

  // ─── OpenAI ───────────────────────────────────────────────
  "gpt-5": { provider: "openai", creditsPerMInput: 15, creditsPerMOutput: 120 },
  "gpt-5-mini": { provider: "openai", creditsPerMInput: 3, creditsPerMOutput: 24 },
  "gpt-4o": { provider: "openai", creditsPerMInput: 60, creditsPerMOutput: 240 },
  "gpt-4o-mini": { provider: "openai", creditsPerMInput: 2, creditsPerMOutput: 7 },

  // ─── DeepSeek ─────────────────────────────────────────────
  "deepseek-v3": { provider: "deepseek", creditsPerMInput: 3, creditsPerMOutput: 11 },
  "deepseek-r1": { provider: "deepseek", creditsPerMInput: 7, creditsPerMOutput: 28 },

  // ─── Qwen (local/self-hosted) ─────────────────────────────
  "qwen-local": { provider: "qwen", creditsPerMInput: 1, creditsPerMOutput: 3 },

  // ─── Google ───────────────────────────────────────────────
  "gemini-2.0-flash": { provider: "google", creditsPerMInput: 1, creditsPerMOutput: 5 },
};

/** Credits exchange rate: $1 USD = 100 Credits */
export const CREDITS_PER_USD = 100;

/**
 * Crypto exchange rates for stablecoins and utility tokens.
 * Used by payment verification logic to convert on-chain amounts to Credits.
 *
 * Rates:
 * - USDC/USDT: Pegged to USD (1:1 with CREDITS_PER_USD → 100 Credits)
 * - POI: Fixed utility rate (1 POI = 1,000 Credits)
 */
export const CRYPTO_EXCHANGE_RATES = {
  USDC: CREDITS_PER_USD,
  USDT: CREDITS_PER_USD,
  POI: 1000,
};

/**
 * POI tier discount rates (matches poiTiers DB table).
 * Used as fallback when DB is unreachable.
 */
export const TIER_DISCOUNTS: Record<string, number> = {
  free: 0,
  silver: 0.05, // 1,000 POI → 5% off
  gold: 0.1, // 10,000 POI → 10% off
  platinum: 0.2, // 100,000 POI → 20% off
};

/**
 * Calculate credit cost for a given model and token usage.
 *
 * @param modelName - Model identifier (e.g. 'claude-sonnet-4.5')
 * @param tokensIn - Number of input tokens consumed
 * @param tokensOut - Number of output tokens consumed
 * @param discountRate - Tier discount rate (0-1), e.g. 0.1 for 10% off
 * @param pricingOverrides - Optional per-model pricing from DB
 * @returns Credit cost (integer, minimum 1 for any non-zero usage)
 */
export function calculateCreditCost(
  modelName: string,
  tokensIn: number,
  tokensOut: number,
  discountRate = 0,
  pricingOverrides?: Record<string, ModelPrice>,
): number {
  const pricing = pricingOverrides?.[modelName] ?? DEFAULT_MODEL_PRICING[modelName];
  if (!pricing) {
    // Unknown model — use a conservative default (Claude Sonnet tier)
    const fallback = DEFAULT_MODEL_PRICING["claude-sonnet-4.5"]!;
    return calculateCreditCost(modelName, tokensIn, tokensOut, discountRate, {
      [modelName]: fallback,
    });
  }

  const inputCost = (tokensIn / 1_000_000) * pricing.creditsPerMInput;
  const outputCost = (tokensOut / 1_000_000) * pricing.creditsPerMOutput;
  const baseCost = inputCost + outputCost;
  const discountedCost = baseCost * (1 - discountRate);

  // Minimum 1 credit for any non-zero usage
  if (tokensIn + tokensOut > 0 && discountedCost < 1) {
    return 1;
  }

  return Math.ceil(discountedCost);
}
