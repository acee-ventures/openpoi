# Billing UI — Task Prompt

## Context

The OpenPOI Payment Hub backend is fully wired:

- **DB Tables**: `user_balances`, `poi_tiers`, `unified_ledger`, `poi_api_keys`, `crypto_deposits`, `model_pricing` — all migrated and seeded in Neon PostgreSQL.
- **Gateway Handlers**: `payment.balance` (read) and `payment.verify` (write) registered as WebSocket JSON-RPC methods.
- **HTTP Routes**: `/api/keys/*` handled by `handlePaymentHubRequest` in `server-http.ts`.
- **Credits Engine**: `getBalance`, `deductCredits`, `creditBalance`, `recordUsageAndDeduct` in `src/payment-hub/credits-engine.ts`.
- **Verification**: `verifyBaseTransaction` (Base L2 USDC) and `verifyTronTransaction` (USDT TRC-20) in `src/payment-hub/verification/`.

## Existing UI Code

- `ui/src/ui/controllers/billing.ts` — `BillingState`, `loadBalance()`, `verifyTransaction()`
- `ui/src/ui/views/billing.ts` — `renderBilling()`, `renderBalanceCard()`, `renderAddFunds()`, `renderPaymentActions()`
- `ui/src/ui/services/wallet-base.ts` — MetaMask Base L2 USDC wallet service
- `ui/src/ui/services/wallet-tron.ts` — TronLink USDT wallet service
- `ui/src/ui/types/wallet.d.ts` — Window type augmentation for `ethereum` and `tronWeb`

## Tasks

### 1. Route the Billing Page

- Integrate billing view into the main app navigation/routing
- Add a "Billing" or "Credits" tab/link in the sidebar or header
- Ensure the billing page is accessible after WebSocket connection

### 2. Wallet Connection Flow

- MetaMask connect → Base L2 USDC transfer to Treasury (`VITE_TREASURY_ADDRESS_EVM`)
- TronLink connect → USDT TRC-20 transfer to Treasury (`VITE_TREASURY_ADDRESS_TRON`)
- Show wallet address and token balance after connection

### 3. Deposit → Verify Loop

- After user sends USDC/USDT, capture `txHash`
- Call `payment.verify` with `{ chain: "base"|"tron", txHash }` via WebSocket
- Show success/failure feedback + auto-refresh balance

### 4. Balance Display

- Call `payment.balance` on page load → display `{ poiCredits, total }`
- Format as "X Credits" with clear unit
- Show loading skeleton during fetch

### 5. Error Handling in Chat

- When chat returns 402 (insufficient credits), show in-context prompt:
  "Insufficient credits — [Add Funds]" linking to billing page

## Env Variables (in `ui/.env`)

```
VITE_USDC_ADDRESS_EVM=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
VITE_TREASURY_ADDRESS_EVM=<treasury multisig address>
VITE_USDT_ADDRESS_TRON=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
VITE_TREASURY_ADDRESS_TRON=<tron treasury address>
```

## Design Guidelines

- Match existing OpenClaw Control UI aesthetic (dark theme)
- Use Lit HTML templates (existing pattern)
- Minimal, clean, crypto-native UX — no unnecessary modals
