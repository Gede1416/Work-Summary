# UserDrawCard - 抽卡系统

## 概述
`UserDrawCard` 是客户端抽卡系统的核心管理类，负责**卡池数据查询与过滤**、**抽卡次数统计**、**免费/半价判定**、**保底机制**、**卡池内容与权重展示**等业务逻辑。配套的 `DrawCardPoolType` 枚举定义各类卡池类型。

---

## 类结构

### 1. `UserDrawCard` 主类

#### 1.1 卡池基础查询

| 方法 | 返回 | 说明 |
|------|------|------|
| `GetDrawCardPools()` | `net_proto.IDrawCardPoolInfo[]` | 从 `Global.draw_cards_data.draw_card_pool_id` 获取所有卡池列表 |
| `GetCardPoolTimeMessageBySerialNum(SerialNum, type)` | `net_proto.IDrawCardCD` | 根据卡池序号和类型，获取卡池的 CD/时间信息 |
| `IsDrawCardInPoolByID(card_id)` | `boolean` | 判断指定卡池 ID 是否在当前卡池列表中 |
| `GetDrawCardIdxById(card_id)` | `number` | 获取卡池在"可显示列表"中的索引（未找到返回0） |
| `GetCardPoolBySerialNum(SerialNum)` | `net_proto.IDrawCardPoolInfo` | 按 `cfg.serial` 序号获取对应卡池信息 |
| `GetCurrentDrawCardPoolId(card_id)` | `number` | 获取同类型同序号的当前有效卡池 ID（用于卡池切换） |
| `GetTreasuredRewardCardId` | `number` | **getter** — 按当前赛季返回典藏卡池奖励卡 ID（`cfg.property` 7531/7532/7533） |

#### 1.2 抽卡次数

| 方法/属性 | 返回 | 说明 |
|-----------|------|------|
| `GetDrawCardPoolDrawTimesById(card_id)` | `number` | 获取指定卡池已抽次数 |
| `GetBigDrawCardDrawCount` | `number` | **getter** — 获取所有大卡池总抽数 |
| `GetDrawCardPoolDrawTimesLimitById(card_id)` | `number` | 获取卡池上限（来自 `cfg.draw_card_list.pool_upper_limit`） |
| `IsShowDrawCardPoolDrawTimesById(card_id)` | `boolean` | 是否显示抽数上限（`cfg.dont_show_upper_limit != 1`） |

#### 1.3 可显示卡池过滤

| 方法 | 返回 | 说明 |
|------|------|------|
| `GetCanShowDrawCardPools()` | `number[]` | 获取当前可展示的卡池ID列表：大卡池全部显示；典藏卡池需有典藏书卷(7530)；铜贝卡池隐藏；其余正常显示。按 `cfg.serial` 排序 |
| `IsBigDrawCardPoolOpen(card_id)` | `boolean` | 判断大卡池是否开放：默认大卡池(2200001)抽数未超限时显示，超限后隐藏并切换到限时/赛季卡池 |

#### 1.4 红点/新卡池提示

| 方法/属性 | 返回 | 说明 |
|-----------|------|------|
| `ViewPoolKey` | `string` | **getter** — 本地存储键 `"NewlyViewPoolList_" + game_uuid` |
| `GetViewPoolSingleKey(pool_id)` | `string` | 单个卡池的查看标记键 |
| `CheckIsNeedShowCardDrawTips()` | `boolean` | 是否有新卡池需要展示红点提示 |
| `GetTrueNeedShowTipsDrawCardPoolsList()` | `number[]` | 需要展示红点提示的卡池列表（未在本地存储中标记"已查看"） |
| `GetCanShowTipsDrawCardPools()` | `number[]` | 获取可展示红点提示的卡池：过滤条件为 `cfg.if_show == 1` 且未被本地记录，最多取前5个 |
| `IsAnyPayDrawAvailable()` | `boolean` | 遍历 `GetCanShowDrawCardPools()` 中处于**开放时间内的卡池**，检查是否存在以下任一情况：**免费抽可用**（`isFree == true`）、**半价抽可用且资源足够**（`isHalfPrice && isHalfPriceEnough`）、或**抽奖券（特殊道具）可用且资源足够**（`one.isEnough` 且消耗道具非默认货币）。不包括仅默认货币够用但无免费/半价/抽奖券的情形。由 `CardDrawPayRedController.CheckPayDrawRed()` 调用，用于控制付费抽奖入口红点 |

#### 1.5 消耗/价格

| 方法 | 返回 | 说明 |
|------|------|------|
| `GetDrawCardPoolItemMessage(card_id)` | `{ one, five, isFree, isHalfPrice, isHalfPriceEnough, isFiveFree, specialItemId }` | **核心方法** — 获取卡池的消耗信息：单抽/五连抽的消耗道具及数量、是否足够；免费/半价状态；特殊道具替换逻辑 |
| `GetBigDrawCardPoolFreeAndHalfPriceData(drawCardId)` | `{ free, freeTimeNumber, freeTime, halfPrice, fiveFree }` | 获取大卡池的免费抽/半价抽/五连免费数据（含备赛季服务器截止时间判断） |

**消耗优先级逻辑**（`GetDrawCardPoolItemMessage`）：
1. 优先判断是否有免费/半价状态，免费则消耗为0，半价则消耗减半
2. 检查 `cfg.cost_extra` 特殊道具（如抽卡券），若玩家拥有则替换默认货币消耗
3. 若无特殊道具或未拥有，使用默认 `cfg.cost` 消耗
4. 五连抽若 `fiveFree` 为 true，消耗为0

#### 1.6 卡池限时

