# POI Games 总览（Games / In Dev）

POI Games 是 ACEE Ventures 的游戏品类产品线，目标是基于 POI 的用户体系与积分/身份能力，提供移动端优先、实时互动的游戏体验。

## 子产品列表

| 子产品                 | 状态        | 说明                                             | 文档                       |
| ---------------------- | ----------- | ------------------------------------------------ | -------------------------- |
| Poker（Texas Hold'em） | In Dev      | 移动端优先，WebSocket 实时对战                   | `product/games/poker.md`   |
| Mahjong                | Coming Soon | 尚未开发（本轮不输出独立文档）                   | `[TBD]`                    |
| Prediction Market      | Live        | 链上预测市场（Base），从 POI Platform 迁入 Games | `product/games/predict.md` |

## 技术架构概述（Poker 等实时游戏）

### 端到端入口（推荐流程）

1. 用户在 POI Platform 登录（Web2/Web3 均可，具体以部署为准）。
2. 进入 Games 页面（通常为 `/games`）。
3. 客户端调用 `POST /api/game/enter` 获取 `gameToken` 与 `joinUrl`。
4. 客户端使用 WebSocket 连接 `joinUrl` 并携带 token（实现细节见代码与文档）。
5. 客户端通过实时消息发送动作（Fold/Call/Raise 等），并接收服务器推送的状态更新。

### 协议与可靠性（摘要）

- WebSocket 客户端具备自动重连（指数退避）、消息幂等（clientMsgId）、序列号追踪（seq）与断线恢复（resync/snapshot）的设计。
- 结算与裁决逻辑由后端游戏服务器负责；本轮状态为"前端骨架完成，后端待接入/完善"（以工程进度为准）。

## 与 POI Platform 的关系

- 共享：用户系统、基础身份/登录能力、以及部分页面/导航入口。
- 独立：Games 的实时对战与房间/桌子状态由游戏服务承载。

## 来源

- `ProofOfInfluence/apps/web/src/routes.ts`（/games 路由与页面骨架入口）
- `ProofOfInfluence/docs/GAME_API_SETUP.md`（/api/game/enter 与 JWT 配置说明）
- `ProofOfInfluence/apps/api/routes/games.ts`（enter/health 端点实现锚点）
- `ProofOfInfluence/apps/web/src/lib/games/README.md`（RealtimeClient：重连/幂等/seq/resync）
