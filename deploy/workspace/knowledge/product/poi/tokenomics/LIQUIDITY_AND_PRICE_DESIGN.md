# Liquidity & Price Design

# 流动性与价格机制设计

**Dual Language Document | 中英双语文档**

---

## 1. Overview | 概述

### TGE Fundraising Model | TGE 募资模型

The Token Generation Event (TGE) is designed to bootstrap the POI ecosystem with initial capital while establishing a stable foundation for secondary market trading.

代币生成事件（TGE）旨在为 POI 生态系统提供初始资金，同时为二级市场交易建立稳定基础。

### Liquidity Pool Design Goals | 流动性池设计目标

1. **Price Alignment**: Ensure TGE price matches initial LP price to prevent price dislocation
   **价格对齐**：确保 TGE 价格与初始 LP 价格一致，防止价格倒挂

2. **Stability**: Provide sufficient liquidity for early trading while maintaining price stability
   **稳定性**：为早期交易提供充足流动性，同时保持价格稳定

3. **Scalability**: Reserve protocol-owned liquidity for future market expansion
   **可扩展性**：保留协议拥有的流动性用于未来市场扩张

4. **Sustainability**: Use protocol revenue to continuously support liquidity
   **可持续性**：使用协议收入持续支持流动性

### Value for All Stakeholders | 对玩家、投资人、协议三方的价值

**For Players | 对玩家**:

- Fair entry price aligned with TGE
  与 TGE 对齐的公平入场价格
- Low slippage for early trading
  早期交易低滑点
- Predictable price range
  可预测的价格区间

**For Investors | 对投资人**:

- Clear tokenomics and liquidity structure
  清晰的代币经济学和流动性结构
- No price manipulation or pump-and-dump
  无价格操纵或拉盘砸盘
- Long-term value preservation
  长期价值保护

**For Protocol | 对协议**:

- Sustainable liquidity management
  可持续的流动性管理
- Protocol-owned liquidity (POL) for stability
  协议拥有的流动性（POL）用于稳定性
- Revenue recycling mechanism
  收入回流机制

---

## 2. TGE → Liquidity Pipeline | TGE → 流动性

### Chinese Version | 中文版

**公募目标：3,000,000 USDC**

**价格：0.10 USD / POI**

**发行：30,000,000 POI（占总量 3%）**

**募资资金流向：**

1. **200,000 USDC 用于初始 LP**
   - 与 2,000,000 POI 配对
   - 建立初始流动性池
   - 确保价格与 TGE 一致

2. **剩余 2,800,000 USDC 用作运营、储备、风险控制、市场扩张**
   - 项目运营资金
   - 风险储备
   - 市场推广
   - 技术开发

3. **后续依靠 Protocol LP POI 分批补充流动性**
   - 48,000,000 POI 储备用于流动性补充
   - 根据市场情况分阶段释放
   - 维持价格稳定

### English Version | 英文版

**Fundraising Target: 3,000,000 USDC**

**Price: 0.10 USD / POI**

**Issuance: 30,000,000 POI (3% of total supply)**

**Fund Allocation:**

1. **200,000 USDC for Initial LP**
   - Paired with 2,000,000 POI
   - Establish initial liquidity pool
   - Ensure price alignment with TGE

2. **Remaining 2,800,000 USDC for Operations, Reserves, Risk Control, and Market Expansion**
   - Project operations
   - Risk reserves
   - Market promotion
   - Technical development

3. **Future Liquidity Supplement via Protocol LP POI**
   - 48,000,000 POI reserve for liquidity supplementation
   - Phased release based on market conditions
   - Maintain price stability

---

## 3. Initial LP Design | 初始 LP 设计

### Chinese Version | 中文版

| 参数         | 数值          | 说明               |
| ------------ | ------------- | ------------------ |
| 初始 LP POI  | 2,000,000 POI | 占 Protocol LP 4%  |
| 初始 LP USDC | $200,000      | 占 TGE 募资约 6.7% |
| 初始价格     | $0.10 / POI   | 与 TGE 完全对齐    |
| 初始 TVL     | $400,000      | USDC + POI 同值    |

**设计理由：**

1. **避免价格倒挂，保证上线价格与 TGE 一致**
   - TGE 价格为 $0.10 / POI
   - 初始 LP 价格也为 $0.10 / POI
   - 确保二级市场开盘价与 TGE 价格一致

2. **初始 TVL 40 万流动性对早期市场足够**
   - 足够支持早期交易需求
   - 避免过度滑点
   - 为市场提供信心

3. **大部分 Protocol LP（48M POI）用于后续做市，提高价格稳定性**
   - 保留 96% 的 Protocol LP 用于后续补充
   - 根据市场情况灵活调整
   - 长期价格稳定机制

