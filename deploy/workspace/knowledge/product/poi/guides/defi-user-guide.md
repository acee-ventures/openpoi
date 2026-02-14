# DeFi User Guide / DeFi 用户指南

**Complete Guide to Using POI/USDC Liquidity and LP Mining**

---

## Introduction / 介绍

### English

This guide explains how to use the DeFi module to provide liquidity, earn rewards, and maximize your POI token returns. No technical knowledge required!

**Entry Point**: `/app/trade#lp-mining`

### 中文

本指南说明如何使用 DeFi 模块提供流动性、赚取奖励并最大化您的 POI 代币收益。无需技术知识！

**入口**: `/app/trade#lp-mining`

---

## What is POI/USDC Liquidity and LP Mining? / 什么是 POI/USDC 流动性和 LP Mining？

### English

**Liquidity Provision** means you provide equal amounts of POI and USDC tokens to a trading pool. In return, you receive **LP (Liquidity Provider) tokens** that represent your share of the pool.

**LP Mining** means you stake your LP tokens in a special pool to earn POI token rewards over time.

**Why Participate?**

- Earn trading fees from the pool
- Earn additional POI rewards from LP Mining
- Support POI token liquidity
- Potential for long-term value appreciation

### 中文

**提供流动性**意味着您向交易池提供等值的 POI 和 USDC 代币。作为回报，您会收到代表您在池中份额的 **LP（流动性提供者）代币**。

**LP Mining**意味着您将 LP 代币质押到特殊池中，以赚取 POI 代币奖励。

**为什么参与？**

- 从池中赚取交易手续费
- 从 LP Mining 赚取额外的 POI 奖励
- 支持 POI 代币流动性
- 长期价值增值潜力

---

## Complete User Flow / 完整用户流程

### Step 1: Get POI Tokens / 获取 POI 代币

**Option A: TGE Purchase / TGE 购买**

1. Navigate to `/app/tge`
2. Connect your wallet
3. Purchase POI with USDC
4. Wait for transaction confirmation

**Option B: DEX Trade / DEX 交易**

1. Navigate to `/app/trade`
2. Use the swap card to trade USDC for POI
3. Confirm the swap
4. Wait for transaction confirmation

**What You Need**:

- Wallet connected (MetaMask, Coinbase Wallet, etc.)
- USDC tokens in your wallet
- Base Sepolia network (for testnet) or Base Mainnet

---

### Step 2: Add POI/USDC Liquidity / 添加 POI/USDC 流动性

1. **Navigate to Market Page**:
   - Go to `/app/trade`
   - Scroll to find "Add Liquidity" section

2. **Open Add Liquidity Modal**:
   - Click "添加流动性" (Add Liquidity) button
   - A modal will open

3. **Enter Amounts**:
   - Enter POI amount (or click "最大" for maximum)
   - Enter USDC amount (must be equal value to POI)
   - The system will automatically calculate the USDC amount if you enter POI first

4. **Approve Tokens** (First Time Only):
   - Click "授权 POI" (Approve POI) if needed
   - Confirm transaction in wallet
   - Click "授权 USDC" (Approve USDC) if needed
   - Confirm transaction in wallet

5. **Add Liquidity**:
   - Click "添加流动性" (Add Liquidity) button
   - Review transaction details
   - Confirm in wallet
   - Wait for transaction confirmation

6. **Receive LP Tokens**:
   - LP tokens will appear in your wallet
   - You can see your LP balance in the LP Mining card

**Important Notes**:

- You need equal value of POI and USDC
- There's a 0.5% slippage protection
- Transaction has a 20-minute deadline
- You'll receive LP tokens representing your liquidity position

---

### Step 3: Stake LP Tokens to LP Mining / 将 LP 代币质押到 LP Mining

1. **Navigate to LP Mining Section**:
   - Go to `/app/trade#lp-mining`
   - Or scroll down on Market page to LP Mining card

2. **View Pool Information**:
   - Check TVL (Total Value Locked)
   - Check estimated APR (Annual Percentage Rate)
   - Check your LP Token balance

