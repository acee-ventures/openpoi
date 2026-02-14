# TGE Technical Specification v1.0

**Token Generation Event - Technical Implementation Guide**

**Last Updated**: 2025-12-10  
**Status**: ✅ Ready for Base Mainnet Deployment

---

## 1. Contract Architecture

### Core Contracts

| Contract               | Address (Base Sepolia)                       | Mainnet Address | Function               |
| ---------------------- | -------------------------------------------- | --------------- | ---------------------- |
| **POIToken**           | `0x737869142C93078Dae4d78D4E8c5dbD45160565a` | TBD             | ERC20 platform token   |
| **TGESale v2**         | `0xD1f13e4f3056216ed6245ca3AE946695f0282dCE` | TBD             | Multi-stage token sale |
| **VestingVault**       | `0xe4E695722C598CBa27723ab98049818b4b827924` | TBD             | Linear token release   |
| **EarlyBirdAllowlist** | `0x75D75a4870762422D85D275b22F5A87Df78b4852` | TBD             | Whitelist management   |

**Reference**: [Contract Addresses](../CONTRACT_ADDRESSES.md)

---

## 2. TGE Sale Management

### Contract: TGESale v2

**Address**: `0xD1f13e4f3056216ed6245ca3AE946695f0282dCE` (Base Sepolia)

**Key Functions**:

- `configureTiers(uint256[] prices, uint256[] supplies)` - Owner sets tier prices and allocations
- `purchase(uint256 usdcAmount, bytes32[] proof)` - Buyers acquire POI by providing USDC
- `setContributionBounds(uint256 min, uint256 max)` - Min purchase amount and cumulative per-address cap
- `setWhitelistConfig(bool enabled, bytes32 root)` - Toggles whitelist usage and sets Merkle root
- `setSaleWindow(uint64 start, uint64 end)` - Defines sale start/end timestamps
- `getSaleView(address user)` - Returns comprehensive sale status for frontend

**Reference**: [TGESale Contract Documentation](./TGESale.md)

---

## 3. Whitelist Mechanism

### Contract: EarlyBirdAllowlist

**Address**: `0x75D75a4870762422D85D275b22F5A87Df78b4852` (Base Sepolia)

**Mechanism**: Merkle proof-based whitelist

**Process**:

1. Admin generates Merkle tree from whitelist addresses
2. Merkle root set in TGESale contract via `setWhitelistConfig()`
3. User provides Merkle proof when purchasing
4. Contract verifies proof on-chain

**Implementation**:

- Merkle proof array must append user allocation as last element
- Proof generation: Use `scripts/airdrop-generate-test-claim.cjs` as reference
- Frontend: Generate proof client-side or fetch from backend API

---

## 4. Fund Flow

### Payment Method: USDC

**Token Details**:

- **Standard**: ERC-20 (6 decimals)
- **Base Sepolia**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Base Mainnet**: TBD

**Flow**:

```
User Wallet → Approve USDC → TGESale Contract → Purchase POI → VestingVault (if vested)
```

**Process**:

1. User approves USDC spending to TGESale contract
2. User calls `purchase()` with USDC amount and Merkle proof (if whitelisted)
3. Contract transfers USDC from user to contract
4. Contract calculates POI amount based on current tier price
5. Contract transfers POI to user (or VestingVault if vesting applies)
6. Contract emits `Purchased` event for analytics

---

## 5. Post-Purchase Token Distribution

### Immediate Distribution

**Public TGE Purchasers**:

- 20% immediate unlock (sent directly to user wallet)
- 80% sent to VestingVault for linear release

**Vesting Schedule**:

- **Start**: TGE completion date
- **Cliff**: 0 (no cliff for public TGE)
- **Duration**: 9 months (linear release)
- **Slice Period**: 1 day (daily vesting)

### VestingVault Integration

**Contract**: `0xe4E695722C598CBa27723ab98049818b4b827924`

**Process**:

1. TGESale contract creates vesting schedule in VestingVault
2. POI tokens transferred to VestingVault
3. User can claim released tokens daily via `release()`
4. On-chain verifiable: All vesting calculations on-chain

**Reference**: [VestingVault Contract Documentation](./VestingVault.md)

---

## 6. Frontend Integration

### TGE Page: `client/src/pages/TGE.tsx`

**Current Status**: ✅ Implemented

**Key Features**:

- Price display (current tier price)
- Remaining allocation per tier
- Countdown timer (sale window)
- User contribution tracking
- Whitelist status check
- Purchase flow (wallet connection → approve → purchase)

**Components**:

- `TGEPurchaseCard` - Purchase interface
- `TGETestConsole` - Developer tools (dev mode only)

**Hooks**:

- `useTgeStatus(address)` - Fetch TGE status from API

---

## 7. Backend API

### Route: `server/routes/tge.ts`

