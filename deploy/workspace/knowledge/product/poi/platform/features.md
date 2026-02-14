# POI Platform 功能总览（含 Immortality 子功能）

本文件以"页面/路由"为索引描述 POI Platform 的主要用户界面与子功能。
注意：Prediction Market 已迁移至 POI Games 类别，详见 `product/games/predict.md`。

## 页面总览（公开页）

| 页面      | 路由          | 目标               | 核心模块                                                 |
| --------- | ------------- | ------------------ | -------------------------------------------------------- |
| Landing   | `/`           | 平台介绍与转化     | Hero、优势、核心模块、TGE 横幅（如启用）                 |
| TGE       | `/tge`        | 参与指引与风险提示 | 倒计时、进度、步骤、指标、风险提示（指标缺失用 `[TBD]`） |
| EarlyBird | `/early-bird` | 早鸟引导           | 特权说明、注册表单、任务列表                             |
| Referral  | `/referral`   | 裂变增长           | 推荐链接、邀请进度、奖励档位、排行榜                     |
| Airdrop   | `/airdrop`    | 活动与任务         | XP 统计、任务中心（6）、徽章墙（12）                     |
| Solutions | `/solutions`  | 场景与解决方案     | 4 大解决方案、应用场景                                   |
| Token     | `/token`      | Token 用途与路线图 | 分配/用途/解锁/路线图（避免收益叙事）                    |
| About     | `/about`      | 团队与联系         | 团队、使命愿景、联系方式                                 |
| UseCases  | `/use-cases`  | 使用场景           | 3 个使用场景（案例数据用 `[TBD]`）                       |

补充（如启用/存在）：`/privacy`、`/terms`、`/docs/whitepaper`（用于合规与文档入口，内容以实际部署为准）。

## 页面总览（应用页 / 需登录）

| 页面             | 路由               | 目标           | 核心模块                                |
| ---------------- | ------------------ | -------------- | --------------------------------------- |
| Login            | `/login`           | 登录与身份绑定 | 邮箱/密码、Web3 钱包、Google/Apple 登录 |
| Dashboard        | `/app`             | 总览与任务     | 资产统计、图表、今日任务、最近活动      |
| Market           | `/app/market`      | 市场模块       | 流动性池、筛选、Pool 详情               |
| Recharge         | `/app/recharge`    | 充值/购买      | 支付方式（3 种）、金额输入、费用计算    |
| Profile Settings | `/app/settings`    | 配置与安全     | 个人信息、主题、通知、安全              |
| PaymentSuccess   | `/payment-success` | 完成确认       | 交易详情、下载收据                      |
| PublicProfile    | `/:username`       | 展示与社交     | 用户资料、统计、徽章墙、活动            |

## Immortality（子功能 / AI 数字生命）

Immortality 是 POI Platform 的子功能，用于 AI 数字生命/数字遗产方向的体验验证。文档层面不作为独立产品线拆分，仅在此处描述。

- 入口路由：以 `/app/immortality` 为主（并包含若干子路由，如"我的 Agents、新建、对话"等；实际路径以路由常量为准）。
- 核心体验：
  - Immortality Chat：与数字化身/Agent 的对话界面
  - 数字化身创建：创建/管理数字身份（细节 `[TBD]`）
  - 独立积分体系：Immortality Credits（与 poiCredits 并行；结算与展示逻辑 `[TBD]`）

## RWA Escrow Dashboard（担保交易仪表盘）

- 目标：提供受控的担保交易流程面板，用于 RWA 相关交易的过程管理与状态展示。
- 合规约束：遵守 No Profit Distribution；文档中不描述收益/分配；仅描述功能性流程。

## Console（/console）

- 目标：AI Agent 控制台/运营控制入口（产品形态与能力边界 `[TBD]`）。
- 说明：Console 的具体能力属于 POI Platform 上层体验；若涉及 OpenPOI 的 Gateway/计费能力，请以 `api/openpoi.md` 为准。

## Explore（社交信息流）

- 目标：承载社交信息流/内容探索体验（具体入口与信息源 `[TBD]`）。
- 说明：内部项目（如 Oasis Snacks / Happy Jewelry）不纳入公开文档范围。

## 技术特性（摘要）

- 双主题：Cyberpunk / Playful
- 多钱包：MetaMask、Coinbase、Phantom、Binance、OKX、WalletConnect
- Web2 + Web3 双认证：Google OAuth + 钱包
- POI Token：可升级合约模式（UUPS），`UPGRADER_ROLE` 控制升级授权（升级策略以安全修复为主）
- Stripe 支付集成（以部署配置为准）
- 移动端优化：移动端优先交互与适配
- 合约体系：多合约架构（精确清单以 `product/poi/contracts/**` 与部署文档为准）

## 来源

- `ProofOfInfluence/apps/web/src/routes.ts`（公开页/应用页/Immortality/Games/Console 等路由常量）
- `ProofOfInfluence/apps/web/src/pages/Immortality.tsx`（Immortality 页面）
- `ProofOfInfluence/apps/web/src/pages/RwaEscrowDashboard.tsx`（RWA Escrow Dashboard 页面）
- `ProofOfInfluence/apps/api/routes/explore.ts`、`ProofOfInfluence/apps/web/src/components/explore/*`（Explore 相关实现参考）
- `acee-contracts/contracts/POITokenUpgradeable.sol`（UUPS/UPGRADER_ROLE 实现锚点）
