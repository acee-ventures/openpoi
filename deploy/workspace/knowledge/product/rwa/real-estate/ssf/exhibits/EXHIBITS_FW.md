# SSF Exhibits Framework (P1)

## Exhibit A: Proceeds Waterfall & Custody Controls

### 1. Custody & Multi-Signature Governance

All USDC proceeds from the SSF Share Sale are received by the **SSF Holdings LLC** wallet governed by a Multi-Signature (Multisig) architecture.

- **Threshold**: 2-of-3 signatures required for any outbound transaction.
- **Signer Roles**:
  1. **Manager Signer**: ACEE Ventures representative (Operational control).
  2. **Compliance Signer**: Legal/Compliance officer (Policy verification).
  3. **Trustee/Owner Signer**: Property Owner representative (Asset protection).
- **Address Whitelisting**: Outbound transfers are strictly restricted to pre-approved addresses (Vendor, Property Owner development account).

### 2. Proceeds Segregation (50 / 450 / 500)

Per 1,000 USDC, funds are segregated on-chain at T+0:

1. **P1: Reserve Vault (50 USDC / 5%)**: Reserve Redemption Feature (non-guaranteed exit mechanism).
2. **P2: Owner Proceeds (450 USDC / 45%)**: T+0 direct settlement to Owner.
3. **P3: SPV Controlled Vault (500 USDC / 50%)**: Operations + incentive budget, 2-of-2 multisig (ACEE + OR).

### 3. Controls & Reconciliation

- **Pause/Resume**: The Manager or Compliance Signer can trigger an emergency pause on the Sale contract.
- **Evidence Requirement**: Every outbound transaction must be accompanied by an internal memo citing the **Transaction Hash (TXID)** and matching invoice/milestone proof.
- **Audit Log**: A quarterly reconciliation report will map all on-chain TXIDs to off-chain project milestones.

---

## Exhibit C: Compliance & Communications Strategy

> [!NOTE]
> **Decision Pending**: The project will toggle between 506(b) and 506(c) based on the Marketing vs. Private Placement intensity.

### Option 1: Regulation D Rule 506(b) (Private Placement)

- **Constraint**: NO general solicitation or advertising.
- **Audience**: Unlimited accredited investors + up to 35 non-accredited (if applicable).
- **Verification**: Investor self-certification (Accredited Investor Questionnaire) is sufficient.
- **Strategy**: Invite-only portal. No public sharing of investment links.

### Option 2: Regulation D Rule 506(c) (General Solicitation)

- **Constraint**: General solicitation PERMITTED.
- **Audience**: 100% Accredited Investors ONLY.
- **Verification**: **Strict Proof** required. Self-certification is NOT sufficient. Must provide brokerage statements, tax returns, or third-party CPA/Attorney letters.
- **Strategy**: Public performance marketing permitted. Automated KYC/AML with tiered "Proof-of-Accreditation" gates.

---

**Status**: DRAFT - Awaiting BD/Legal refinement.
