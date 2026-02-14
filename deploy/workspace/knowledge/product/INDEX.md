# 产品矩阵总览

本文件为对外唯一正确的产品分类版本。若 Deck/Roadmap 中存在不同命名，不覆盖本分类，只做映射（见"命名映射表"）。

## 当前开发焦点

**OpenPOI** 是 2026 Q1 的核心开发重心与资源集中方向。OpenPOI 基于 OpenClaw 构建，承载 AI Agent 分发、统一认证与计费（Credits）、多渠道触达（Web / Telegram / WhatsApp / API）等基础设施能力，是 ACEE 全产品线的底层 AI 与商业化后台。

其他产品线处于运营维护或阶段性迭代状态，非主力开发方向。

---

## 产品矩阵（按优先级排列）

### 🔥 OpenPOI — AI/Infra（当前焦点）

| 产品    | 分类     | 状态           | 面向  | 一句话说明                                                        |
| ------- | -------- | -------------- | ----- | ----------------------------------------------------------------- |
| OpenPOI | AI/Infra | **Active Dev** | 2B/2C | 基于 OpenClaw 的 AI Agent 商业化平台：Gateway + 计费 + 多渠道分发 |

核心能力：

- **AI Gateway**：OpenClaw fork，支持 LLM Agent 创建、RAG、技能扩展
- **Payment Hub**：poi*sk* API Key + poiCredits 统一计费，支持 USDC/USDT/SOL/POI 充值
- **多渠道分发**：Web Chat、Telegram Bot、WhatsApp（Baileys）、REST API
- **ACEE Agent**：官方 AI 代表，双语（中英），覆盖产品咨询/OTC/RWA 等领域

入口：

- 产品概述：`product/openpoi/overview.md`
- API 参考：`api/openpoi.md`
- 源码：[openpoi](https://github.com/acee-ventures/openpoi)

---

### POI Platform — Core

| 产品         | 分类           | 状态      | 面向 | 一句话说明                                   |
| ------------ | -------------- | --------- | ---- | -------------------------------------------- |
| POI Platform | Core           | Live Beta | 2C   | 社交金融平台：影响力 + 身份 + RWA 的统一入口 |
| Immortality  | Core（子功能） | In Dev    | 2C   | AI 数字生命 / 数字遗产，POI Platform 子功能  |

入口：

- `product/poi/overview.md`
- `product/poi/platform/features.md`

---

### POI Games — Games

| 产品                   | 分类  | 状态        | 面向 | 一句话说明                   |
| ---------------------- | ----- | ----------- | ---- | ---------------------------- |
| Poker（Texas Hold'em） | Games | In Dev      | 2C   | 移动端优先的实时对战德州扑克 |
| Prediction Market      | Games | Live        | 2C   | 链上预测市场（Base）         |
| Mahjong                | Games | Coming Soon | 2C   | 麻将（尚未开发）             |

入口：

- `product/games/overview.md`

---

### OTC Exchange — Finance

| 产品         | 分类    | 状态 | 面向  | 一句话说明                          |
| ------------ | ------- | ---- | ----- | ----------------------------------- |
| OTC Exchange | Finance | Live | 2B/2C | Cash ↔ USDT 场外交易（LA 华人商圈） |

入口：

- `product/otc/overview.md`

---

### RWA（SSF） — RWA

| 产品       | 分类 | 状态   | 面向 | 一句话说明                       |
| ---------- | ---- | ------ | ---- | -------------------------------- |
| RWA（SSF） | RWA  | Active | 2B   | 房产代币化项目（文档已审计锁定） |

入口：

- `product/rwa/`（锁定，勿修改）

---

## 产品关系

```
OpenPOI (AI/Infra 底座)
├── ACEE Agent → 多渠道分发 (Telegram / WhatsApp / Web / API)
├── Payment Hub → poiCredits 统一计费
└── AI Gateway → RAG + Skills + Agent Worker

POI Platform (C 端入口)
├── Immortality (子功能)
├── TGE / Staking / Referral / Airdrop
├── Market (流动性)
└── → 调用 OpenPOI 的 Agent 与计费能力

POI Games (独立品类)
├── Poker / Mahjong / Prediction Market
└── → 共享 POI 用户体系

OTC Exchange (独立运营)
└── → Deck 中可能以 Merchant Payment 命名

RWA-SSF (资产端, 锁定)
└── → 通过 POI Platform 接入，遵守 No Profit Distribution
```

## 命名映射表（Deck ↔ 文档）

| Deck / Roadmap 名称 | 对应文档产品        | 说明                                      |
| ------------------- | ------------------- | ----------------------------------------- |
| Skynet              | OpenPOI（子能力）   | AI 获客引擎：社交信号监听 + ML 线索评分   |
| ACEE Copilot        | OpenPOI（子能力）   | AI 对话入口：RAG + 多渠道分发             |
| Copilot API         | OpenPOI API         | `api/openpoi.md`（poi*sk* Key + Credits） |
| Skynet SaaS         | OpenPOI（定价模式） | 订阅制（$500–2000/月），形态定型中        |
| API Gateway         | OpenPOI             | = OpenPOI 本身                            |
| Agent Worker        | OpenPOI             | 24/7 AI Agent 服务                        |
| Merchant Payment    | OTC Exchange        | 商家支付通道 = OTC 的商业化叙事           |
| Escrow              | POI Platform / RWA  | 智能合约托管                              |
