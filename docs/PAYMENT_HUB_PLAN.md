# OpenPOI Payment Hub — 开发→测试→部署 实施计划

> 基于 2026-02-11 完整代码审查, 反映代码真实现状

---

## 现状快照

| 维度                | 状态                | 详情                                                                            |
| ------------------- | ------------------- | ------------------------------------------------------------------------------- |
| **代码量**          | +2,131 行 / 29 文件 | HEAD `e6d849836` 领先 origin 1 commit                                           |
| **后端模块**        | 10 个全部编写完成   | schema, engine, gate, billing, auth, pricing, api-keys, db, verification×2      |
| **前端模块**        | 7 个全部编写完成    | billing view/controller, wallet-connect, wallet-base, wallet-tron, types, icons |
| **Gateway 集成**    | 3 层全部接入        | HTTP hooks, WS methods, Chat gate                                               |
| **数据库迁移**      | ❌ 未执行           | 001 建表 + 002 credits 迁移                                                     |
| **TypeScript 编译** | ❌ 6 个 TS 错误     | `wallet-base.ts` + `wallet-tron.ts` 缺 window 类型声明                          |
| **环境配置**        | ⚠️ 三套地址不一致   | `.env`=Sepolia, `ui/.env`=Mainnet, 代码硬编码=第三套                            |

### 🔴 关键发现: 环境地址混乱

| 来源                            | POI 地址         | USDC 地址        | Treasury 地址    | 网络                    |
| ------------------------------- | ---------------- | ---------------- | ---------------- | ----------------------- |
| `.env` (后端)                   | `0x571d...55`    | `0x036C...7e`    | `0x3a71...4C`    | **Sepolia Testnet**     |
| `ui/.env` (前端)                | `0xD3a3...a8` ✅ | `0x8335...13` ✅ | `0x4ba8...D8` ✅ | **Base Mainnet**        |
| `base.ts` 硬编码 fallback       | `0x4Bb6...3D` ❌ | `0x8335...13` ✅ | env only         | 代码默认                |
| `CONTRACT_ADDRESSES_MAINNET.md` | `0xD3a3...a8` ✅ | `0x8335...13` ✅ | `0x4ba8...D8` ✅ | **Base Mainnet (SSOT)** |

**结论**: 后端 `.env` 还是 Sepolia 测试网配置; `base.ts` 的 POI 地址硬编码与 Mainnet 不符。

---

## Phase 0: 修复阻塞项 (预计 0.5 天)

### 0.1 修复 TypeScript 编译错误

6 个错误全在 `window.ethereum` / `window.tronWeb` 类型声明:

- `ui/src/ui/services/wallet-base.ts` (2 errors)
- `ui/src/ui/services/wallet-tron.ts` (4 errors)

**修复方案**: 在 `ui/src/ui/types/wallet.d.ts` 扩展 Window 接口声明 `ethereum` 和 `tronWeb`

### 0.2 统一环境地址

1. 更新 `.env` 后端地址为 Base Mainnet:
   - `BASE_RPC_URL=https://mainnet.base.org`
   - `POI_ADDRESS_EVM=0xD3a3a3348B28A6C816644A642E36B2Cc2FFe8Fa8`
   - `TREASURY_ADDRESS_EVM=0x4ba854FB0797f8F0a8E37f004d6B5a914A8D68D8`
   - `VITE_USDC_ADDRESS_EVM=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
2. 修复 `verification/base.ts` L12 POI 地址硬编码 fallback → 改为正确 Mainnet 地址
3. 创建 `.env.example` (不含真实密钥)

### 0.3 修复 server-methods-list.ts

在 `BASE_METHODS` 数组添加:

- `"payment.balance"`
- `"payment.verify"`
- `"chat.inject"`

### 0.4 清理调试文件

删除或 .gitignore:

- `scripts/debug-gateway*.log`
- `debug_config.json`

**Phase 0 验证**: `npx tsc --noEmit` 零错误 + `git status` 干净

---

## Phase 1: 数据库 & 本地验证 (预计 1 天)

### 1.1 执行数据库迁移

```bash
# 连接到 Neon DB 执行
psql $PAYMENT_HUB_DATABASE_URL -f src/payment-hub/migrations/001_payment_hub.sql
psql $PAYMENT_HUB_DATABASE_URL -f src/payment-hub/migrations/002_migrate_credits.sql
```

**验证**: `npx tsx scripts/inspect-db.ts` 确认:

- `unified_ledger` 表存在
- `poi_api_keys` 表存在
- `crypto_deposits` 表存在
- `model_pricing` 表有 12 行种子数据

### 1.2 本地 Gateway 启动验证

```bash
pnpm dev
```

确认:

1. Payment Hub DB 连接成功 (无 connection error)
2. Gateway WS 端口正常监听
3. UI (`pnpm run dev --host` in `ui/`) 可访问

### 1.3 API Key 创建测试

```bash
npx tsx scripts/create-test-key.ts
```

验证 key 写入 `poi_api_keys` 表

### 1.4 WebSocket 方法测试

通过 UI WebChat 或 wscat:

- `payment.balance` → 返回 `{ poiCredits: N }`
- `payment.verify` + 无效 txHash → 返回错误信息
- `chat.send` 无余额用户 → 返回 402 PAYMENT_REQUIRED

**Phase 1 验证**: 4 步全部通过

---

## Phase 2: 自动化测试 (预计 1 天)

### 2.1 运行现有测试

```bash
pnpm test -- src/gateway/openai-http-payment.test.ts
```

### 2.2 补充关键单元测试

| 测试文件                 | 覆盖内容                                                    |
| ------------------------ | ----------------------------------------------------------- |
| `credits-engine.test.ts` | deductCredits 原子性, creditBalance 幂等, getBalance 准确性 |
| `pricing.test.ts`        | calculateCreditCost 边界值, 未知模型 fallback, 折扣率计算   |
| `poi-auth.test.ts`       | API Key 认证通过/拒绝, 过期 key, 无效 hash                  |
| `credits-gate.test.ts`   | 余额充足 → 通过, 余额不足 → 402, admin → bypass             |

### 2.3 端到端 curl 测试

```bash
# 1. 用 API Key 查余额
curl -H "Authorization: Bearer acee_xxx" http://localhost:PORT/api/internal/balance

