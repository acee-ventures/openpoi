# OpenPOI 概要（AI/Infra / In Dev）

> 本文件仅提供概要级定位，不固化具体产品功能清单。OpenPOI 的 2B/2C 产品形态与定价策略仍在定型中，详细功能文档将在产品定型后发布。

OpenPOI 是基于 OpenClaw 的定制分支/衍生形态，用于承载 AI Agent Gateway、计费与认证扩展，并为多渠道分发提供统一控制面。

## 当前状态

- 工程层：Gateway 与 Payment Hub 能力已有明确 API 参考（见 `api/openpoi.md`）。
- 产品层：对外产品形态与定价策略仍在迭代定型中（`[TBD]`）。

## 已确认能力（以仓库来源为准）

以下能力以 `api/openpoi.md` 的 API 参考为锚点：

- 多模型 AI 调用的 Gateway 接入（Provider/模型清单以 API 与配置为准）
- poiCredits 计费体系与充值核验（Base/Tron 等）
- 多渠道分发能力（以 OpenClaw 支持的渠道为基础）
- 多租户 API Key（`poi_sk_`）认证与内部校验
- WebSocket JSON-RPC 扩展方法（payment._）与内部服务端点（`/api/internal/_`）

## Deck 叙事中的子能力命名（映射）

以下名称为 Deck/Roadmap 叙事用词，归属到 OpenPOI（详见 `product/INDEX.md`）：

- Skynet：获客引擎（范围/实现细节 `[TBD]`）
- ACEE Copilot：统一对话入口（范围/实现细节 `[TBD]`）
- Copilot API：开发者 API（已由 `api/openpoi.md` 覆盖）
- Skynet SaaS：订阅制定价模式（定型中 `[TBD]`）

## 技术细节入口

- OpenPOI Gateway API：`api/openpoi.md`（已完成）
- OpenClaw 上游文档：以 OpenClaw 官方文档为准（OpenPOI 继承其原生 Gateway 能力）

## 来源

- `acee-docs/api/openpoi.md`（OpenPOI 扩展：Auth、Credits、Payment Hub、WS methods）
- `openpoi/README.md`（OpenClaw 上游/基础形态参考）
