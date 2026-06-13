# 小推车UI展示数据

## 数据类总览

```
CartUIData                      — UI聚合数据
├── TotalIncome                 — 出售总收益
├── TotalSoldCount              — 累计售出总份数
├── ProductList                 — 上架商品列表       → List<CartProductItemData>
├── FurnaceInventoryList        — 百练炉库存列表     → List<CartProductItemData>
├── SoldList                    — 售出统计列表       → List<CartTransactionItemData>
├── IncomeList                  — 帐簿收益列表       → List<CartTransactionItemData>
└── SlotChangeList              — 库存变化列表       → List<CartSlotChangeData>
```

## 条目类定义

### CartProductItemData（百练炉库存列表 + 上架商品列表 共用）

| 字段 | 类型 | 说明 |
|------|------|------|
| Level | int | 等级（配置Tier） |
| Icon | string | 物品Icon路径 |
| Name | string | 物品名称 |
| Value | long | 物品价值/秒金（配置Param1List[0]） |
| StockCount | int | 库存数量（上架场景=槽位库存，百练炉场景=玩家持有） |

### CartTransactionItemData（售出统计列表 + 帐簿收益列表 共用）

| 字段 | 类型 | 说明 |
|------|------|------|
| Icon | string | 物品Icon路径 |
| Name | string | 物品名称 |
| SoldCount | int | 售出份数（售出统计场景使用） |
| Income | long | 收益银元（帐簿场景使用） |

### CartSlotChangeData（库存变化列表 专用）

| 字段 | 类型 | 说明 |
|------|------|------|
| SlotIndex | uint | 槽位编号 |
| ProductName | string | 商品名称 |
| RemainingCount | int | 商品剩余数量 |
| SoldCount | int | 该槽位累计售出数量 |

## 数据来源

| 数据 | 来源 |
|------|------|
| TotalIncome | 各槽位 CartSlotData.Income 之和 |
| TotalSoldCount | ClientCartContainer.TotalSoldCount |
| ProductList | CartSlotData（ProductItemId != 0 的槽位）+ CfgGen.item |
| FurnaceInventoryList | ItemSystem.Ins.GetItemIdListByType(Product) + player itemContainer + CfgGen.item |
| SoldList | CartSlotData（SoldCount > 0 的槽位）+ CfgGen.item |
| IncomeList | CartSlotData（Income > 0 的槽位）+ CfgGen.item |
| SlotChangeList | CartSlotData（ProductItemId != 0 的槽位）+ CfgGen.item |

## 接口

```csharp
// CarSystem_Data.cs
CartUIData GetCartUIData()
```

调用方式：`var uiData = CarSystem.Ins.GetCartUIData();`

## 文件清单

| 文件 | 内容 |
|------|------|
| `CarSystem_Data.cs` | 数据类定义 + GetCartUIData() 方法 |
| `ClientCartContainer.cs` | 新增 SlotSoldCountMap + GetSlotSoldCount() |
