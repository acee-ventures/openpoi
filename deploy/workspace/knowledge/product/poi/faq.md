# POI Token FAQ

> 常见问题解答 / Frequently Asked Questions

---

## 基础问题

### 什么是 POI Token？

POI (Proof of Influence) 是 ACEE 生态系统的治理代币，部署在 Base 链上。持有者可以参与协议治理、质押解锁功能访问（Stake-to-Access），并获得 ACEE 产品的高级功能。

### POI 总供应量是多少？

总供应量固定为 **10 亿枚 (1,000,000,000 POI)**，采用硬顶设计，不会增发。

### 在哪里可以购买 POI？

- DEX: Uniswap (Base)
- 官方 TGE: 通过早鸟白名单参与

---

## 技术问题

### POI 部署在哪条链上？

Base Mainnet (Chain ID: 8453)

### POI 合约是否可升级？

是的，POI 采用 UUPS 代理模式，但升级权限由 Timelock 控制（48小时延迟），确保安全性。

### 如何查看 POI 合约地址？

请访问官方文档或 GitHub 仓库获取最新合约地址。

---

## 质押问题

### 如何质押 POI？

1. 连接钱包到 ACEE 平台
2. 进入 Staking 页面
3. 选择质押金额和期限
4. 确认交易

### 质押收益率是多少？

收益率根据总质押量动态调整。请查看平台实时显示的 APY。

---

## 治理问题

### 如何参与治理？

持有 POI 即可参与治理投票。目前通过 Snapshot + Timelock 机制执行。

### 投票权如何计算？

1 POI = 1 票。投票权可以委托给其他地址。

---

## 安全问题

### POI 合约经过审计吗？

合约采用 OpenZeppelin 标准库，并经过内部安全审查。

### 如何报告安全漏洞？

请发送邮件至 security@acee.ventures（负责任披露）。

---

## OpenPOI 相关

### OpenPOI 和 POI Token 是什么关系？

OpenPOI 是 ACEE 的 AI + Web3 商业化基础设施平台（2026 Q1 核心开发焦点），POI Token 是其中的结算与治理代币。OpenPOI 使用 poiCredits 体系计费，POI 持有者可通过 Stake-to-Access 解锁更高 Credits 额度和功能权限。

### POI Platform 和 OpenPOI 的区别？

POI Platform 是面向 C 端的主平台入口（Console, Immortality, DeFi 等），OpenPOI 是底层 AI 基础设施。POI Platform 的 AI 能力（Console AI 对话、Immortality 数字生命）由 OpenPOI Gateway 提供。

---

## 免责声明

本 FAQ 仅供参考，不构成投资建议。请在参与前阅读完整的[法律免责声明](https://github.com/acee-ventures/acee-legal/blob/main/poi/disclosures/DISCLAIMER_TGE_v1.md)。