# 2. 用 API Key 调 chat completions
curl -X POST -H "Authorization: Bearer acee_xxx" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-local","messages":[{"role":"user","content":"hello"}]}' \
  http://localhost:PORT/v1/chat/completions

# 3. 再查余额, 确认扣减
```

**Phase 2 验证**: `pnpm test` 全绿 + curl 流程正确

---

## Phase 3: 链上充值端到端 (预计 1 天)

### 3.1 Base USDC 充值测试

1. MetaMask 连接 Base Mainnet
2. UI Billing 页面 → 选择 Base / USDC
3. 连接钱包
4. 输入金额 ($1 = 100 Credits)
5. 发送 USDC → Treasury Safe
6. 调用 `payment.verify` 传入 txHash
7. 确认余额 +100 Credits
8. 确认 `crypto_deposits` + `unified_ledger` 记录正确

### 3.2 Tron USDT 充值测试

1. TronLink 钱包连接
2. 选择 Tron / USDT
3. 发送 USDT TRC20 → Treasury Tron 地址
4. 验证交易
5. 确认余额增加

### 3.3 ⚠️ 需要 Chase 确认的配置 (阻塞项)

| 项目          | 当前状态                        | 需要确认                        |
| ------------- | ------------------------------- | ------------------------------- |
| EVM Treasury  | `0x4ba8...D8` (2/3 多签)        | 是否可直接接收充值? 还是用 EOA? |
| Tron Treasury | `TREASURY_ADDRESS_TRON` 未配置  | 请提供地址                      |
| Tron API Key  | 未申请                          | 是否需要 TronGrid Pro?          |
| Base RPC      | 公共 `https://mainnet.base.org` | 建议换 Alchemy, 是否有 key?     |

**Phase 3 验证**: 两链各至少 1 笔成功充值, 余额 + ledger 正确

---

## Phase 4: 提交 & 云端部署 (预计 0.5 天)

### 4.1 Git 提交推送

```bash
git add -A
git commit -m "fix: payment hub TS errors, address alignment, method registration, cleanup"
git push origin main
```

### 4.2 Render 环境变量配置

| 变量                       | 说明                       | 状态   |
| -------------------------- | -------------------------- | ------ |
| `PAYMENT_HUB_DATABASE_URL` | Neon 连接串                | 待配置 |
| `BASE_RPC_URL`             | `https://mainnet.base.org` | 待配置 |
| `POI_ADDRESS_EVM`          | `0xD3a3...a8`              | 待配置 |
| `TREASURY_ADDRESS_EVM`     | `0x4ba8...D8`              | 待配置 |
| `TREASURY_ADDRESS_TRON`    | 待确认                     | 阻塞   |
| `TRON_API_KEY`             | TronGrid Pro Key           | 待申请 |
| `WORKER_INTERNAL_TOKEN`    | 随机生成 32+ 字符          | 待配置 |

### 4.3 部署后验证清单

- [ ] Render deploy 成功, 启动日志无 Payment Hub 报错
- [ ] 生产环境 WebSocket `payment.balance` 正常返回
- [ ] Billing UI 页面在生产环境正常渲染
- [ ] (可选) 小额充值端到端验证

**Phase 4 验证**: 生产环境 3 项检查全部通过

---

## 时间线

```
Day 1 AM:  Phase 0 — 修复 TS 错误 + 地址统一 + method 注册 + 清理
Day 1 PM:  Phase 1 — DB 迁移 + 本地 Gateway 验证 + WS 测试
Day 2 AM:  Phase 2 — 自动化测试 + curl E2E
Day 2 PM:  Phase 3 — 链上充值测试 (Base USDC + Tron USDT)
Day 3 AM:  Phase 4 — Git push + Render 部署 + 生产验证
```

**总预估: 2.5-3 工作日** (不含等待 Chase 确认配置的时间)

---

## 风险与缓解

| 风险                           | 影响           | 缓解                                   |
| ------------------------------ | -------------- | -------------------------------------- |
| Neon DB 迁移冲突               | 阻塞 Phase 1   | 001 用 `CREATE TABLE IF NOT EXISTS`    |
| Treasury Safe 无法接收测试转账 | 阻塞 Phase 3   | 需 Safe owner 确认, 或用 EOA           |
| Tron treasury 地址未配置       | 阻塞 Tron 充值 | 需 Chase 提供, 可先跳过 Tron           |
| Base 公共 RPC 限速             | 影响验证速度   | 建议用 Alchemy/Infura                  |
| Render 环境变量遗漏            | 部署后报错     | 对照上表逐一配置                       |
| 上游 OpenClaw 代码更新         | 合并冲突       | Payment Hub 不改 OpenClaw 核心, 风险低 |