| 方法 | 返回 | 说明 |
|------|------|------|
| `GetDrawCardPoolLimitTimeById(card_id)` | `string` | 格式化显示卡池剩余时间：24小时内显示 `hh:mm:ss`，超过显示 `X天X小时` |

#### 1.7 卡池内容与权重

| 方法 | 返回 | 说明 |
|------|------|------|
| `GetDrawCardPoolHeroIdList(card_id)` | `{ five: number[], four: number[], three: number[] }` | 获取卡池的五/四/三号卡池对应的英雄ID列表（按 `cfg.treasure.reward_pool` 过滤） |
| `GetDrawCardPoolHeroList(card_id)` | `{ id, isOwn, reward_priority }[]` | 获取卡池英雄展示列表（含拥有状态），排序规则：`reward_priority` 降序 > `rarity` 降序 > `cost` 降序 > `ID` 升序 |
| `GetDrawCardPoolSkillList(card_id)` | `{ id, isOwn, reward_priority }[]` | 获取卡池兵器展示列表（5号+3号卡池），排序规则同英雄 |
| `GetDrawCardPoolWeight(card_id)` | `{ five, four, three, total }` | 获取卡池权重（`cfg.show_rate[0/1/2]`），基础值1000 |
| `GetDrawCardPoolSkillWeight(card_id)` | `{ five, four, total }` | 获取卡池兵器权重 |

#### 1.8 保底机制

| 方法 | 返回 | 说明 |
|------|------|------|
| `GetDrawCardPoolMiniGuaranteeSerialNum(SerialNum, type)` | `number` | 获取卡池小保底（紫色保底）当前已抽数 |
| `GetDrawCardPoolGoldMiniGuaranteeSerialNum(SerialNum, type)` | `number` | 获取卡池金色保底当前已抽数 |
| `GetDrawCardPoolT1GuaranteeSerialNum(SerialNum, type)` | `number` | 获取卡池 T1 保底当前已抽数 |

---

### 2. `DrawCardPoolType` 枚举

```typescript
enum DrawCardPoolType {
    bigDrawCardPool = 0,             // 大卡池
    limitDrawCardPool = 1,           // 限时卡池
    seasonDrawCardPool = 2,          // 赛季卡池
    copperDrawCardAPool = 3,         // 铜贝卡池
    seasonEndDrawCardPool = 4,       // 赛季结算卡池
    arenaDrawCardPool = 5,           // 竞技场晋级卡池
    crossServerArenaDrawCardPool = 6,// 跨服竞技场卡池
    activityDrawCardPool = 7,        // 活动卡池
    treasuredDrawCardPool = 8,       // 典藏卡池
}
```

---

## 业务逻辑总结

### 卡池显示规则

1. **大卡池**（`bigDrawCardPool = 0`）：默认一直显示，但默认大卡池（ID=2200001）抽数达到上限后隐藏，切换显示限时/赛季卡池
2. **典藏卡池**（`treasuredDrawCardPool = 8`）：需检查玩家是否有典藏书卷（`cfg.property` 7530），拥有时才展示
3. **铜贝卡池**（`copperDrawCardAPool = 3`）：始终隐藏
4. 最终列表按 `cfg.serial` 序号排序

### 抽卡消耗优先级

1. **免费抽** — 免费可用时，单抽消耗为0
2. **半价抽** — 半价可用时，消耗减半
3. **特殊道具替换** — 检查 `cfg.cost_extra` 中的特殊道具（如抽卡券），若玩家拥有则替换默认货币
4. **默认货币** — 使用 `cfg.cost`（默认消耗道具）
5. **五连免费** — 当 `fiveFree` 为 true 时，五连抽消耗为0

### 免费/半价判定

- 配置 `cfg.free == -1` → 永远免费；`cfg.free == 0` → 不免费；否则检查服务端的免费时间
- 配置 `cfg.half == -1` → 永远半价；否则检查服务端的半价时间
- **备赛季服务器截止时间处理**：若处于备赛季服务器，且 `draw_card_discount_deadline` 已过，则不再享受免费/半价

### 新卡池红点提示

- 新卡池通过本地存储 `LocalStoreIns` 记录已查看状态
- 通过 `GetCanShowTipsDrawCardPools` 过滤可展示的卡池，条件为 `cfg.if_show == 1` 且未被查看
- 最多展示5个新卡池的红点提示

### 保底机制

- **小保底**（`MiniGuarantee`）：紫色保底抽数
- **金色保底**（`GoldMiniGuarantee`）：金色保底抽数
- **T1保底**：T1保底抽数
- 数据来源于服务端下发的 `DrawCardPoolCD.count`、`sky_count`、`t1_count`

### 卡池英雄展示排序

`GetDrawCardPoolHeroList` 排序规则：
1. `reward_priority` 降序（值大的在前）
2. `rarity` 降序
3. `cost` 降序
4. `ID` 升序

---

## 关联模块

- **`Global.draw_cards_data`** — 服务器下发的抽卡数据（卡池列表、抽数、CD时间、折扣截止时间等）
- **`Global.UserItem` / `Global.UserHero` / `Global.UserWeapon`** — 道具/英雄/武器拥有状态检查
- **`cfg.draw_card_list`** — 抽卡配置表（卡池ID、类型、消耗、权重、保底、显示规则等）
- **`cfg.treasure`** — 宝藏奖励配置表（卡池内奖励列表，按 `reward_pool` 分组）
- **`cfg.hero` / `cfg.hero_weapon` / `cfg.property`** — 英雄/兵器/属性配置
- **`LocalStoreIns`** — 本地存储（记录已查看的卡池，用于红点去重）
- **`TimeUtil`** — 时间工具（格式化倒计时、获取服务器时间）