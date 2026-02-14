# SSF 业务模型

> ACEE Ventures 代币化服务 — 实体角色与资金流向

---

## 核心定位

**ACEE Ventures 是代币化服务提供商，帮助物业所有者实现资产代币化和销售。**

---

## 实体角色

| 实体                        | 角色                       | 职责                                             |
| --------------------------- | -------------------------- | ------------------------------------------------ |
| **ACEE Ventures LLC**       | Service Provider / Manager | 代币化平台、技术开发、销售运营、POI 奖励计划管理 |
| **SSF Holdings LLC**        | SPV (为 Seller 设立)       | 持有物业权益、发行代币、合规主体                 |
| **Property Owner (Seller)** | Asset Owner / Client       | 物业所有者、委托 ACEE 代币化、收益最终受益人     |
| **Investors**               | Token Purchasers           | 购买 SSFShareToken、获得 POI 奖励资格            |

---

## 合同关系

```
Property Owner (Seller)
         │
         │ Tokenization Service Agreement
         ▼
   ACEE Ventures LLC ◄────► SSF Holdings LLC (SPV)
         │                        │
         │                        │ Token Issuance
         │                        ▼
         │                  SSFShareToken
         │                        │
         │ Subscription Agreement │
         ▼                        ▼
      Investors ◄─────────── Purchase Tokens
```

---

## 合同矩阵

| 合同                               | 甲方             | 乙方             | 用途                 |
| ---------------------------------- | ---------------- | ---------------- | -------------------- |
| **Tokenization Service Agreement** | Property Owner   | ACEE Ventures    | 代币化服务、收益分成 |
| **SPV Formation Agreement**        | Property Owner   | SSF Holdings LLC | SPV 设立、权益授权   |
| **Management Agreement**           | SSF Holdings LLC | ACEE Ventures    | SPV 管理授权         |
| **Subscription Agreement**         | SSF Holdings LLC | Investor         | 投资人认购           |
| **POI Rewards Program Terms**      | ACEE Ventures    | Investor         | POI 奖励条款         |

---

## 资金流向

```
Investor ──USDC──► SSFShareSale Contract
                            │
                            ▼
                   Treasury (多签)
                            │
                   ┌────────┴────────┐
                   ▼                 ▼
           Property Owner      ACEE Ventures
           (Net Proceeds)      (Service Fee)
```

---

## 收益分成模型

| 项目                | Property Owner        | ACEE Ventures         |
| ------------------- | --------------------- | --------------------- |
| Token Sale Proceeds | 90%                   | 10% (Service Fee)     |
| Ongoing Management  | N/A                   | Management Fee        |
| POI Rewards Funding | Optional contribution | Optional contribution |

> 具体比例以 Tokenization Service Agreement 为准

---

## 关键定位澄清

| 常见误解                          | 正确理解                                       |
| --------------------------------- | ---------------------------------------------- |
| ACEE/SSF 是买方，用代币募资买物业 | ACEE 是服务商，帮 Seller 代币化**已有物业**    |
| SSF Holdings = Issuer 持有物业    | SSF Holdings = SPV 代持权益，真正权益归 Seller |

---

**文档版本**: V1
**来源**: SSF_BUSINESS_MODEL_SSOT_V1
**维护者**: ACEE Ventures
