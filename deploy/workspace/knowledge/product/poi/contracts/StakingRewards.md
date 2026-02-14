# StakingRewards

## Overview

- Single token staking contract for POI.
- Owners top up rewards that vest over a configurable duration.
- Participants can stake, withdraw, and claim accrued rewards at any time.

## Key Functions

- `stake(uint256 amount)` – deposit staking tokens.
- `withdraw(uint256 amount)` – remove staked tokens.
- `getReward()` / `exit()` – claim earned rewards.
- `notifyRewardAmount(uint256 reward)` – owner funds a reward period.
- `setRewardsDuration(uint256 duration)` – owner updates emission length between periods.

## Deployment Notes

- Constructor arguments: `stakingToken`, `rewardsToken`, `owner` (POI for both tokens in this project).
- `notifyRewardAmount` requires prior token approval and automatically recalculates reward rates.
