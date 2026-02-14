# Micro LP Test Plan

# 超小号 LP 测试计划

**Dual Language Document | 中英双语文档**

---

## 1. Test LP Parameters | 测试 LP 参数

### Chinese Version | 中文版

| 参数         | 数值                    | 说明                            |
| ------------ | ----------------------- | ------------------------------- |
| 初始 LP POI  | **200 POI**             | 推荐测试规模（1:10,000 缩小版） |
| 初始 LP USDC | **20 USDC**             | 推荐测试规模（1:10,000 缩小版） |
| 最小 LP POI  | **100 POI**             | 最小可行测试配置                |
| 最小 LP USDC | **10 USDC**             | 最小可行测试配置                |
| 目标价格     | 0.10 USDC/POI           | 与主网设计一致                  |
| 初始 TVL     | $40 (推荐) / $20 (最小) | 测试价值（USDC + POI 同值）     |
| 测试交易范围 | **0.01 ~ 1 USDC**       | 最小到最大交易金额              |

**设计说明**：

- **推荐配置**：200 POI / 20 USDC（主网设计的 1:10,000 缩小版，更好的价格稳定性）
- **最小配置**：100 POI / 10 USDC（用于基础测试，价格可能略有波动）
- **价格一致性**：目标价格保持 0.10 USDC/POI
- **测试目的**：足够测试小规模交易场景（0.01-1 USDC）和前端功能
- **注意**：如果资金充足，推荐使用 200/20 以获得更好的价格稳定性；最小配置 100/10 适用于基础功能测试

### English Version | 英文版

| Parameter              | Value                             | Description                                 |
| ---------------------- | --------------------------------- | ------------------------------------------- |
| Initial LP POI         | **200 POI**                       | Recommended test scale (1:10,000 reduction) |
| Initial LP USDC        | **20 USDC**                       | Recommended test scale (1:10,000 reduction) |
| Minimum LP POI         | **100 POI**                       | Minimum viable test configuration           |
| Minimum LP USDC        | **10 USDC**                       | Minimum viable test configuration           |
| Target Price           | 0.10 USDC/POI                     | Aligned with mainnet design                 |
| Initial TVL            | $40 (recommended) / $20 (minimum) | Test value (USDC + POI equal value)         |
| Test Transaction Range | **0.01 ~ 1 USDC**                 | Min to max transaction amount               |

**Design Notes**:

- **Recommended Configuration**: 200 POI / 20 USDC (1:10,000 scale of mainnet design, better price stability)
- **Minimum Configuration**: 100 POI / 10 USDC (for basic testing, price may fluctuate slightly)
- **Price Consistency**: Target price maintains 0.10 USDC/POI
- **Testing Purpose**: Sufficient for testing small-scale transaction scenarios (0.01-1 USDC) and frontend functionality
- **Note**: If funds are available, use 200/20 for better price stability; minimum 100/10 is suitable for basic functional testing

---

## 2. Test Treasury Wallet | 测试国库钱包

### Chinese Version | 中文版

**选择方式**：

1. **环境变量优先**：`TEST_TREASURY_PRIVATE_KEY`
2. **回退选项**：
   - `LIQUIDITY_TREASURY_PRIVATE_KEY`
   - `TREASURY_PRIVATE_KEY`
   - `PRIVATE_KEY` 或 `DEPLOYER_PRIVATE_KEY`

**所需余额**：

- **推荐配置**：20 USDC / 200 POI（更好的价格稳定性）
- **最小配置**：10 USDC / 100 POI（基础测试）

**资金准备**：

- 从 **TGE Sale 合约** withdraw 部分 USDC（**注意：TGE 和 Swap LP 是分开的合约**）
- 使用 mint 权限给自己 200 POI（测试版合约）
- 或从现有测试钱包转账

**重要区分**：

- **TGE Sale 合约** (`TGESALE_ADDRESS`): 用于初始代币销售，用户通过 USDC 购买 POI
- **Swap LP Pool** (`POI_USDC_LP_PAIR_ADDRESS`): 用于 DEX 交换，用户可以在 USDC 和 POI 之间自由交换
- **两者独立**：TGE 购买和 Swap 是两个完全独立的流程，使用不同的合约地址

### English Version | 英文版

**Selection Method**:

1. **Environment Variable Priority**: `TEST_TREASURY_PRIVATE_KEY`
2. **Fallback Options**:
   - `LIQUIDITY_TREASURY_PRIVATE_KEY`
   - `TREASURY_PRIVATE_KEY`
   - `PRIVATE_KEY` or `DEPLOYER_PRIVATE_KEY`

