# POI Token Generation Event (TGESale)

The `TGESale` contract manages POI token sales, enforces contribution limits, and exposes AgentKit-friendly helpers.

## Network & Address

- **Target network:** Base Sepolia (`84532`)
- **Artifact:** `shared/contracts/poi_tge.json`
- **Deployment script:** `scripts/deploy-tge-sale.ts`

## Key Functions

- `purchase(uint256 usdcAmount, bytes32[] proof)` – legacy entry point used by frontends.
- `buyWithBaseToken(uint256 usdcAmount, bytes32[] proof)` – thin wrapper intended for AgentKit calls.
- `isSaleActive()` – returns `true` if the sale is not paused, within the configured window, and has remaining supply.
- `maxContribution()` – global cap per wallet (0 = unlimited).
- `maxContribution(address user)` – returns the remaining allowance for a specific user.
- `contributionOf(address user)` – exposes the amount of USDC already contributed.
- `getSaleView(address user)` – aggregates the current tier, contribution bounds, and per-user progress.

## Events

- `Purchased(address buyer, uint256 usdcAmount, uint256 poiAmount, uint8 tier)` – legacy analytics event.
- `TGEPurchased(address buyer, uint256 baseAmount, uint256 poiAmount)` – simplified event for the Ledger / AgentKit pipeline.

## Guards & Rules

- Sale can be paused (`setPaused`), window-gated (`setSaleWindow`), whitelist-protected, and blacklisted per address.
- Contribution bounds (min/max) are configured via `setContributionBounds` and enforced per purchase.

## AgentKit Usage

- Validate `isSaleActive()` and `maxContribution(user)` before constructing a purchase.
- Pass whitelist proofs via the `proof` parameter when required. The final element should encode the allocation cap, matching the contract's `_extractAllocationAndProof` helper.
- Log every AgentKit-driven purchase in `agentkit_actions` using the action type `TGE_PURCHASE` (or similar) for ledgering.