3. **Stake LP Tokens**:
   - Click "Stake LP" button
   - Enter amount to stake (or click "全部" for all)
   - Click "授权 LP Token" if needed (first time)
   - Confirm approval transaction
   - Click "质押" (Stake) button
   - Confirm transaction in wallet
   - Wait for confirmation

4. **Start Earning Rewards**:
   - Your staked amount will be displayed
   - Rewards accumulate over time
   - Check "待领取奖励" (Pending Rewards) to see earned POI

**Important Notes**:

- You need to approve LP tokens first (one-time)
- Rewards are distributed over the reward period
- You can stake/unstake at any time
- Unstaking doesn't affect already earned rewards

---

### Step 4: Claim Rewards / 领取奖励

1. **Check Pending Rewards**:
   - View "待领取奖励" (Pending Rewards) in LP Mining card
   - Shows amount of POI you can claim

2. **Claim Rewards**:
   - Click "Claim Rewards" button
   - Confirm transaction in wallet
   - Wait for confirmation
   - POI tokens will appear in your wallet

**Important Notes**:

- You can claim rewards at any time
- Claiming doesn't affect your staked LP tokens
- Rewards continue accumulating after claiming

---

### Step 5: (Optional) Stake to Immortality / （可选）质押到 Immortality

1. **Claim LP Mining Rewards**:
   - Follow Step 4 to claim your POI rewards

2. **Navigate to Immortality**:
   - Go to `/app/immortality`
   - Or click link in DeFi Path Guide

3. **Stake POI to Immortality Vault**:
   - Enter POI amount to stake
   - Confirm transaction
   - This increases your Immortality Score

**Benefits**:

- Long-term value capture
- Increases Immortality Score
- Contributes to digital identity preservation
- Potential for future rewards

---

## Understanding the Interface / 理解界面

### Market Page / Market 页面

**Top Section**:

- **Total TVL**: Total value locked across all pools
- **24h Volume**: Trading volume in last 24 hours
- **Active Pools**: Number of active liquidity pools
- **Avg APR**: Average annual percentage rate

**Swap Card** (Top Right):

- Quick swap between POI and USDC
- Price display
- Slippage settings

**DeFi Path Guide**:

- Step-by-step visual guide
- Links to each step
- Shows complete flow

### Add Liquidity Card / 添加流动性卡片

**Display**:

- "添加 POI/USDC 流动性" title
- "添加流动性" button (opens modal)

**Modal Contents**:

- POI amount input with balance
- USDC amount input with balance
- "最大" (Max) buttons
- Approval buttons (if needed)
- Add liquidity button
- Error messages (if any)

### LP Mining Card / LP Mining 卡片

**Pool Statistics**:

- **TVL**: Total value locked in pool
- **估算 APR**: Estimated annual percentage rate
- **已质押 LP**: Total LP tokens staked

**User Statistics**:

- **LP Token 余额**: Your LP token balance
- **待领取奖励**: Your pending POI rewards

**Action Buttons**:

- **Add Liquidity**: Opens DEX to add more liquidity
- **Stake LP**: Stake LP tokens (opens modal)
- **Unstake**: Unstake LP tokens (opens modal)
- **Claim Rewards**: Claim POI rewards

---

## Common Questions / 常见问题

### Q1: How much can I earn? / 我能赚多少？

**A**: Earnings depend on:

- Amount of LP tokens staked
- Current APR (Annual Percentage Rate)
- Reward period duration
- Trading volume (affects pool fees)

Check the "估算 APR" in the LP Mining card for current rates.

### Q2: When can I claim rewards? / 什么时候可以领取奖励？

**A**: You can claim rewards at any time. Rewards accumulate continuously while you have LP tokens staked.

### Q3: Can I unstake anytime? / 我可以随时提取吗？

**A**: Yes! You can unstake your LP tokens at any time. Unstaking doesn't affect rewards you've already earned.

### Q4: What happens if I unstake? / 如果我提取会发生什么？

