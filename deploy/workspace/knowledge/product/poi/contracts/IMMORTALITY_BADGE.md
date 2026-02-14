# ImmortalityBadge

The `ImmortalityBadge` contract is a role-gated ERC-721 collection that powers the "Test Immortality Badge" mint used by the AgentKit MVP. It is designed to operate as a soulbound badge with optional per-badge transferability controls.

## Network & Address

- **Target network:** Base Sepolia (chain id `84532`)
- **Deployment script:** `scripts/deploy-immortality-badge.ts`
- **Artifact:** `shared/contracts/immortality_badge.json`

## Roles

- `DEFAULT_ADMIN_ROLE` – can configure badge metadata, base URI, and manage other roles.
- `MINTER_ROLE` – authorized to mint badges on behalf of users. The backend / AgentKit wallet should hold this role.

## Key Functions

- `configureBadgeType(uint256 badgeType, BadgeMeta meta)` – enables/disables badge types, marks them transferable or soulbound, and optionally sets a custom token URI.
- `mintBadge(address to, uint256 badgeType)` – mints the requested badge type to the recipient. Reverts if the badge type is disabled or already claimed by the recipient.
- `hasBadge(address account, uint256 badgeType)` – view helper for frontend/API usage.
- `badgeTypeOf(uint256 tokenId)` – exposes which badge type a token represents.

## Constants

- `BADGE_TYPE_TEST = 1` – the required type for the MVP's "Test Immortality Badge".

## Events

- `BadgeMinted(address to, uint256 badgeType, uint256 tokenId)` – emitted whenever a badge is minted.

## Transfer Restrictions

By default badge types are configured as non-transferable (soulbound). Attempting to transfer a non-transferable badge reverts with `BadgeTransferDisabled`.

## AgentKit Usage

AgentKit adapters should call `mintBadge(userWallet, BADGE_TYPE_TEST)` when the risk engine approves the "Mint Test Badge" action. All badge mints must be logged in the `agentkit_actions` table.
