# POI Platform 概述（Core / Live Beta）

POI Platform 是 ACEE Ventures 的 Core 产品（Live Beta），面向 C 端用户提供"影响力 + 身份 + RWA"的统一入口，以及围绕 POI 的访问门槛、参与流程与应用体验。

## 平台功能摘要

- 公开页面：Landing、TGE、EarlyBird、Referral、Airdrop、Solutions、Token、About、UseCases 等，用于获客与教育。
- 登录后应用：Dashboard、Market、Recharge、Settings、PaymentSuccess、PublicProfile 等，用于执行与账户管理。
- 子功能：Immortality（AI 数字生命/数字遗产）作为 POI Platform 的子功能，不单独作为产品线建独立文档页；详细在 `product/poi/platform/features.md`。

## 技术亮点（面向开发者）

- 双主题系统：Cyberpunk / Playful（UI/品牌层）。
- 多钱包支持：MetaMask、Coinbase、Phantom、Binance、OKX、WalletConnect（接入层）。
- Web2 + Web3 双认证：Google OAuth + 钱包（身份层）。
- 支付集成：Stripe（法币入口，具体能力以部署配置为准）。
- POI Token 合约：采用可升级合约模式（UUPS），升级受 `UPGRADER_ROLE` 控制；升级策略以"安全修复"为主（实现细节见合约源码与审计/部署材料）。

## Token Details

- **Network**: Base Mainnet (Chain ID: 8453)
- **Token Standard**: ERC-20 (ERC20Votes enabled)
- **Contract**: Upgradeable (UUPS pattern)
- **Decimals**: 18
- **Total Supply**: 1,000,000,000 (1 billion)

## Tokenomics

| Allocation | Percentage | Vesting                |
| ---------- | ---------- | ---------------------- |
| Treasury   | 40%        | Controlled by Timelock |
| Community  | 30%        | TGE + Staking Rewards  |
| Team       | 20%        | 4-year vesting         |
| Advisors   | 10%        | 2-year vesting         |

## Smart Contracts

See [contracts documentation](./contracts/) for details on:

- POI Token
- Staking Rewards
- Vesting Vault
- TGE Sale

## 与其他产品线的关系

- 与 POI Games：共享 POI 用户体系与基础身份能力；Games 独立作为品类文档见 `product/games/`。
- 与 OTC Exchange：OTC 为 Finance 类独立服务；平台层面可作为用户入口与身份承载（对接范围 `[TBD]`）。
- 与 OpenPOI：OpenPOI 为 AI/Infra 层能力；POI Platform 可作为其上层产品使用场景之一（对接范围 `[TBD]`）。
- 与 RWA（SSF）：RWA 文档锁定在 `product/rwa/`；POI Platform 的相关页面与叙事必须遵守 No Profit Distribution。

## 当前状态

- 状态：Live Beta
- 可公开指标：`[TBD]`（不在文档中推测用户数/TVL/收入等）

## Related Links

- [Token Offering Memorandum](https://github.com/acee-ventures/acee-legal/blob/main/poi/disclosures/TOKEN_OFFERING_MEMORANDUM_PUBLIC.md)
- [TGE Disclaimer](https://github.com/acee-ventures/acee-legal/blob/main/poi/disclosures/DISCLAIMER_TGE_v1.md)

## 来源

- `ProofOfInfluence/apps/web/src/routes.ts`（POI Platform 路由与模块入口）
- `ProofOfInfluence/apps/web/src/pages/Immortality.tsx`（Immortality 页面存在性）
- `acee-contracts/contracts/POITokenUpgradeable.sol`（POI Token：UUPS/UPGRADER_ROLE 等实现锚点）
- `acee-docs/product/poi/platform/features.md`（本仓库平台功能总览入口）
