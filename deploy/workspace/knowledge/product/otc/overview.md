# OTC Exchange 概述（Finance / Live）

> 仅公开信息，不包含内部架构细节、敏感运营策略与内部风控参数。

OTC Exchange 是 ACEE Ventures 的 Finance 类产品（Live），面向 2B/2C 提供 Cash ↔ USDT 的场外交易服务与运营工具能力，主要服务 LA 华人商业社区。

## 支持的资产与网络

- 加密资产：USDT
- 网络：TRON（TRC20）为主
- 其他网络/币种：规划中 `[TBD]`

## 核心功能（公开版摘要）

- 客户管理：KYC 状态、基础资料、交易限额（限额规则 `[TBD]`）
- 报价与价格锁定：生成报价、锁价窗口（锁价策略 `[TBD]`）
- 交易追踪：交易状态流转、历史记录、凭证留存
- C2C 点对点担保交易：通过平台辅助的担保流程完成买卖双方撮合与争议处理

## 操作台页面（UI）

- Dashboard：交易概览
- Customers：客户管理
- Transactions：交易记录
- C2C：点对点担保交易
- Wallet：钱包相关信息（展示范围 `[TBD]`）
- Settings：系统设置（权限与角色 `[TBD]`）

## 合规框架（进行中 / 规划中）

除非 `acee-docs` 明确记载已完成，否则合规状态默认表述为"进行中/规划中"。

- FinCEN MSB 注册：进行中 / 规划中
- BSA 反洗钱（AML）体系：进行中 / 规划中
- 货币交易报告（CTR，常见口径为现金交易 $10,000+，适用性 `[TBD]`）：进行中 / 规划中
- 可疑活动报告（SAR）流程：进行中 / 规划中
- 记录保留（目标 5 年）：进行中 / 规划中

## 来源

- `acee-otc/server/routes/c2c.ts`（C2C 功能存在性与流程锚点）
- `acee-otc/client/src/pages/C2C.tsx`（C2C UI 存在性）
- `acee-docs/product/INDEX.md`（OTC 分类与命名映射：Merchant Payment）
