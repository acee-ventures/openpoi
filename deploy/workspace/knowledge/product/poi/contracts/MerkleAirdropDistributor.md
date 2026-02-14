# MerkleAirdropDistributor

## Overview

- Distributes POI tokens using Merkle proofs.
- Supports multiple rounds with automatic round incrementing.
- Claiming can be paused in emergencies.
- Prevents double claiming using bitmap tracking.

## Key Functions

- `setToken(address token)` – owner sets the POI token address.
- `setTreasury(address treasury)` – owner sets the treasury address.
- `setRoot(bytes32 root)` – owner sets root for next round (auto-increments).
- `updateRoot(uint64 roundId, bytes32 root)` – owner updates root for a specific round.
- `claim(uint256 index, address account, uint256 amount, bytes32[] proof)` – claims from current round.
- `claimFromRound(uint64 roundId, uint256 index, address account, uint256 amount, bytes32[] proof)` – claims from specific round.
- `isClaimed(uint64 roundId, uint256 index)` – checks if already claimed.
- `withdrawRemaining(uint256 amount)` – owner recovers unused tokens to treasury.
- `pause()` / `unpause()` – emergency controls.

## Deployment Status

- ✅ **Deployed on Base Sepolia**
- **Address**: `0xa3ae789eA6409ab5F92a69EC41dbA1E6f3C57A2e`
- **Chain ID**: 84532
- **Network**: base-sepolia
- **Token**: `0x737869142C93078Dae4d78D4E8c5dbD45160565a` (POI Token)
- **Treasury**: `0xdc6a8738c0b8AB2ED33d98b04E9f20280fBA8F55`

## Deployment Notes

- Constructor argument: `owner`.
- Token and treasury must be set after deployment.
- Merkle leaves use double hashing: `keccak256(keccak256(abi.encode(index, account, amount)))`.
- Each round tracks claims independently using bitmap.
