# OpenPOI API Reference

OpenPOI 是基于 [OpenClaw](https://docs.openclaw.ai) 的 AI Agent Gateway 定制分支, 新增了多租户认证、积分计费、加密支付等能力。

本文档 **仅覆盖 OpenPOI 自有扩展**。OpenClaw 原生 Gateway API (WebSocket 协议 90+ methods / HTTP 端点 / 配置管理) 请参阅上游文档。

> **Base URL**: `https://<gateway-host>:<port>` (default port: `18789`)
>
> **Feature Flag**: Payment Hub endpoints require `PAYMENT_HUB_ENABLED=true`

---

## Quick Start / 快速接入

### 场景 A: 2B API 客户 (HTTP)

适用于: 需要通过 REST API 接入 ACEE AI 能力的企业客户。

```bash
# Step 1: 创建 API Key (需管理员或已有 key)
curl -X POST https://gateway.example.com/api/user/api-keys \
  -H 'Authorization: Bearer <existing-token>' \
  -H 'Content-Type: application/json' \
  -d '{"name": "Production Key"}'
# → 返回 poi_sk_... (仅显示一次, 妥善保存)

# Step 2: 调用 AI (OpenAI 兼容格式)
curl https://gateway.example.com/v1/chat/completions \
  -H 'Authorization: Bearer poi_sk_<your-key>' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
# → 自动扣费, 返回 OpenAI 格式 response

# Step 3: 查余额 (WebSocket 或 Internal API)
curl -X POST https://gateway.example.com/api/internal/check-balance \
  -H 'X-Internal-Token: <internal-token>' \
  -H 'Content-Type: application/json' \
  -d '{"userId": "google:12345"}'
```

### 场景 B: Webchat / Mobile 客户端 (WebSocket)

适用于: Immortal Chat 等前端直连 Gateway 的场景。

```javascript
// Step 1: 建立 WebSocket 连接
const ws = new WebSocket("wss://gateway.example.com");

// Step 2: 握手 (connect)
ws.send(
  JSON.stringify({
    type: "req",
    id: "1",
    method: "connect",
    params: {
      minProtocol: 3,
      maxProtocol: 3,
      client: { id: "webchat", version: "1.0", platform: "web", mode: "operator" },
      role: "operator",
      scopes: ["operator.read", "operator.write"],
      auth: { token: "<gateway-token>" },
    },
  }),
);
// ← 收到 hello-ok

// Step 3: 发送聊天消息
ws.send(
  JSON.stringify({
    type: "req",
    id: "2",
    method: "chat.send",
    params: {
      sessionKey: "main",
      message: "What is ACEE?",
      idempotencyKey: crypto.randomUUID(),
    },
  }),
);
// ← 收到 chat events (delta → final)

// Step 4: 查积分余额
ws.send(
  JSON.stringify({
    type: "req",
    id: "3",
    method: "payment.balance",
    params: {},
  }),
);
// ← { poiCredits: 4500, ... }

// Step 5: 绑定 Google 帐号 (领 10,000 Credits)
ws.send(
  JSON.stringify({
    type: "req",
    id: "4",
    method: "payment.bindGoogle",
    params: { credential: "<google-id-token-jwt>" },
  }),
);
// ← { email: "user@example.com", bonusGranted: true, balance: { poiCredits: 10000 } }
```

### 场景 C: 内部微服务 (Service-to-Service)

适用于: ProofOfInfluence 后端、OTC 系统等内部服务调用。

```bash
# 验证外部用户的 API Key
curl -X POST https://gateway.example.com/api/internal/validate-key \
  -H 'X-Internal-Token: <POI_INTERNAL_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"key": "poi_sk_..."}'

# 扣减积分 (例如: OTC 手续费)
curl -X POST https://gateway.example.com/api/internal/deduct-credits \
  -H 'X-Internal-Token: <POI_INTERNAL_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"userId":"google:12345","amount":50,"scene":"otc_fee","reference":"otc_tx_abc"}'
```

### 充值流程

```
用户 → 链上转 USDC/USDT 到收款地址
   ↓
前端 → payment.verify({ chain: "base", txHash: "0x..." })
   ↓
后端 → 验证链上交易 → 入账积分 → 返回新余额
```

---

## Table of Contents / 目录

1. [Architecture Overview / 架构概览](#1-architecture-overview--架构概览)
2. [OpenClaw Native API Reference / OpenClaw 原生 API](#2-openclaw-native-api-reference--openclaw-原生-api)
3. [POI Authentication / POI 认证扩展](#3-poi-authentication--poi-认证扩展)
4. [API Key Management HTTP API](#4-api-key-management-http-api)
5. [Internal Service HTTP API](#5-internal-service-http-api)
6. [Payment Hub WebSocket API](#6-payment-hub-websocket-api)
7. [Credits & Pricing / 积分与定价](#7-credits--pricing--积分与定价)
8. [Error Codes / 错误码](#8-error-codes--错误码)

---

## 1. Architecture Overview / 架构概览

OpenPOI 在 OpenClaw Gateway 之上增加了以下三层:

```
┌─────────────────────────────────────────────────────────────┐
│                      OpenPOI Gateway                         │
├──────────────┬──────────────────────┬───────────────────────┤
│  POI Auth    │   Payment Hub        │  OpenClaw Native      │
│  Middleware  │   (Credits/Billing)  │  Gateway              │
├──────────────┼──────────────────────┼───────────────────────┤
│ poi_sk_ keys │ HTTP: /api/user/*    │ WS: 90+ methods       │
│ dual-mode    │ HTTP: /api/internal/*│ HTTP: /v1/chat/*      │
│ auth         │ WS: payment.*       │ HTTP: /v1/responses   │
│              │ crypto verify       │ HTTP: /tools/invoke   │
└──────────────┴──────────────────────┴───────────────────────┘
```

**请求路由优先级:**

```
1. Payment Hub routes        (/api/keys/*, /api/internal/*, /api/user/*)
2. Hooks                     (configured basePath)
3. Tools Invoke              (/tools/invoke)         ← OpenClaw native
4. Slack                     (/slack/*)              ← OpenClaw native
5. Plugin / Channel routes   (/api/channels/*)       ← OpenClaw native
6. OpenResponses             (/v1/responses)         ← OpenClaw native
7. OpenAI Chat               (/v1/chat/completions)  ← OpenClaw native
8. Canvas Host / A2UI        (internal UI)
9. Control UI                (admin dashboard)
10. 404 Not Found
```

---

## 2. OpenClaw Native API Reference / OpenClaw 原生 API

OpenClaw 自带一套完整的 API 体系, 包含 **WebSocket JSON-RPC 协议** 和 **HTTP 端点**。OpenPOI 完整继承了这些能力, 未做修改。

### 2.1 WebSocket Protocol (核心)

OpenClaw 的核心 API 是 JSON-RPC over WebSocket 协议, 提供 90+ 方法和 20+ 事件。

**详细文档**: [docs.openclaw.ai → Gateway Protocol](https://docs.openclaw.ai/gateway/protocol)

| 分类               | 方法示例                                                                                   | 数量 |
| ------------------ | ------------------------------------------------------------------------------------------ | :--: |
| **Chat**           | `chat.send`, `chat.history`, `chat.abort`, `chat.inject`                                   |  4   |
| **Sessions**       | `sessions.list`, `sessions.preview`, `sessions.patch`, `sessions.reset`, `sessions.delete` |  7   |
| **Agents**         | `agents.list`, `agents.create`, `agents.update`, `agents.delete`, `agents.files.*`         |  8   |
| **Config**         | `config.get`, `config.set`, `config.apply`, `config.patch`, `config.schema`                |  5   |
| **Nodes**          | `node.list`, `node.describe`, `node.invoke`, `node.rename`, `node.pair.*`                  |  7   |
| **Cron**           | `cron.list`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`                          |  6   |
| **Models**         | `models.list`                                                                              |  1   |
| **Channels**       | `channels.status`, `channels.logout` + plugin methods                                      |  2+  |
| **Skills**         | `skills.status`, `skills.bins`, `skills.install`, `skills.update`                          |  4   |
| **Exec Approvals** | `exec.approvals.*`                                                                         |  6   |
| **TTS**            | `tts.status`, `tts.providers`, `tts.enable`, `tts.disable`, `tts.convert`                  |  5   |
| **Device**         | `device.pair`, `device.token.*`                                                            |  5   |
| **System**         | `health`, `status`, `send`, `agent`, `system-presence`, `logs.tail`                        | ~20  |

**协议帧格式:**

```json
// Request (Client → Server)
{ "type": "req", "id": "<uuid>", "method": "<method>", "params": { ... } }

// Response (Server → Client)
{ "type": "res", "id": "<uuid>", "ok": true, "payload": { ... } }
// or
{ "type": "res", "id": "<uuid>", "ok": false, "error": { "code": 400, "message": "..." } }

// Event (Server → Client, push)
{ "type": "event", "event": "<event-name>", "payload": { ... }, "seq": 42 }
```

**Server 推送事件 (20+):**

`chat`, `agent`, `presence`, `tick`, `heartbeat`, `shutdown`, `health`, `config.changed`, `exec.approval.requested`, `voice.transcript`, `channel.status`, ...

### 2.2 HTTP Endpoints (OpenClaw 原生)

| Endpoint                    | 说明                             | 上游文档                                                                          |
| --------------------------- | -------------------------------- | --------------------------------------------------------------------------------- |
| `POST /v1/chat/completions` | OpenAI Chat Completions 兼容端点 | [openai-http-api](https://docs.openclaw.ai/gateway/openai-http-api)               |
| `POST /v1/responses`        | OpenResponses API 兼容端点       | [openresponses-http-api](https://docs.openclaw.ai/gateway/openresponses-http-api) |
| `POST /tools/invoke`        | 直接工具调用端点                 | [tools-invoke-http-api](https://docs.openclaw.ai/gateway/tools-invoke-http-api)   |

这些端点在 OpenPOI 中通过 POI Auth 中间件增强, 支持 `poi_sk_` API Key 认证和自动计费 (详见下文)。

### 2.3 本地文档

OpenClaw 上游文档也包含在 OpenPOI 仓库中: `openpoi/docs/` (640+ markdown 文件), 涵盖:

```
docs/gateway/          — Gateway 运维、协议、安全
docs/channels/         — 消息渠道 (WhatsApp, Telegram, Discord, Slack, ...)
docs/tools/            — 工具系统
docs/providers/        — AI 模型提供商配置
docs/concepts/         — 核心概念 (agents, sessions, memory, ...)
docs/automation/       — 自动化 (cron, hooks, webhooks)
docs/zh-CN/            — 中文翻译
```

---

## 3. POI Authentication / POI 认证扩展

OpenPOI 在 OpenClaw 原生 Gateway 认证之上新增了**双模式认证 (dual-mode authentication)**。

### Mode 1: POI API Key (多租户)

用于外部 2B/2C 客户的程序化访问。

```
Authorization: Bearer poi_sk_<64-hex-chars>
```

| 属性           | 说明                                                        |
| -------------- | ----------------------------------------------------------- |
| **Key Format** | `poi_sk_` + 64 hex characters (32 random bytes)             |
| **Storage**    | SHA-256 hash stored in DB; plaintext shown once at creation |
| **Limit**      | Maximum **10 active keys** per user                         |
| **Features**   | Per-key rate limits (RPM/TPM), model allowlist, expiration  |

### Mode 2: Gateway Token (原生)

后向兼容 OpenClaw 原生 Gateway 认证。如果 Bearer token 不使用 `poi_sk_` 前缀, 自动 fallback。

```
Authorization: Bearer <gateway-token>
```

### 认证解析流程

```
Request → has poi_sk_ prefix?
  ├─ YES → POI API Key auth → DB lookup → bind userId → billing hook active
  └─ NO  → Gateway token auth (OpenClaw native behavior, no billing)
```

### Source Code

`openpoi/src/payment-hub/poi-auth.ts`

---

## 4. API Key Management HTTP API

用户自助管理 POI API Key 的 HTTP 端点。所有请求需通过 POI API Key 或 Gateway Token 认证。

### 4.1 POST /api/user/api-keys

创建新的 API Key。

**Request:**

```http
POST /api/user/api-keys HTTP/1.1
Authorization: Bearer poi_sk_...
Content-Type: application/json
```

```json
{ "name": "My Production Key" }
```

| Field  | Type   | Required | Description             |
| ------ | ------ | -------- | ----------------------- |
| `name` | string | Yes      | Human-readable key name |

**Response — `201 Created`:**

```json
{
  "key": "poi_sk_a1b2c3d4e5f6...64hexchars",
  "keyPrefix": "poi_sk_a1b2c",
  "name": "My Production Key",
  "message": "Save this key securely. It will not be shown again."
}
```

> ⚠️ **The full key is returned ONLY ONCE.** Store it securely.

**Errors:**

| Status | Condition                      |
| ------ | ------------------------------ |
| `400`  | Missing `name` field           |
| `400`  | Maximum 10 active keys reached |
| `401`  | Unauthorized                   |

### 4.2 GET /api/user/api-keys

列出当前用户的所有 API Key (不含完整 key, 仅带 prefix)。

**Response — `200 OK`:**

```json
{
  "keys": [
    {
      "id": "uuid",
      "keyPrefix": "poi_sk_a1b2c",
      "name": "My Production Key",
      "status": "active",
      "rateLimitRpm": 60,
      "lastUsedAt": "2026-02-13T00:00:00Z",
      "createdAt": "2026-02-10T00:00:00Z",
      "expiresAt": null
    }
  ]
}
```

### 4.3 DELETE /api/user/api-keys/:id

吊销 (revoke) 指定 API Key。

**Response — `200 OK`:**

```json
{ "ok": true, "message": "Key revoked" }
```

**Errors:**

| Status | Condition                          |
| ------ | ---------------------------------- |
| `401`  | Unauthorized                       |
| `404`  | Key not found or not owned by user |

### Source Code

`openpoi/src/payment-hub/api-keys.ts`

---

## 5. Internal Service HTTP API

服务间调用端点, 用于 OpenPOI 内部微服务通信。需要内部 token 认证。

**认证方式 (任选其一):**

```
Authorization: Bearer <internal-token>
X-Internal-Token: <internal-token>
```

Token 来源: `WORKER_INTERNAL_TOKEN` 或 `POI_INTERNAL_KEY` 环境变量。

### 5.1 POST /api/internal/validate-key

验证 POI API Key 是否有效。

**Request:**

```json
{ "key": "poi_sk_..." }
```

**Response — Valid Key:**

```json
{
  "valid": true,
  "userId": "google:12345",
  "keyId": "uuid",
  "role": "user",
  "rateLimits": { "rpm": 60, "tpm": 100000 },
  "allowedModels": ["claude-sonnet-4.5", "gpt-5-mini"]
}
```

**Response — Invalid Key:**

```json
{ "valid": false, "reason": "invalid-or-revoked" }
```

| Reason               | Description                          |
| -------------------- | ------------------------------------ |
| `not-poi-key`        | Token does not start with `poi_sk_`  |
| `invalid-or-revoked` | Key hash not found or key is revoked |
| `expired`            | Key past expiration date             |

### 5.2 POST /api/internal/check-balance

查询用户积分余额。

**Request:**

```json
{ "userId": "google:12345" }
```

**Response — `200 OK`:**

```json
{
  "poiCredits": 4500,
  "immortalityCredits": 0,
  "totalDeposited": 10000,
  "totalUsed": 5500
}
```

### 5.3 POST /api/internal/deduct-credits

扣减用户积分。

**Request:**

```json
{
  "userId": "google:12345",
  "amount": 150,
  "scene": "ai_chat",
  "model": "claude-sonnet-4.5",
  "tokensIn": 2000,
  "tokensOut": 500,
  "reference": "chatcmpl_abc123"
}
```

| Field       | Type   | Required | Description                             |
| ----------- | ------ | -------- | --------------------------------------- |
| `userId`    | string | Yes      | User identifier                         |
| `amount`    | number | Yes      | Credits to deduct                       |
| `scene`     | string | Yes      | Usage scene (`"ai_chat"`, `"api_call"`) |
| `model`     | string | No       | Model used                              |
| `tokensIn`  | number | No       | Input tokens consumed                   |
| `tokensOut` | number | No       | Output tokens consumed                  |
| `reference` | string | No       | External reference ID                   |

**Response — `200 OK`:**

```json
{ "success": true }
```

### Source Code

`openpoi/src/payment-hub/api-keys.ts` (routes), `openpoi/src/payment-hub/credits-engine.ts` (engine)

---

## 6. Payment Hub WebSocket API

Payment Hub 通过 OpenClaw 的 WebSocket 协议注册了 8 个自定义方法, 供 Webchat / Mobile 客户端直接调用。

**传输方式**: JSON-RPC over WebSocket (与 OpenClaw 原生方法相同协议帧)

**认证前提**: 客户端需先完成 `connect` 握手并获得有效 userId

### 6.1 payment.balance

查询当前用户的积分余额。

**Params:** (无)

**Response payload:**

```json
{
  "poiCredits": 4500,
  "immortalityCredits": 0,
  "totalDeposited": 10000,
  "totalUsed": 5500
}
```

### 6.2 payment.verify

验证链上充值交易并入账积分。

**Params:**

| Field    | Type   | Required | Description                      |
| -------- | ------ | -------- | -------------------------------- |
| `chain`  | string | Yes      | 区块链网络: `"base"` 或 `"tron"` |
| `txHash` | string | Yes      | 链上交易哈希                     |

**Response payload:**

```json
{
  "verified": true,
  "creditsAdded": 1000,
  "balance": { "poiCredits": 5500, ... }
}
```

**支持的链:**

| Chain  | 支持代币      | 验证模块                                       |
| ------ | ------------- | ---------------------------------------------- |
| `base` | USDC, USDT    | `openpoi/src/payment-hub/verification/base.ts` |
| `tron` | USDT (TRC-20) | `openpoi/src/payment-hub/verification/tron.ts` |

### 6.3 payment.claimWalletBonus

领取钱包连接奖励 (5,000 Credits)。幂等操作, 每个钱包仅可领取一次。

**Params:**

| Field           | Type   | Required | Description  |
| --------------- | ------ | -------- | ------------ |
| `walletAddress` | string | Yes      | 用户钱包地址 |

**Response payload:**

```json
{
  "bonusGranted": true,
  "amount": 5000,
  "balance": { "poiCredits": 5000, ... }
}
```

### 6.4 payment.claimEmailBonus

领取邮箱注册奖励 (10,000 Credits)。幂等操作, 每个邮箱仅可领取一次。

**Params:**

| Field   | Type   | Required | Description  |
| ------- | ------ | -------- | ------------ |
| `email` | string | Yes      | 用户邮箱地址 |

**Response payload:**

```json
{
  "bonusGranted": true,
  "amount": 10000,
  "balance": { "poiCredits": 10000, ... }
}
```

### 6.5 payment.bindGoogle

通过 Google ID Token 绑定 Google 帐号并自动领取邮箱奖励。

前端通过 Google Identity Services JS SDK 获取 credential, 后端验证 + 绑定 + 发放奖励。

**Params:**

| Field        | Type   | Required | Description         |
| ------------ | ------ | -------- | ------------------- |
| `credential` | string | Yes      | Google ID Token JWT |

**Response payload:**

```json
{
  "email": "user@example.com",
  "bonusGranted": true,
  "balance": { "poiCredits": 10000, ... }
}
```

### 6.6 payment.bindWallet

绑定钱包地址到帐号并领取钱包奖励。

**Params:**

| Field           | Type   | Required | Description  |
| --------------- | ------ | -------- | ------------ |
| `walletAddress` | string | Yes      | 用户钱包地址 |

**Response payload:**

```json
{
  "bonusGranted": true,
  "balance": { "poiCredits": 5000, ... }
}
```

### 6.7 payment.recoverAccount

通过 Google 登录恢复旧帐号。用户在新设备上使用 Google 登录时, 后端查找旧帐号并迁移积分。

**Params:**

| Field        | Type   | Required | Description         |
| ------------ | ------ | -------- | ------------------- |
| `credential` | string | Yes      | Google ID Token JWT |

**Response payload:**

```json
{
  "recovered": true,
  "creditsTransferred": 4500,
  "balance": { "poiCredits": 4500, ... }
}
```

### 6.8 payment.accountInfo

获取当前帐号的身份绑定信息。

**Params:** (无)

**Response payload:**

```json
{
  "userId": "google:12345",
  "email": "user@example.com",
  "emailVerified": true,
  "walletAddress": "0xabc...",
  "identityCount": 2
}
```

### Source Code

`openpoi/src/gateway/server-methods/payment.ts`

---

## 7. Credits & Pricing / 积分与定价

### 7.1 Exchange Rate / 汇率

| Currency | Rate                  |
| -------- | --------------------- |
| **USD**  | $1 = 100 Credits      |
| **USDC** | 1 USDC = 100 Credits  |
| **USDT** | 1 USDT = 100 Credits  |
| **POI**  | 1 POI = 1,000 Credits |

### 7.2 Model Pricing / 模型定价

All prices include **20% platform markup** over provider cost.

> Formula: `(provider_cost_per_1M_tokens × 100 credits/$1) × 1.20`

| Model               | Provider           | Input (Credits/M tokens) | Output (Credits/M tokens) |
| ------------------- | ------------------ | :----------------------: | :-----------------------: |
| `claude-sonnet-4.5` | Anthropic          |            36            |            180            |
| `claude-haiku-4.5`  | Anthropic          |            12            |            60             |
| `claude-opus-4.6`   | Anthropic          |           180            |            900            |
| `gpt-5`             | OpenAI             |            15            |            120            |
| `gpt-5-mini`        | OpenAI             |            3             |            24             |
| `gpt-4o`            | OpenAI             |            60            |            240            |
| `gpt-4o-mini`       | OpenAI             |            2             |             7             |
| `deepseek-v3`       | DeepSeek           |            3             |            11             |
| `deepseek-r1`       | DeepSeek           |            7             |            28             |
| `qwen-local`        | Qwen (self-hosted) |            1             |             3             |
| `gemini-2.0-flash`  | Google             |            1             |             5             |

> **Unknown models**: Fall back to Claude Sonnet 4.5 pricing tier.

### 7.3 POI Staking Tiers / POI 质押折扣

| Tier     | Required POI | Discount |
| -------- | :----------: | :------: |
| Free     |      0       |    0%    |
| Silver   |    1,000     |    5%    |
| Gold     |    10,000    |   10%    |
| Platinum |   100,000    |   20%    |

### 7.4 Billing Flow / 计费流程

**HTTP 端点 (OpenAI / OpenResponses) 计费:**

```
Request → POI Auth → Pre-check (estimate cost) → Allow/Reject (402)
    ↓ (allowed)
  Process AI request via OpenClaw
    ↓
Response → Post-settle (exact cost based on real token usage)
    ↓
  Deduct credits from user balance
```

**WebSocket chat.send 计费:**

```
WebSocket chat.send → Agent run starts
    ↓
  onUsageReported callback → resolveUserId
    ↓
  Payment Hub settlement (async)
    ↓
  Deduct credits from user balance
```

**关键参数:**

| 参数                      | 值         | 说明                   |
| ------------------------- | ---------- | ---------------------- |
| Pre-check input estimate  | ~2K tokens | 保守估算, 避免误拒     |
| Pre-check output estimate | ~1K tokens | 保守估算               |
| Minimum balance           | 1 Credit   | 余额 ≥ 1 才允许请求    |
| Minimum charge            | 1 Credit   | 任何非零用量至少扣 1   |
| Admin bypass              | Yes        | 管理员用户跳过余额检查 |

### 7.5 Welcome Bonuses / 新用户奖励

| 奖励类型           |  积分  | 触发条件                   | 幂等性 |
| ------------------ | :----: | -------------------------- | :----: |
| Google 绑定        | 10,000 | `payment.bindGoogle`       |  Yes   |
| 邮箱注册           | 10,000 | `payment.claimEmailBonus`  |  Yes   |
| 钱包连接           | 5,000  | `payment.claimWalletBonus` |  Yes   |
| 首次请求 (Welcome) | 1,000  | HTTP 首次带 POI Key 请求   |  Yes   |

### Source Code

`openpoi/src/payment-hub/pricing.ts`, `openpoi/src/payment-hub/credits-gate.ts`, `openpoi/src/payment-hub/credits-bonus.ts`

---

## 8. Error Codes / 错误码

### Authentication Errors / 认证错误

| Status | Code                   | Description                      |
| ------ | ---------------------- | -------------------------------- |
| `401`  | `authentication_error` | Invalid or expired POI API key   |
| `401`  | `invalid_api_key`      | Key not found or revoked         |
| `401`  | `Unauthorized`         | Internal token validation failed |

### Billing Errors / 计费错误

| Status | Code                   | Description                                  |
| ------ | ---------------------- | -------------------------------------------- |
| `402`  | `insufficient_credits` | Balance too low; response includes `balance` |
| `402`  | `billing_error`        | General billing failure                      |

### WebSocket Errors / WS 错误

| Error Code | Name              | Description                               |
| :--------: | ----------------- | ----------------------------------------- |
|   `400`    | `INVALID_REQUEST` | Invalid params or missing required fields |
|   `503`    | `UNAVAILABLE`     | Backend service error                     |

### HTTP Request Errors / HTTP 错误

| Status | Code                    | Description                               |
| ------ | ----------------------- | ----------------------------------------- |
| `400`  | `invalid_request_error` | Missing required fields or malformed body |
| `404`  | `not_found`             | Endpoint or resource not found            |
| `405`  | —                       | HTTP method not allowed                   |
| `413`  | —                       | Request payload too large                 |
| `500`  | `api_error`             | Internal server error                     |

---

## Source Code Reference / 源码引用

### OpenPOI Extensions (本文档覆盖)

| Module              | File                                    | Description                    |
| ------------------- | --------------------------------------- | ------------------------------ |
| POI Auth Middleware | `src/payment-hub/poi-auth.ts`           | 双模式认证中间件               |
| API Key Management  | `src/payment-hub/api-keys.ts`           | API Key CRUD + internal routes |
| Payment WS Methods  | `src/gateway/server-methods/payment.ts` | 8 个 payment.\* WS 方法        |
| Gateway Billing     | `src/payment-hub/gateway-billing.ts`    | HTTP 端点计费集成              |
| Credits Gate        | `src/payment-hub/credits-gate.ts`       | 余额检查 + 结算逻辑            |
| Credits Engine      | `src/payment-hub/credits-engine.ts`     | 积分引擎                       |
| Credits Bonus       | `src/payment-hub/credits-bonus.ts`      | 奖励发放                       |
| Pricing             | `src/payment-hub/pricing.ts`            | 模型定价常量 + 计算            |
| Identity Service    | `src/payment-hub/identity-service.ts`   | Google/Wallet 身份绑定         |
| Base Verification   | `src/payment-hub/verification/base.ts`  | Base 链交易验证                |
| Tron Verification   | `src/payment-hub/verification/tron.ts`  | Tron 链交易验证                |

### OpenClaw Native (上游文档覆盖)

| Module             | File                                 | Upstream Doc                                                                      |
| ------------------ | ------------------------------------ | --------------------------------------------------------------------------------- |
| OpenAI HTTP        | `src/gateway/openai-http.ts`         | [openai-http-api](https://docs.openclaw.ai/gateway/openai-http-api)               |
| OpenResponses HTTP | `src/gateway/openresponses-http.ts`  | [openresponses-http-api](https://docs.openclaw.ai/gateway/openresponses-http-api) |
| Tools Invoke       | `src/gateway/tools-invoke-http.ts`   | [tools-invoke-http-api](https://docs.openclaw.ai/gateway/tools-invoke-http-api)   |
| WS Protocol        | `src/gateway/protocol/`              | [protocol](https://docs.openclaw.ai/gateway/protocol)                             |
| HTTP Router        | `src/gateway/server-http.ts`         | [gateway runbook](https://docs.openclaw.ai/gateway)                               |
| Chat Methods       | `src/gateway/server-methods/chat.ts` | (inline in protocol)                                                              |
| Gateway Server     | `src/gateway/server.impl.ts`         | [gateway runbook](https://docs.openclaw.ai/gateway)                               |
