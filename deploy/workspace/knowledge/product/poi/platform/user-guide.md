# POI Platform 用户指南（2C）

本指南面向 POI Platform 的 C 端用户，覆盖注册登录、TGE、质押、推荐、空投、市场、Immortality、以及进入 POI Games 的入口。

## 注册与登录

### Web2（邮箱 / 社交登录）

1. 打开 `/login`。
2. 选择邮箱/密码登录，或使用 Google/Apple 登录（是否启用以部署为准）。
3. 登录后进入 `/app` 完成基础资料设置（如需要）。

### Web3（连接钱包）

1. 在 `/login` 选择钱包连接。
2. 选择钱包：MetaMask / WalletConnect / Coinbase / Phantom / Binance / OKX（以实际 UI 为准）。
3. 核对域名与请求内容后再签名或授权。

安全提示：任何情况下不要分享助记词/私钥。

## 参与 TGE（如开放）

1. 进入 `/tge`，阅读参与步骤与风险提示。
2. 准备支付方式（Stripe/钱包等，以实际配置为准）。
3. 按照页面步骤完成操作。
4. 完成后在 `/payment-success` 或 `/app` 查看状态。

注意：如活动额度、时间、规则未在页面明确展示，一律视为 `[TBD]`，不要根据非官方渠道信息操作。

## 质押 POI（Stake-to-Access）

1. 连接钱包并确保 POI 余额充足（数量门槛以页面/规则为准）。
2. 从 Token/应用入口进入质押流程（入口位置以 UI 为准）。
3. 阅读锁定/解锁规则（如有）。
4. 在钱包中确认交易，并回到平台检查权限等级变化。

## 使用推荐系统（Referral）

1. 打开 `/referral`。
2. 复制你的推荐链接/邀请码并分享。
3. 在页面查看邀请进度、奖励档位与排行榜（如启用）。

## 参与空投任务（Airdrop）

1. 打开 `/airdrop`。
2. 在任务中心完成任务（任务数量/规则以页面为准）。
3. 查看 XP 与徽章墙，确认进度是否同步。

## 使用 Market（市场）

1. 打开 `/app/market`。
2. 使用筛选器查看流动性池与详情。
3. 在理解风险的前提下执行相关操作（例如流动性相关操作等，具体能力以页面为准）。

## 使用 Immortality（AI 数字生命）

1. 从平台入口进入 Immortality（通常为 `/app/immortality`，以实际导航为准）。
2. 若支持数字化身创建：按页面引导创建/配置（细节 `[TBD]`）。
3. 在 Immortality Chat 中进行对话与互动。
4. 如涉及积分消耗/余额展示：以页面显示的 Immortality Credits 为准（规则 `[TBD]`）。

## 进入 POI Games

- 入口通常为 `/games`（移动端优先）。
- Poker 体验：见 `product/games/poker.md`。
- Prediction Market：见 `product/games/predict.md`。

## 通用安全清单

- 只使用官方页面与官方渠道发布的信息。
- 钱包签名/授权前必须核对域名、请求内容与金额。
- 遇到未显示清晰规则的功能，以 `[TBD]` 对待并暂停操作。

## 来源

- `ProofOfInfluence/apps/web/src/routes.ts`（登录/应用/Immortality/Games 路由入口）
- `acee-docs/product/games/*`（Games 文档入口）
