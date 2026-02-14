# TGESale

## Overview

- Handles primary sale of POI tokens in exchange for USDC.
- Supports tiered pricing with automatic advancement when a tier sells out.
- Optional whitelist allocations via Merkle proofs, configurable contribution bounds, blacklisting, pausing, and sale windows.
- Raised USDC is withdrawable to a treasury account.

## Key Functions

- `configureTiers(uint256[] prices, uint256[] supplies)` – owner sets tier prices and allocations.
- `purchase(uint256 usdcAmount, bytes32[] proof)` – buyers acquire POI by providing USDC.
- `setContributionBounds(uint256 min, uint256 max)` – min purchase amount and cumulative per-address cap.
- `setWhitelistConfig(bool enabled, bytes32 root)` – toggles whitelist usage and sets the Merkle root.
- `setSaleWindow(uint64 start, uint64 end)` – defines the sale start/end timestamps (0 disables the bound).
- `setPaused(bool status)` / `setBlacklist(address,bool)` – sale controls.
- `withdraw()` / `withdrawPOI(uint256 amount)` – treasury withdrawals.
- `getSaleView(address user)` – returns `SaleView { currentTier, tierPrice, tierRemaining, minContribution, maxContribution, userContributed }` for streamlined front-end reads.

## Deployment Notes

- Constructor arguments: `poiToken`, `usdcToken`, `owner`, `treasury`.
- Tier price is denominated in 6-decimal USDC per 1 POI (18 decimals).
- When the whitelist is enabled the Merkle proof array must append the user allocation as the last element.
- Emits `Purchased(address indexed buyer, uint256 usdcAmount, uint256 poiAmount, uint8 tier)` for analytics pipelines.