**Required Balances** (Recommended Configuration):

- **20 USDC** (testnet USDC) - Recommended amount
- **200 POI** (test POI Token) - Recommended amount

**Funding Methods**:

- Withdraw USDC from **TGE Sale contract** (Note: TGE and Swap LP are separate contracts)
- Use mint permission to mint POI (100 POI for minimum, 200 POI for recommended)
- Or transfer from existing test wallets

**Important Distinction**:

- **TGE Sale Contract** (`TGESALE_ADDRESS`): Used for initial token sale, users buy POI with USDC
- **Swap LP Pool** (`POI_USDC_LP_PAIR_ADDRESS`): Used for DEX swaps, users can freely exchange between USDC and POI
- **They are independent**: TGE purchase and Swap are two completely separate processes using different contract addresses

---

## 3. LP Creation Steps | LP 创建步骤

### Chinese Version | 中文版

**步骤 1：Dry-run 测试**

```bash
npx tsx scripts/create-micro-lp.ts --dry-run
```

验证：

- 参数配置正确
- 钱包余额充足
- 网络配置正确

**步骤 2：创建 LP 池**

```bash
# 设置环境变量
export TEST_TREASURY_PRIVATE_KEY="0x..."
export BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
# 可选：覆盖默认地址
export POI_TOKEN_ADDRESS="0x737869142C93078Dae4d78D4E8c5dbD45160565a"
export USDC_TOKEN_ADDRESS="0x036CbD53842c5426634e7929541eC2318f3dCF7e"

# 运行脚本
npx tsx scripts/create-micro-lp.ts
```

**步骤 3：验证池子创建**

脚本会输出：

- Pair 地址
- 最终储备量
- 最终价格
- 价格差异百分比

**步骤 4：更新配置**

1. 从 `deployments/poi-usdc-lp-micro-base-sepolia.json` 读取 pair 地址
2. 更新 `networkConfig.ts` 或设置环境变量：
   ```bash
   export VITE_POI_USDC_LP_PAIR_ADDRESS="0x..."
   ```

### English Version | 英文版

**Step 1: Dry-run Test**

```bash
npx tsx scripts/create-micro-lp.ts --dry-run
```

Verify:

- Parameter configuration is correct
- Wallet balance is sufficient
- Network configuration is correct

**Step 2: Create LP Pool**

```bash
# Set environment variables
export TEST_TREASURY_PRIVATE_KEY="0x..."
export BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
# Optional: override default addresses
export POI_TOKEN_ADDRESS="0x737869142C93078Dae4d78D4E8c5dbD45160565a"
export USDC_TOKEN_ADDRESS="0x036CbD53842c5426634e7929541eC2318f3dCF7e"

# Run script
npx tsx scripts/create-micro-lp.ts
```

**Step 3: Verify Pool Creation**

Script will output:

- Pair address
- Final reserves
- Final price
- Price difference percentage

**Step 4: Update Configuration**

1. Read pair address from `deployments/poi-usdc-lp-micro-base-sepolia.json`
2. Update `networkConfig.ts` or set environment variable:
   ```bash
   export VITE_POI_USDC_LP_PAIR_ADDRESS="0x..."
   ```

---

## 4. Test Scenarios | 测试场景

### Scenario 1: USDC → POI | 场景 1：USDC → POI

**Chinese Version | 中文版**

**测试用例**：

1. **小额交易：0.01 USDC**
   - 输入：0.01 USDC
   - 验证：
     - 实际得到的 POI 数量
     - 价格瞬时变化几乎可以忽略
     - 前端显示是否正常

2. **中等交易：0.1 USDC**
   - 输入：0.1 USDC
   - 验证：
     - 得到的 POI 数量
     - 价格微调幅度
     - Quote / slippage 显示是否合理

3. **大额交易：1 USDC（占池子 USDC 的 5%）**
   - 输入：1 USDC
   - 验证：
     - 滑点是否明显
     - 池子新余额是否符合 x\*y=k
     - 价格是否被推高一点点

**English Version | 英文版**

**Test Cases**:

1. **Small Transaction: 0.01 USDC**
   - Input: 0.01 USDC
   - Verify:
     - Actual POI received
     - Price change is negligible
     - Frontend display is normal

2. **Medium Transaction: 0.1 USDC**
   - Input: 0.1 USDC
   - Verify:
     - POI amount received
     - Price adjustment magnitude
     - Quote / slippage display is reasonable

