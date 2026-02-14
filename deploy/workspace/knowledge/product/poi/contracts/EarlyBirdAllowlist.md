# EarlyBirdAllowlist

## Overview

- Standalone Merkle-based allowlist usable by external contracts (e.g., TGESale).
- Tracks allocation consumption per account.
- Supports trusted consumers (e.g., TGESale contract) that can consume allocations.
- Versioned root system for updating allowlist without resetting consumption.

## Key Functions

- `setRoot(bytes32 root)` – owner updates the Merkle root (increments version).
- `setTrustedConsumer(address consumer, bool allowed)` – owner manages trusted consumers.
- `verify(address account, uint256 allocation, bytes32[] proof)` – verifies membership and allocation.
- `remaining(address account)` – returns remaining allocation for account.
- `consume(address account, uint256 allocation, uint256 amount, bytes32[] proof)` – consumes allocation (only owner or trusted consumer).

## Deployment Status

- ✅ **Deployed on Base Sepolia**
- **Address**: `0x75D75a4870762422D85D275b22F5A87Df78b4852`
- **Chain ID**: 84532
- **Network**: base-sepolia
- **Root Version**: 1

## Deployment Notes

- Constructor argument: `owner`.
- Merkle leaves use double hashing: `keccak256(keccak256(abi.encode(account, allocation)))`.
- When root is updated, version increments and existing allocations reset for new version.
- Only owner or trusted consumers can call `consume()`.