**Current Status**: ✅ Implemented

**Endpoints**:

#### GET `/api/tge/status?address=0x...`

**Response**:

```json
{
  "currentTier": 0,
  "tierPrice": "100000", // 0.10 USDC (6 decimals)
  "tierRemaining": "20000000000000000000", // 20M POI (18 decimals)
  "minContribution": "100000000", // 100 USDC (6 decimals)
  "maxContribution": "50000000000", // 50,000 USDC (6 decimals)
  "userContributed": "0",
  "saleWindow": {
    "start": 1735689600,
    "end": 1736294400
  },
  "tokenomics": {
    "totalSupply": "1000000000000000000000000000",
    "hardCap": "3000000000000",
    "allocation": {...},
    "investorPoolBreakdown": {...}
  }
}
```

**Implementation**: Uses `getTgeSaleViewStatus()` from `server/agentkit/tge.ts`

---

## 8. Event Monitoring

### Contract Events

**TGESale Contract Events**:

- `Purchased(address indexed buyer, uint256 usdcAmount, uint256 poiAmount, uint8 tier)`

**Monitoring Script**: `scripts/tge-monitor.cjs` (to be created)

**Process**:

1. Listen to `Purchased` events from TGESale contract
2. Log to database (purchase records)
3. Update analytics dashboard
4. Alert on anomalies (large purchases, failed transactions)

---

## 9. Testing & Validation

### Testnet Deployment (Base Sepolia)

**Status**: ✅ Complete

**Contracts Deployed**:

- All core contracts verified and operational
- TGESale v2 active: `0xD1f13e4f3056216ed6245ca3AE946695f0282dCE`

**Test Scripts**:

- `scripts/tge-runner.cjs` - Full TGE simulation
- `scripts/TGE_TEST_SCENARIOS_README.md` - Test scenarios
- `scripts/TGE_TEST_WALLET_CONFIG.md` - Test wallet setup

### Dry Run Checklist

- [ ] Frontend connects to correct contract address
- [ ] Wallet connection works (MetaMask, Coinbase Wallet)
- [ ] USDC approval flow works
- [ ] Purchase transaction executes successfully
- [ ] POI tokens received (20% immediate + 80% to vesting)
- [ ] Vesting schedule created in VestingVault
- [ ] Events emitted correctly
- [ ] Backend API records purchase
- [ ] Database updated with purchase record

---

## 10. Mainnet Deployment Checklist

### Pre-Deployment

- [ ] All contracts audited (internal review ✅, external audit TBD)
- [ ] Testnet dry run completed successfully (≥ 2 times)
- [ ] Frontend tested with mainnet contract addresses
- [ ] Backend API updated with mainnet addresses
- [ ] Environment variables configured for Base Mainnet
- [ ] Monitoring scripts ready

### Deployment Steps

1. Deploy POIToken to Base Mainnet
2. Deploy VestingVault to Base Mainnet
3. Deploy TGESale v2 to Base Mainnet
4. Configure TGESale tiers and sale window
5. Set whitelist Merkle root (if using whitelist)
6. Transfer POI tokens to TGESale contract
7. Update frontend with mainnet addresses
8. Update backend environment variables
9. Verify all contracts on Basescan
10. Announce TGE launch

### Post-Deployment

- [ ] Monitor purchase transactions
- [ ] Track event emissions
- [ ] Verify vesting schedules created
- [ ] Monitor contract balances
- [ ] Alert on anomalies

---

## 11. References

- [TGE Specification v1.0](../token/TGE_SPEC_v1.md) - Complete TGE parameters
- [TGESale Contract](./TGESale.md) - Contract documentation
- [VestingVault Contract](./VestingVault.md) - Vesting documentation
- [Contract Addresses](../CONTRACT_ADDRESSES.md) - All deployed contracts
- [TGE Test Scenarios](../../scripts/TGE_TEST_SCENARIOS_README.md) - Testing guide

---

## 12. Technical Notes

### Price Calculation

**TGESale v2 uses correct scaling**:

- Tier price: Denominated in 6-decimal USDC per 1 POI (18 decimals)
- Formula: `poiAmount = (usdcAmount * 1e18) / (tierPrice * 1e12)`
- Fixed in v2: Uses 1e18 scaling factor (v1 had bug with 1e12)

### Gas Optimization

- Batch purchases not supported (one purchase per transaction)
- Merkle proof verification: ~50k gas per purchase
- Total gas per purchase: ~150k-200k gas (Base Mainnet: ~$0.01-0.05)

### Security Considerations

- Whitelist verification on-chain (Merkle proof)
- Contribution bounds enforced (min/max per address)
- Sale window enforced (start/end timestamps)
- Pause functionality available (emergency stop)
- Blacklist support (per-address blocking)

---

**Status**: ✅ Ready for Base Mainnet deployment after final testnet validation
