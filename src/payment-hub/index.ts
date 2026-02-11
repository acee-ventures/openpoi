/**
 * Payment Hub — Public API
 *
 * Unified multi-tenant payment infrastructure for the ACEE ecosystem.
 * Provides: auth, credits, billing, API key management.
 */

export { getDb, type PaymentHubDb } from "./db.js";
export {
  unifiedLedger,
  apiKeys,
  cryptoDeposits,
  modelPricing,
  userBalances,
  users,
  poiTiers,
  type UnifiedLedgerEntry,
  type ApiKey,
  type CryptoDeposit,
  type ModelPricingEntry,
  type UserBalance,
  type User,
  type PoiTier,
} from "./schema.js";
export {
  DEFAULT_MODEL_PRICING,
  CREDITS_PER_USD,
  TIER_DISCOUNTS,
  calculateCreditCost,
  type ModelPrice,
} from "./pricing.js";
export {
  getBalance,
  deductCredits,
  creditBalance,
  recordUsageAndDeduct,
  getUserDiscountRate,
  migrateImmortalityToPoiCredits,
  type BalanceInfo,
  type DeductOptions,
  type CreditOptions,
  type UsageRecord,
} from "./credits-engine.js";
export {
  authenticateRequest,
  validateApiKey,
  hasPoiApiKey,
  toAuthenticatedUser,
  type PoiAuthResult,
  type PoiAuthenticatedUser,
} from "./poi-auth.js";
export {
  checkCreditsGate,
  settleUsage,
  getModelPricingInfo,
  type CreditsGateResult,
  type SettlementResult,
} from "./credits-gate.js";
export { handleApiKeysRequest } from "./api-keys.js";