4. **不会过度占用 TGE 募资，有利于项目长期运营**
   - 仅使用 6.7% 的募资用于初始 LP
   - 保留 93.3% 用于项目运营和发展
   - 平衡流动性和运营需求

### English Version | 英文版

| Parameter       | Value         | Description               |
| --------------- | ------------- | ------------------------- |
| Initial LP POI  | 2,000,000 POI | 4% of Protocol LP         |
| Initial LP USDC | $200,000      | ~6.7% of TGE fundraising  |
| Initial Price   | $0.10 / POI   | Fully aligned with TGE    |
| Initial TVL     | $400,000      | Equal value of USDC + POI |

**Design Rationale:**

1. **Prevent Price Dislocation, Ensure Launch Price Aligns with TGE**
   - TGE price: $0.10 / POI
   - Initial LP price: $0.10 / POI
   - Ensure secondary market opening price matches TGE price

2. **Initial TVL of $400K is Sufficient for Early Market**
   - Sufficient to support early trading demand
   - Avoid excessive slippage
   - Provide market confidence

3. **Most Protocol LP (48M POI) Reserved for Future Market Making, Improving Price Stability**
   - Reserve 96% of Protocol LP for future supplementation
   - Flexible adjustment based on market conditions
   - Long-term price stability mechanism

4. **Does Not Over-consume TGE Fundraising, Beneficial for Long-term Operations**
   - Only 6.7% of fundraising used for initial LP
   - Reserve 93.3% for project operations and development
   - Balance liquidity and operational needs

---

## 4. Protocol LP Reserve | 协议 LP 储备池

### Chinese Version | 中文版

**50,000,000 POI 为协议保留用于流动性与做市**

**初始只释放 2M（=4%）进入池子**

**余下 48M 用于：**

1. **市场扩大时期追加流动性**
   - 当交易量增加时
   - 当用户增长时
   - 当需要降低滑点时

2. **玩家增长时期降低滑点**
   - 随着用户基数扩大
   - 随着交易频率增加
   - 维持良好的交易体验

3. **价格稳定机制（Protocol-Owned Liquidity, POL）**
   - 协议拥有的流动性
   - 不受外部做市商控制
   - 长期价格稳定保障

4. **长期协议资金安全机制**
   - 作为协议储备资产
   - 应对市场波动
   - 支持协议长期发展

### English Version | 英文版

**50,000,000 POI Reserved by Protocol for Liquidity and Market Making**

**Initially Only 2M (=4%) Released into Pool**

**Remaining 48M Used For:**

1. **Liquidity Addition During Market Expansion**
   - When trading volume increases
   - When user base grows
   - When slippage reduction is needed

2. **Slippage Reduction During Player Growth**
   - As user base expands
   - As trading frequency increases
   - Maintain good trading experience

3. **Price Stability Mechanism (Protocol-Owned Liquidity, POL)**
   - Protocol-owned liquidity
   - Not controlled by external market makers
   - Long-term price stability guarantee

4. **Long-term Protocol Fund Security Mechanism**
   - As protocol reserve assets
   - Respond to market volatility
   - Support long-term protocol development

### LP Reserve Structure | LP 储备结构示意图

```
Protocol LP Reserve (50M POI)
├── Initial LP (2M POI, 4%) ← 立即使用
│   └── Paired with $200K USDC
│   └── Initial TVL: $400K
│
└── Reserve Pool (48M POI, 96%) ← 分阶段释放
    ├── Market Expansion Phase 1
    ├── Market Expansion Phase 2
    ├── Market Expansion Phase 3
    └── Long-term Stability Reserve
```

---

## 5. Price Stability Model | 价格稳定机制

### Chinese Version | 中文版

**短期目标区间：0.08 – 0.15 USD / POI**

**长期稳定区间：0.10 – 0.12 USD / POI**

**协议目标：✨让 POI 价格围绕 $0.10–0.12 区间震荡但趋稳**

**机制包括：**

1. **阶段性追加 LP**
   - 根据市场交易量
   - 根据价格波动情况
   - 根据用户增长需求
   - 分阶段释放 Protocol LP 储备

2. **利用协议收入回流**
   - **Influence Mining 收益**：部分用于 LP 补充
   - **Escrow Fees**：交易手续费回流
   - **RWA Marketplace**：市场交易费用
   - 持续支持流动性

3. **不做暴力回购，不做击鼓传花式暴涨叙事**
   - 不进行大规模回购操作
   - 不制造价格暴涨假象
   - 不采用击鼓传花式营销
   - 专注于长期价值建设

4. **价格稳定策略**
   - 当价格低于 $0.08 时：增加 LP 支持
   - 当价格高于 $0.15 时：允许自然回调
   - 长期目标：维持在 $0.10–0.12 区间

