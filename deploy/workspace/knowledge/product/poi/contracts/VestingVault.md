# VestingVault

## Overview

- Holds POI allocations for multiple beneficiaries.
- Supports cliff and linear vesting periods per beneficiary with multiple schedules per beneficiary.
- Beneficiaries withdraw vested tokens on demand.
- Owner can revoke revocable schedules.

## Key Functions

- `createSchedule(address beneficiary, uint256 totalAmount, uint64 start, uint64 cliff, uint64 duration, uint64 slicePeriodSeconds, bool revocable)` – owner configures schedule.
- `getSchedule(uint256 scheduleId)` – returns schedule details.
- `schedulesOf(address beneficiary)` – returns all schedule IDs for a beneficiary.
- `releasableAmount(uint256 scheduleId)` – returns amount available for release.
- `release(uint256 scheduleId)` – beneficiary releases available tokens.
- `revoke(uint256 scheduleId)` – owner revokes a revocable schedule.

## Deployment Status

- ✅ **Deployed on Base Sepolia**
- **Address**: `0xe4E695722C598CBa27723ab98049818b4b827924`
- **Chain ID**: 84532
- **Network**: base-sepolia

## Deployment Notes

- Constructor arguments: `tokenAddress`, `owner`.
- Vault must be funded with sufficient POI tokens prior to withdrawals.
- Each beneficiary can have multiple schedules.
- Schedules support cliff periods and linear vesting.
