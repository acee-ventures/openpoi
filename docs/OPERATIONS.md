# OpenPOI Operations Manual

## Overview

OpenPOI 是 ACEE Ventures 基于 OpenClaw 构建的 AI Agent 网关，提供多渠道智能客服服务 (Web Chat / Telegram / WhatsApp / Voice)。

---

## 1. Deployment

### Render (Production)

OpenPOI 在 Render 上以 Docker Web Service 运行。

**自动部署:** Push 到 `main` 分支后 Render 自动构建部署。

**手动部署:** Render Dashboard → openpoi → Manual Deploy → Deploy latest commit

### Docker (Local Dev)

```bash
cp .env.example .env
# Edit .env with your actual values
docker compose -f docker-compose.dev.yml up --build
```

访问地址: `http://localhost:10000`

---

## 2. Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|--------|
| `GEMINI_API_KEY` | Google Gemini API Key | `AIza...` |
| `DATABASE_URL` | Neon PostgreSQL 连接串 | `postgresql://user:pass@host/db?sslmode=require` |
| `SETUP_PASSWORD` | 首次登录设置密码 | (strong random value) |
| `OPENCLAW_GATEWAY_PASSWORD` | Gateway 管理密码 | (strong random value) |
| `OPENCLAW_GATEWAY_TOKEN` | API Token (CLI/RPC 访问) | (strong random value) |

### Payment (Base Chain)

| Variable | Description |
|----------|-------------|
| `BASE_RPC_URL` | Base Mainnet RPC endpoint |
| `POI_ADDRESS_EVM` | POI Token 合约地址 |
| `VITE_USDC_ADDRESS_EVM` | USDC 合约地址 (Base) |
| `TREASURY_ADDRESS_EVM` | 国库收款地址 |

### Optional

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI fallback provider |
| `XAI_API_KEY` | xAI/Grok provider |
| `TWILIO_ACCOUNT_SID` | WhatsApp channel (Twilio) |
| `TWILIO_AUTH_TOKEN` | WhatsApp channel (Twilio) |
| `PAYMENT_HUB_ENABLED` | 启用支付功能 (`true`) |

---

## 3. Gateway Management

### First-Time Setup

1. 访问 `https://<your-domain>/` → 跳转到 Setup 页面
2. 输入 `SETUP_PASSWORD` 环境变量中设置的密码
3. 完成初始化（创建 gateway 密码、配置 agent）

### Settings UI

访问 Settings (`/config`) 可管理:

- **Agents** — Agent 身份 (name, emoji)、workspace、model
- **Authentication** — Gateway 密码、Token
- **Gateway** — 绑定模式、端口
- **Messages** — 消息前缀、响应格式
- **Commands** — 可用命令配置
- **Skills** — Agent 技能管理

### Agent Identity

Agent 身份通过 Settings > Agents 配置，支持:

- **Config 方式** — 在 `openclaw.json` 的 `agents.list[].identity` 中设置 `name`, `emoji`
- **文件方式** — 在 workspace 目录放置 `IDENTITY.md` 文件 (更丰富的 persona)
- **UI 方式** — 通过 Settings UI 直接修改 config

优先级: `ui.assistant` > `agents.list[].identity` > workspace `IDENTITY.md`

---

## 4. Agent Persona Files

Workspace 目录 (`/data/workspace/`) 包含 agent 深层人格文件:

| File | Purpose |
|------|---------|
| `IDENTITY.md` | Agent 档案 — 名称、角色、核心能力、原则 |
| `SOUL.md` | 行为准则 — 多语言策略、专业边界、风格指南 |
| `USER.md` | 目标用户画像 — 用户类型、语言偏好、常见问题领域 |

这些文件作为系统提示词的一部分，塑造 agent 的回复风格和知识边界。

---

## 5. User Guide

### Web Chat

1. 访问 OpenPOI 部署地址
2. 在聊天框输入问题，按 Enter 发送
3. Agent 会根据你的语言自动切换中英文回复

### Supported Topics

- **POI Token** — 代币经济学、TGE、质押、智能合约
- **RWA** — 真实世界资产代币化、SSF 房产项目
- **OTC** — USDT ↔ Cash 场外交易、KYC/AML 流程
- **合规** — 隐私政策、服务条款、SEC 文件
- **公司** — ACEE Ventures 产品矩阵、联系方式

### Contact Channels

- **AI Voice**: +1 (844) 524-7659 (24/7)
- **Telegram**: @aceexventures
- **Email**: contact@aceexventures.com / otc@aceexventures.com
- **Website**: https://aceexventures.com

---

## 6. Architecture

```
[User] → [Web UI / Telegram / WhatsApp / Voice]
            ↓
     [OpenClaw Gateway] ← openclaw.json (config)
            ↓                    ↓
     [LLM Provider]    [Workspace Files]
     (Gemini/OpenAI)   (IDENTITY / SOUL / USER)
            ↓
     [Database (Neon)]
     [Payment Hub (Base Chain)]
```

### Key Config Files

| Path | Description |
|------|-----------|
| `deploy/openpoi.json` | LLM provider + Agent identity config |
| `deploy/workspace/` | Agent persona files (IDENTITY, SOUL, USER) |
| `.env` | Secrets and environment-specific values |
| `Dockerfile` | Docker image build recipe |