3. **Large Transaction: 1 USDC (5% of pool USDC)**
   - Input: 1 USDC
   - Verify:
     - Slippage is noticeable
     - Pool new balance follows x\*y=k
     - Price is pushed up slightly

---

### Scenario 2: POI → USDC | 场景 2：POI → USDC

**Chinese Version | 中文版**

**测试用例**：

1. **小额交易：1 POI**
   - 输入：1 POI
   - 验证：
     - 实际得到的 USDC 数量
     - Quote 准确性

2. **中等交易：10 POI**
   - 输入：10 POI
   - 验证：
     - 得到的 USDC 数量
     - 前端 quote 与 DEX 实际成交接近

3. **大额交易：50 POI**
   - 输入：50 POI
   - 验证：
     - 得到的 USDC 数量
     - 滑点影响
     - 池子状态变化

**English Version | 英文版**

**Test Cases**:

1. **Small Transaction: 1 POI**
   - Input: 1 POI
   - Verify:
     - Actual USDC received
     - Quote accuracy

2. **Medium Transaction: 10 POI**
   - Input: 10 POI
   - Verify:
     - USDC amount received
     - Frontend quote matches DEX actual execution

3. **Large Transaction: 50 POI**
   - Input: 50 POI
   - Verify:
     - USDC amount received
     - Slippage impact
     - Pool state changes

---

### Scenario 3: Repeated Swaps | 场景 3：重复交换

**Chinese Version | 中文版**

**测试流程**：

1. 执行多次来回 swap：
   - USDC → POI
   - POI → USDC
   - 重复 3-5 次

2. 验证：
   - 池子不会爆掉
   - 价格在波动但保持合理
   - 前端显示正常
   - 余额更新正确

**English Version | 英文版**

**Test Flow**:

1. Execute multiple back-and-forth swaps:
   - USDC → POI
   - POI → USDC
   - Repeat 3-5 times

2. Verify:
   - Pool doesn't break
   - Price fluctuates but remains reasonable
   - Frontend display is normal
   - Balance updates correctly

---

## 5. Frontend Testing Checklist | 前端测试清单

### Chinese Version | 中文版

- [ ] **输入验证**
  - [ ] 最小金额限制（0.01 USDC）✅ 已在代码中实现
  - [ ] 最大金额限制（1.0 USDC）✅ 已在代码中实现
  - [ ] 错误提示显示正确
  - [ ] 超出范围时的错误提示清晰

- [ ] **Token 方向切换**
  - [ ] USDC ↔ POI 切换按钮工作正常
  - [ ] 切换时输入框清空
  - [ ] 切换时余额显示更新

- [ ] **授权流程**
  - [ ] USDC 授权（USDC → POI）
  - [ ] POI 授权（POI → USDC）
  - [ ] 授权状态正确显示

- [ ] **报价准确性**
  - [ ] Quote 与链上实际成交接近
  - [ ] 滑点显示合理
  - [ ] 汇率计算正确

- [ ] **交易执行**
  - [ ] 交易成功执行
  - [ ] 交易哈希正确显示
  - [ ] 错误处理正确

- [ ] **余额更新**
  - [ ] 交易后余额自动更新
  - [ ] USDC 和 POI 余额都更新

### English Version | 英文版

- [ ] **Input Validation**
  - [ ] Minimum amount limit (0.01 USDC) ✅ Implemented in code
  - [ ] Maximum amount limit (1.0 USDC) ✅ Implemented in code
  - [ ] Error messages display correctly
  - [ ] Clear error messages when amount exceeds range

- [ ] **Token Direction Toggle**
  - [ ] USDC ↔ POI toggle button works
  - [ ] Input fields clear on toggle
  - [ ] Balance display updates on toggle

- [ ] **Approval Flow**
  - [ ] USDC approval (USDC → POI)
  - [ ] POI approval (POI → USDC)
  - [ ] Approval status displays correctly

- [ ] **Quote Accuracy**
  - [ ] Quote matches on-chain actual execution
  - [ ] Slippage display is reasonable
  - [ ] Exchange rate calculation is correct

- [ ] **Transaction Execution**
  - [ ] Transaction executes successfully
  - [ ] Transaction hash displays correctly
  - [ ] Error handling is correct

- [ ] **Balance Updates**
  - [ ] Balance auto-updates after transaction
  - [ ] Both USDC and POI balances update

---

## 6. Pool State Verification | 池子状态验证

### Chinese Version | 中文版

**验证公式：x \* y = k**

在每次 swap 后，验证：

