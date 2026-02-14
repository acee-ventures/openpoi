# POI StakingRewards

The `StakingRewards` contract is a single-token staking module inspired by Synthetix. Users stake POI to earn additional POI rewards over time.

## Network & Address

- **Target network:** Base Sepolia (`84532`)
- **Artifact:** `shared/contracts/staking_rewards.json`
- **Deployment script:** `scripts/deploy-staking.ts`

## Core Actions

- `stake(uint256 amount)` – transfer POI into the contract and start accruing rewards.
- `withdraw(uint256 amount)` – remove staked POI. Reverts if withdrawing more than the staked balance.
- `getReward()` – harvest pending POI rewards.
- `exit()` – convenience helper that withdraws the full stake and harvests rewards.

## Views

- `balanceOf(address account)` – current staked amount.
- `earned(address account)` – accrued but unpaid rewards.
- `totalSupply()` – aggregate staked POI.

## Events

- `Staked(address user, uint256 amount)`
- `Withdrawn(address user, uint256 amount)`
- `RewardPaid(address user, uint256 reward)`

## Reward Funding

Admins call `notifyRewardAmount(uint256 reward)` to push POI rewards into the contract and set the emission schedule (`rewardsDuration`, default 30 days).

## AgentKit Usage

Agent-facing actions should map to the following contract calls:

- `STAKE_POI` → `stake(amount)`
- `UNSTAKE_POI` → `withdraw(amount)`
- `CLAIM_POI_REWARD` → `getReward()`
  Ensure every call logs to `agentkit_actions` and that the backend enforces per-user limits (min stake, cooldowns, etc.).
