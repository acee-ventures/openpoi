# SSF V1.7.1 Single Source of Truth (SSOT)

## 1. Technical Parameters

| Parameter        | Value                                   |
| ---------------- | --------------------------------------- |
| **Project Name** | SSF (SF South Bay)                      |
| **Total Units**  | 70 Units                                |
| **Total Tokens** | 20,000 SSFShareToken                    |
| **Issue Price**  | 1,000 USDC per Share                    |
| **Series Cap**   | 20,000,000 USDC                         |
| **Floor Price**  | 500 USDC per Share (50% of Issue Price) |
| **Network**      | Base Mainnet (ChainID: 8453)            |
| **Settlement**   | T+0                                     |

## 2. Proceeds Segregation (50 / 450 / 500)

Per 1,000 USDC:

| Priority                     | Amount         | Purpose                                                    |
| ---------------------------- | -------------- | ---------------------------------------------------------- |
| **P1: Reserve Vault**        | 50 USDC (5%)   | Reserve Redemption Feature (non-guaranteed exit mechanism) |
| **P2: Owner Proceeds**       | 450 USDC (45%) | T+0 settlement to Owner                                    |
| **P3: SPV Controlled Vault** | 500 USDC (50%) | Operations + incentive budget (2-of-2 multisig: ACEE + OR) |

## 3. On-Chain Contracts (Base Mainnet)

| Component           | Address                                      |
| ------------------- | -------------------------------------------- |
| **USDC**            | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| **SSFShareToken**   | `0xB6c38Ef75401695db928ef124D9e430b923B2546` |
| **SSFShareSale**    | `0x52DbEa06AEb510E54b52C029eF7bD82cd33Ac5c4` |
| **SSFReserveVault** | `0x61C750787b63f8D5E1640cc0115E22aEe4CABeB3` |

## 4. Governance & Roles

| Role                  | Entity                      |
| --------------------- | --------------------------- |
| **Sponsor / Manager** | ACEE Ventures LLC           |
| **Issuer (SPV)**      | SSF Holdings LLC (Delaware) |
| **Property Owner**    | Client                      |
| **Legal Counsel**     | Restricted (via Data Room)  |

## 5. Token Narrative

SSFShareToken is designed as a **premium participation and utility vehicle**:

- **Scarcity**: Fixed Series Cap, no additional minting
- **Utility**: Stake-to-Access, Priority Gating, Discounts & Rebates
- **Auditability**: All flows (50/450/500) visible and auditable T+0, Same-Wallet Rule

## 6. POI Incentive Cap

| Parameter   | Value                                  |
| ----------- | -------------------------------------- |
| **POI Cap** | 5% of Total POI Supply                 |
| **Nature**  | Discretionary, in-kind, non-guaranteed |

## 7. Compliance

The Company does not distribute dividends, rental income, or cash yields. Participation incentives ($POI) are discretionary, in-kind, and subject to staking gates. They carry no guarantee of liquidity or value. The Reserve Redemption is a risk-controlled exit mechanism, not a return of principal.

---

**Status**: LOCKED V1.7.1
