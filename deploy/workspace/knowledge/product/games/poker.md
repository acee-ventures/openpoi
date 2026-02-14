# Poker（Texas Hold'em）详情（In Dev）

Poker 是 POI Games 的核心子产品之一，定位为移动端优先的实时对战德州扑克。当前状态为 In Development：前端页面骨架与实时客户端已具备，后端游戏服务器对接/规则引擎仍在迭代中。

## 页面流程（用户路径）

- GamesPage → TournamentsPage → LobbyPage → TablePage
- 路由参考：`/games`、`/games/tournaments`、`/games/lobby/:id`、`/games/table/:tableId`（以路由常量为准）

## 核心 UI 组件（摘要）

- PokerTable：牌桌主视图
- PlayerSeat：玩家座位/头像/筹码/状态
- ActionBar：操作按钮（Fold / Call / Raise）

## 进入游戏（API）

### `POST /api/game/enter`

用途：生成进入牌桌的短期 `gameToken`，并返回 WebSocket `joinUrl`。

请求体（示例）：

```json
{
  "gameType": "poker",
  "buyIn": 100,
  "tournamentId": "tournament-1",
  "tableId": "550e8400-e29b-41d4-a716-446655440000"
}
```

响应体（示例）：

```json
{
  "gameToken": "eyJhbGciOi...",
  "tableId": "550e8400-e29b-41d4-a716-446655440000",
  "joinUrl": "ws://localhost:8787/join?tableId=...",
  "expiresAt": "2026-01-01T00:00:00.000Z"
}
```

说明：

- `gameToken` 为 JWT；默认有效期为短时（具体以实现为准）。
- JWT 算法：开发环境常用 HS256；生产建议 RS256（密钥管理与签名策略以工程配置为准）。

### `GET /api/game/health`

用途：游戏 API 健康检查。

## 实时连接（WebSocket）

- 连接目标：使用 `joinUrl` 建立 WebSocket 连接。
- 客户端能力：自动重连（指数退避）、clientMsgId 幂等、seq 序列追踪、断线恢复（snapshot/resync）。

## 开发/部署配置（摘要）

- 后端环境变量：`GAME_WS_URL`、JWT 相关配置（如 dev key / private key / algorithm / issuer）。
- 前端环境变量：`VITE_GAME_WS_URL`、`VITE_API_BASE`（以工程配置为准）。

## 风控与对抗（待完善项）

- 反作弊策略、重放防护、异常行为检测：`[TBD]`
- 结算与仲裁：由后端游戏服务器承载（当前对接范围 `[TBD]`）

## 来源

- `ProofOfInfluence/apps/web/src/routes.ts`（Games 路由与页面骨架）
- `ProofOfInfluence/apps/web/src/lib/games/README.md`（RealtimeClient 设计与能力）
- `ProofOfInfluence/docs/GAME_API_SETUP.md`（/api/game/enter 接入说明）
- `ProofOfInfluence/apps/api/routes/games.ts`（enter/health 端点实现锚点）
- `ProofOfInfluence/apps/web/src/components/games/PokerTable.tsx`（PokerTable 组件存在性）