**A**:

- Your LP tokens are returned to your wallet
- You stop earning new rewards
- Already earned rewards remain claimable
- You can stake again anytime

### Q5: What is impermanent loss? / 什么是无常损失？

**A**: Impermanent loss occurs when the price ratio of POI/USDC changes. If POI price increases significantly, you might have been better off just holding POI. However, you earn trading fees and LP Mining rewards to offset this.

**Risk**: Medium - Price divergence can affect returns

### Q6: Is this safe? / 这安全吗？

**A**:

- Smart contracts are security-audited
- Uses battle-tested Uniswap V2 contracts
- Slippage protection built-in
- However, all DeFi involves smart contract risk

**Risk**: Smart contract bugs could lead to fund loss

### Q7: What if the transaction fails? / 如果交易失败怎么办？

**A**: Common reasons:

- **Insufficient balance**: Check you have enough tokens
- **Slippage error**: Try with smaller amount or wait for better price
- **Network congestion**: Wait and retry
- **Approval needed**: Make sure you've approved tokens first

### Q8: How do I remove liquidity? / 如何移除流动性？

**A**: Currently, you need to use the DEX directly:

1. Go to BaseSwap (or your DEX)
2. Navigate to "Remove Liquidity"
3. Select POI/USDC pair
4. Enter amount to remove
5. Confirm transaction

**Note**: Removing liquidity returns POI and USDC, but burns your LP tokens.

---

## Risk Warnings / 风险提示

### Impermanent Loss / 无常损失

**What it is**: When token prices diverge, liquidity providers may experience impermanent loss compared to just holding tokens.

**Mitigation**: Trading fees and LP Mining rewards help offset this risk.

### Smart Contract Risk / 智能合约风险

**What it is**: Smart contracts could have bugs that lead to fund loss.

**Mitigation**: Contracts are security-audited, but risk always exists.

### Slippage Risk / 滑点风险

**What it is**: Large trades may experience price impact.

**Mitigation**: Built-in 0.5% slippage protection, but large amounts may still experience slippage.

### Reward Rate Changes / 奖励率变化

**What it is**: Pool reward rates may change over time.

**Mitigation**: Check current APR before staking, rates are transparent.

### General DeFi Risks / 一般 DeFi 风险

- **Market volatility**: Token prices can fluctuate
- **Liquidity risk**: Low liquidity can affect trades
- **Regulatory risk**: Regulations may change
- **Technology risk**: Network issues or bugs

**Always**: Only invest what you can afford to lose.

---

## Tips for Success / 成功技巧

1. **Start Small**: Test with small amounts first
2. **Monitor Regularly**: Check your rewards and pool stats
3. **Understand Risks**: Read risk warnings above
4. **Diversify**: Don't put all funds in one pool
5. **Stay Informed**: Follow project updates
6. **Use Trusted Wallets**: Only use official wallet apps
7. **Verify Addresses**: Always verify contract addresses
8. **Keep Private Keys Safe**: Never share your private keys

---

## Getting Help / 获取帮助

### Support Channels / 支持渠道

- **Discord**: [Join our community](https://discord.gg/proofofinfluence)
- **Documentation**: See [Technical Overview](../../defi/overview.md) for developers
- **Whitepaper**: See [2.2.3.1 DEX/DeFi & Liquidity](../../whitepaper/projectx/2.2.3.1-defi-liquidity.md)

### Reporting Issues / 报告问题

If you encounter issues:

1. Check this guide first
2. Check transaction on BaseScan explorer
3. Contact support on Discord
4. Provide transaction hash and error message

---

## Related Documentation / 相关文档

- [DeFi Technical Overview](../../defi/overview.md) - Developer documentation
- [Whitepaper - 2.2.3.1 DEX/DeFi & Liquidity](../../whitepaper/projectx/2.2.3.1-defi-liquidity.md) - Architecture details
- [CHANGELOG](../../CHANGELOG.md) - Version history

---

**Last Updated**: 2025-12-04 PST  
**Version**: 1.0