### English Version | 英文版

**Short-term Target Range: 0.08 – 0.15 USD / POI**

**Long-term Stable Range: 0.10 – 0.12 USD / POI**

**Protocol Goal: ✨ Let POI price oscillate around $0.10–0.12 range but trend toward stability**

**Mechanisms Include:**

1. **Phased LP Addition**
   - Based on market trading volume
   - Based on price volatility
   - Based on user growth needs
   - Phased release of Protocol LP reserve

2. **Protocol Revenue Recycling**
   - **Influence Mining Revenue**: Partially used for LP supplementation
   - **Escrow Fees**: Trading fee recycling
   - **RWA Marketplace**: Market trading fees
   - Continuous liquidity support

3. **No Aggressive Buybacks, No Pump-and-Dump Narratives**
   - No large-scale buyback operations
   - No artificial price surge
   - No pump-and-dump marketing
   - Focus on long-term value building

4. **Price Stability Strategy**
   - When price below $0.08: Increase LP support
   - When price above $0.15: Allow natural correction
   - Long-term goal: Maintain in $0.10–0.12 range

---

## 6. Liquidity Flow Diagram | 流动性流程图

### Text Version | 文字版

```
TGE (3,000,000 USDC)
      ↓
      ├─→ 200,000 USDC → Initial LP
      │                    ├─→ 2,000,000 POI (Protocol LP)
      │                    └─→ 200,000 USDC (TGE Funds)
      │                    └─→ Initial TVL: $400,000
      │                    └─→ Initial Price: $0.10 / POI
      │
      └─→ 2,800,000 USDC → Operations & Reserves
                           ├─→ Project Operations
                           ├─→ Risk Reserves
                           ├─→ Market Expansion
                           └─→ Technical Development

Protocol LP Reserve (50,000,000 POI)
      ↓
      ├─→ 2,000,000 POI → Initial LP (4%) ✅ Used
      │
      └─→ 48,000,000 POI → Reserve Pool (96%)
                           ├─→ Phase 1: Market Expansion
                           ├─→ Phase 2: User Growth
                           ├─→ Phase 3: Price Stability
                           └─→ Long-term Reserve

Secondary Market Trading (POI/USDC Pool)
      ↓
      ├─→ Trading Volume
      ├─→ Price Discovery
      └─→ Liquidity Depth

Protocol Revenue Streams
      ↓
      ├─→ Influence Mining Fees
      ├─→ Escrow Transaction Fees
      ├─→ RWA Marketplace Fees
      └─→ Other Revenue Sources
            ↓
            └─→ Partial Recycling to LP (POL)
                  └─→ Continuous Liquidity Support
```

### Flow Description | 流程说明

**Chinese | 中文**:

1. **TGE 阶段**：募集 3M USDC，发行 30M POI
2. **初始 LP 建立**：200K USDC + 2M POI，TVL $400K
3. **Protocol LP 储备**：48M POI 用于后续补充
4. **二级市场交易**：在 POI/USDC 池中进行
5. **协议收入回流**：部分收入用于持续支持流动性

**English | 英文**:

1. **TGE Phase**: Raise 3M USDC, issue 30M POI
2. **Initial LP Establishment**: 200K USDC + 2M POI, TVL $400K
3. **Protocol LP Reserve**: 48M POI for future supplementation
4. **Secondary Market Trading**: Conducted in POI/USDC pool
5. **Protocol Revenue Recycling**: Partial revenue for continuous liquidity support

---

## 7. Summary | 总结

### Chinese Version | 中文版

**结构稳健**

- TGE 价格与初始 LP 价格完全对齐，避免价格倒挂
- 初始 TVL $400K 为早期市场提供充足流动性
- Protocol LP 储备机制确保长期价格稳定

**不挤兑、不卡价格、不被做空**

- 充足的流动性储备（48M POI）应对市场波动
- 分阶段释放机制避免一次性冲击
- 协议收入回流持续支持流动性

**玩家体验自然、投资人叙事清晰**

- 公平的入场价格（$0.10 / POI）
- 可预测的价格区间（$0.10–0.12）
- 透明的流动性管理机制

**可随着项目增长自动扩容**

- Protocol LP 储备根据市场情况灵活调整
- 协议收入自动回流支持流动性
- 长期可持续的流动性管理

### English Version | 英文版

**Robust Structure**

- TGE price fully aligned with initial LP price, preventing price dislocation
- Initial TVL of $400K provides sufficient liquidity for early market
- Protocol LP reserve mechanism ensures long-term price stability

**No Bank Runs, No Price Manipulation, No Short Attacks**

- Sufficient liquidity reserves (48M POI) to handle market volatility
- Phased release mechanism avoids one-time impact
- Protocol revenue recycling continuously supports liquidity

