# AchievementBadges

## Overview

- Non-transferable ERC1155 badges.
- Role based minting (soulbound tokens).

## Key Functions

- `mint(address to, uint256 id, uint256 amount)` – only `MINTER_ROLE`.
- `mintBatch(address to, uint256[] ids, uint256[] amounts)` – batch mint.

## Deployment Notes

- Constructor arguments: `baseUri`, `admin`.
- Transfers between user addresses revert with `"SBT: non-transferable"`.
