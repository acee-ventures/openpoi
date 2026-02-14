# Prediction Market（链上预测市场）（Games / Live）

Prediction Market 现归类为 POI Games 的子产品，用于提供链上事件预测、交易与结算体验。该模块此前在 POI Platform 体系内呈现，现已迁移至 Games 类别归档与维护。

## 产品定位

- 链上预测市场（Base 网络）
- 核心能力：事件预测、链上结算、担保/托管式流程支持（Escrow）
- 代码仓库：`acee-predict`

## 与 POI Platform 的关系

- 共享：部分身份/用户体系能力、以及 Escrow 相关组件（以工程集成为准）。
- 差异：Prediction Market 的交易与结算逻辑以链上与市场模块为中心，功能入口与叙事在 Games 类别下统一归档。

## 重要说明（迁移）

- 文档层面：Prediction Market 从 POI Platform 子模块迁入 POI Games。
- 若 POI Platform 中仍存在历史入口/路由，其页面与导航归属以产品分类为准，避免对外叙事混乱。

## 合规提示（摘要）

- 本文档仅描述产品与技术结构，不构成金融、投资或法律建议。
- 如涉及 RWA 相关场景，叙事遵守 No Profit Distribution，仅描述功能性流程与访问权益。

## 来源

- `acee-predict/apps/web/src/lib/baseConfig.ts`（Base/USDC/路由与合约配置锚点）
- `ProofOfInfluence/apps/web/src/routes.ts`（历史 prediction 路由存在性参考）
- `acee-docs/product/INDEX.md`（分类迁移口径）