**Natural Player Experience, Clear Investor Narrative**

- Fair entry price ($0.10 / POI)
- Predictable price range ($0.10–0.12)
- Transparent liquidity management mechanism

**Automatic Scaling with Project Growth**

- Protocol LP reserve flexibly adjusted based on market conditions
- Protocol revenue automatically recycles to support liquidity
- Long-term sustainable liquidity management

---

## 8. Final Parameters Confirmation | 最终参数确认

### TGE Parameters | TGE 参数

| Parameter          | Value          | Notes              |
| ------------------ | -------------- | ------------------ |
| Fundraising Target | 3,000,000 USDC | Final              |
| TGE Price          | 0.10 USD / POI | Final              |
| Issuance           | 30,000,000 POI | 3% of total supply |

### Initial LP Parameters | 初始 LP 参数

| Parameter       | Value         | Notes |
| --------------- | ------------- | ----- |
| Initial LP POI  | 2,000,000 POI | Final |
| Initial LP USDC | $200,000      | Final |
| Initial TVL     | $400,000      | Final |
| Initial Price   | $0.10 / POI   | Final |

### Protocol LP Reserve | 协议 LP 储备

| Parameter         | Value          | Notes     |
| ----------------- | -------------- | --------- |
| Total Protocol LP | 50,000,000 POI | Unchanged |
| Initial Usage     | 2,000,000 POI  | 4%        |
| Reserve           | 48,000,000 POI | 96%       |

---

## 9. Next Steps | 下一步

1. **Deploy Initial LP**: Create POI/USDC liquidity pool with 2M POI + $200K USDC
   **部署初始 LP**：创建 POI/USDC 流动性池，包含 2M POI + $200K USDC

2. **Configure Protocol LP Reserve**: Set up 48M POI reserve management system
   **配置协议 LP 储备**：设置 48M POI 储备管理系统

3. **Implement Revenue Recycling**: Automate protocol revenue flow to LP
   **实现收入回流**：自动化协议收入流向 LP

4. **Monitor Price Stability**: Track price movements and adjust LP as needed
   **监控价格稳定**：跟踪价格变动，根据需要调整 LP

---

## 10. Testnet Micro LP Configuration | 测试网 Micro LP 配置

### Chinese Version | 中文版

**测试网使用超小规模配置**：

为了在 Base Sepolia 测试网上进行测试，我们使用主网设计的 1:10,000 缩小版：

| 参数         | 主网          | 测试网      | 比例     |
| ------------ | ------------- | ----------- | -------- |
| 初始 LP POI  | 2,000,000 POI | 200 POI     | 1:10,000 |
| 初始 LP USDC | $200,000      | 20 USDC     | 1:10,000 |
| 初始 TVL     | $400,000      | $40         | 1:10,000 |
| 目标价格     | $0.10 / POI   | $0.10 / POI | 相同     |

**测试交易范围**：

- 最小：0.01 USDC
- 最大：1 USDC
- 适合测试小规模交易场景

**创建脚本**：

使用 `scripts/create-micro-lp.ts` 创建测试网 LP 池：

```bash
npx tsx scripts/create-micro-lp.ts --dry-run  # 先测试
npx tsx scripts/create-micro-lp.ts            # 实际创建
```

**详细测试计划**：

请参考 `docs/TOKENOMICS/LIQUIDITY_TEST_PLAN.md` 获取完整的测试场景和验证步骤。

### English Version | 英文版

**Testnet Uses Micro-Scale Configuration**:

For testing on Base Sepolia testnet, we use a 1:10,000 scale of the mainnet design:

| Parameter       | Mainnet       | Testnet     | Ratio    |
| --------------- | ------------- | ----------- | -------- |
| Initial LP POI  | 2,000,000 POI | 200 POI     | 1:10,000 |
| Initial LP USDC | $200,000      | 20 USDC     | 1:10,000 |
| Initial TVL     | $400,000      | $40         | 1:10,000 |
| Target Price    | $0.10 / POI   | $0.10 / POI | Same     |

**Test Transaction Range**:

- Minimum: 0.01 USDC
- Maximum: 1 USDC
- Suitable for testing small-scale transaction scenarios

**Creation Script**:

Use `scripts/create-micro-lp.ts` to create testnet LP pool:

```bash
npx tsx scripts/create-micro-lp.ts --dry-run  # Test first
npx tsx scripts/create-micro-lp.ts            # Actually create
```

**Detailed Test Plan**:

Please refer to `docs/TOKENOMICS/LIQUIDITY_TEST_PLAN.md` for complete test scenarios and verification steps.

---

**Document Version**: 1.1  
**Last Updated**: 2025-12-11  
**Status**: Final Parameters Confirmed ✅ | Testnet Configuration Added ✅