```
reserve0 * reserve1 = constant (k)
```

**价格计算**：

```
price = reserve_usdc / reserve_poi
```

**验证步骤**：

1. 记录 swap 前的储备量
2. 执行 swap
3. 记录 swap 后的储备量
4. 验证 x\*y=k 公式
5. 计算新价格
6. 验证价格变化合理

**工具**：

- 使用 `scripts/check-lp-balances.cjs` 检查储备量
- 或直接在链上查询 pair 合约的 `getReserves()`

### English Version | 英文版

**Verify Formula: x \* y = k**

After each swap, verify:

```
reserve0 * reserve1 = constant (k)
```

**Price Calculation**:

```
price = reserve_usdc / reserve_poi
```

**Verification Steps**:

1. Record reserves before swap
2. Execute swap
3. Record reserves after swap
4. Verify x\*y=k formula
5. Calculate new price
6. Verify price change is reasonable

**Tools**:

- Use `scripts/check-lp-balances.cjs` to check reserves
- Or directly query pair contract's `getReserves()` on-chain

---

## 7. Important Notes | 重要说明

### Chinese Version | 中文版

1. **合约用途严格区分**：
   - **`TGESALE_ADDRESS`** - **仅用于 TGE Sale（初始代币销售）**
     - 用户通过此合约使用 USDC 购买 POI
     - 这是**一次性购买流程**，有销售窗口和价格机制
     - **前端组件**：TGE 购买页面/组件使用此地址
   - **`POI_USDC_LP_PAIR_ADDRESS`** (Router: `ROUTER_ADDRESS`) - **仅用于 Swap（DEX 交换）**
     - 用户通过此流动性池在 USDC 和 POI 之间自由交换
     - 这是**持续交易流程**，价格由 AMM 算法决定
     - **前端组件**：Swap card (`PoiUsdcSwapCard.tsx`) 使用此地址
   - **两者完全独立**：
     - TGE Sale 的 POI 不是来自 LP Pool
     - Swap 的流动性来自独立的 LP Pool，与 TGE 无关
     - 用户可以先从 TGE 购买，然后再通过 Swap 交易

2. **测试网专用**：
   - 此配置仅用于 Base Sepolia 测试网
   - 主网将使用不同的参数（见 `LIQUIDITY_AND_PRICE_DESIGN.md`）

3. **LP 规模配置**：
   - **推荐配置**：200 POI / 20 USDC（更好的价格稳定性，1:10,000 缩小版）
   - **最小配置**：100 POI / 10 USDC（基础测试，适用于 0.01-1 USDC 交易范围）
   - 目标价格：0.10 USDC/POI
   - 允许小幅波动（±10%）
   - **测试交易范围**：0.01 ~ 1 USDC

### English Version | 英文版

1. **Strict Contract Usage Separation**:
   - **`TGESALE_ADDRESS`** - **ONLY for TGE Sale (Initial Token Offering)**
     - Users buy POI with USDC through this contract
     - This is a **one-time purchase process** with sale window and pricing mechanism
     - **Frontend components**: TGE purchase page/components use this address
   - **`POI_USDC_LP_PAIR_ADDRESS`** (Router: `ROUTER_ADDRESS`) - **ONLY for Swap (DEX Exchange)**
     - Users freely exchange between USDC and POI through this liquidity pool
     - This is a **continuous trading process** with AMM-determined pricing
     - **Frontend components**: Swap card (`PoiUsdcSwapCard.tsx`) uses this address
   - **They are completely independent**:
     - POI from TGE Sale does not come from LP Pool
     - Swap liquidity comes from independent LP Pool, unrelated to TGE
     - Users can first buy from TGE, then trade via Swap

2. **Testnet Only**:
   - This configuration is for Base Sepolia testnet only
   - Mainnet will use different parameters (see `LIQUIDITY_AND_PRICE_DESIGN.md`)

3. **LP Scale Configuration**:
   - **Recommended configuration**: 200 POI / 20 USDC (better price stability, 1:10,000 reduction)
   - **Minimum configuration**: 100 POI / 10 USDC (basic testing, suitable for 0.01-1 USDC transaction range)
   - Target price: 0.10 USDC/POI
   - Allow small fluctuations (±10%)
   - **Test transaction range**: 0.01 ~ 1 USDC

---

**Document Version**: 1.1  
**Last Updated**: 2025-12-11 PST  
**Status**: Ready for Testing ✅
**Changes**: Updated to recommend 200/20 configuration, clarified TGE vs Swap contract separation
