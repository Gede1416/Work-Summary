# UserInternalAffair — 玩家个人内政数据管理类

## 概述

| 项目 | 说明 |
|------|------|
| **文件路径** | `src/system/role/user_data/UserInternalAffair/UserInternalAffair.ts` |
| **类名** | `UserInternalAffair` |
| **核心职责** | 玩家个人内政系统的**数据中心类**，管理内政所有子系统的状态、配置映射、业务逻辑计算 |
| **特点** | 使用 MobX `observable` 做响应式数据绑定；通过 `dirtySet` + `TriggerMgr` 做属性变更通知 |
| **关联子系统** | 建筑系统、士兵系统（征兵/伤兵/预备役）、科技系统（督造司）、内政官系统、民居/市政厅、赌场(酒坊)、等级锁控制 |

---

## 1. 核心数据结构

### 1.1 建筑系统

| 字段 | 类型 | 说明 |
|------|------|------|
| `typeToLevel` | `Map<number, number>` | 建筑 type → 当前等级 |
| `grade` | `number` | 当前建造阶数（= 城主府等级） |
| `buildingTypeMap` | `Map<number, IConstructBuilding>` | type → 建造信息（正在建造的） |
| `buildingList` | `IConstructBuilding[]` | 当前建造队列（含空闲位） |
| `type_level_config` | `Map<number, Map<number, __building_temp>>` | type → level → 建筑配置（预生成缓存） |
| `curBuildingQueueEmptyIdx` | `getter` | 当前建造队列中最近的空闲位置索引 |
| `baseBuildingQueueCount` | `number` | 基础队列数量（默认 3） |
| `maxExtraQueue` | `number` | 最大额外队列数 |
| `baseExtraQueueCost` | `number` | 额外队列基础花费 |
| `extraQueueFactor` | `number` | 额外队列花费增长比率 |
| `extraQueueCostId` | `number` | 额外队列花费物品 id |

### 1.2 士兵系统

| 字段 | 类型 | 说明 |
|------|------|------|
| `type_subType_LevelSoldier` | `Map<SoldierType, Map<number, number>>` | 兵种大类 → 子类 → 等级 |
| `type_subType_level_soldierConfig` | `Map<number, Map<number, Map<number, __soldier_temp>>>` | career → sub_career → level → 配置（预生成） |
| `reserveSoldierNum` | `number` @observable | 预备兵数量 |
| `conscriptionCycle` | `ICycle` @observable | 征兵周期数据 |
| `isAutoConscription` | `boolean` @observable | 是否自动征兵 |
| `healCycle` | `ICycle` | 伤兵治疗周期数据 |
| `reservistId` | `number` | 预备兵物品 id（11001） |

#### 征兵相关计算

| getter / 方法 | 说明 |
|------|------|
| `remainConscriptionSoldier` | 征兵队列剩余可征数 |
| `totalConscriptionSoldier` | 本次征兵总数量 |
| `GetConscriptedSoldier()` | 当前已征兵数量（已产出） |
| `GetConscriptionEndTime()` | 征兵结束时间戳 |
| `GetSoldierConscriptionSingleTime()` | 单兵征兵耗时（ms） |
| `GetSoldierConscriptionCostConfig()` | 获取征兵消耗配置 |

#### 伤兵相关计算

| getter / 方法 | 说明 |
|------|------|
| `totalWoundedSoldier` | 伤兵总数 |
| `healedSoldier` | 当前轮次已治疗总数 |
| `GetHealedSoldierThisRound()` | 包含已加入预备兵的累计治疗量 |
| `GetHealedSoldier()` | 不含已加入预备兵的已治疗量 |
| `GetWoundedNum()` | 剩余未治疗伤兵数 |
| `GetHealEndTime()` | 治疗完成时间 |
| `GetSoldierHealCostConfig()` | 获取伤兵治疗消耗配置 |

#### 预备役相关

| 方法 | 说明 |
|------|------|
| `GetReserveSoldierOccupiedNum()` | 预备兵占用数（当前已使用 + 伤兵 + 征兵中） |
| `GetCurReserveSoldierOccupiedNumWithoutConscription()` | 不计征兵的预备兵占用数 |
| `GetCurrentSoldierCanUseNum()` | 当前可用预备兵数（预备兵存量 + 已治疗 + 已征兵） |
| `GetTotalSoldierNum()` | 总兵力（预备兵 + 伤兵 + 征兵中） |
| `GetMaxReserveSoldierNum()` | 最大预备兵上限 |

### 1.3 科技系统（督造司/研究院）

| 字段 | 类型 | 说明 |
|------|------|------|
| `groupToCurConfigTech` | `Map<number, __building_tech_temp>` | 科技组 → 当前科技配置 |
| `groupLevelToConfigTech` | `Map<number, Map<number, __building_tech_temp>>` | group → level → 配置（预生成） |
| `technologyHouse` | `ITechnologyHouse` @observable | 科技所数据 |
| `groupToGetDesFunc` | `Map<number, Function>` | 科技组 → 特殊描述生成函数（自定义处理） |

### 1.4 内政官系统

| 字段 | 类型 | 说明 |
|------|------|------|
| `officerIDToOfficer` | `Map<number, IOfficial>` | 官员 id → 官员数据 |
| `uuidToOfficer` | `Map<string, IOfficial>` | uuid → 官员数据 |
| `configIdToOfficer` | `Map<number, IOfficial>` | 配置 id → 官员数据 |
| `GetEffectValue()` | method | 计算执政官内政影响值 |
| `GetEffectValueDisplay()` | method | 影响值显示用（含百分比处理） |
| `CheckHeroAppointment()` | method | 检测同类型英雄是否已被派遣 |

### 1.5 民居/市政厅/资源

| 字段 | 类型 | 说明 |
|------|------|------|
| `dwellingPlan` | `Map<number, number>` | 民居资源分配：resourceId → 分配数量 |
| `planType` | `number` | 分配方案类型 |
| `municipalOffice` | `ICityHall` @observable | 市政厅数据 |
| `maxTaxTimes` | `number` | 铸贝次数上限 |

**资源上限计算**：
- `GetMaxStorage(id)` → 根据资源类型返回对应存储上限
  - 食物/木材/金属/石材分别对应各自的 `ServerProperty.Limit`
  - 基础仓库通过 `PIABuildingType.wareHouse` 配置 + 配置表 5095
- `GetCopperOut()` → 征税铜贝产出（依赖 `ServerProperty.Copper_p`）
- `GetCopperStoryOut()` → 演义加成铜贝

### 1.6 酒坊（赌场/继承）

| 字段 | 类型 | 说明 |
|------|------|------|
| `gamblingData` | `IGamblingData` | 赌场数据 |
| `inheritData` | `IInheritData` | 继承英雄数据 |
| `GetTodayGamblingTimes()` | method | 获取今日已抽次数（以凌晨 3 点为界） |

### 1.7 其他字段

| 字段 | 说明 |
|------|------|
| `currentCityData` | `UserInternalAffairCurrentCityData` 当前城市信息 |
| `resourceUpdater` | `ResourceUpdater` 资源更新器 |
| `dynamicProperties` | 服务端动态属性 Map |
| `resourceCalcTime` | 资源计算时间戳 Map |
| `detailInfo` | 缓存的内城详细信息 |
| `userShopInfo` | 行商信息 |
| `conscriptionTokenLastCalTime` | 征兵令上次结算时间 |
| 锁定模型路径 | `normalLockedModelPath`、`desertLockedModelPath`、`snowLockedModelPath` |

---

## 2. 关键方法

### 2.1 初始化与配置生成

| 方法 | 说明 |
|------|------|
| `Init()` | 初始化：生成等级锁、建筑配置、兵种配置、科技配置；读取 Property 表常量 |
| `DeInit()` | 反初始化：清空兵种等级 |
| `GenerateTypeToConfigMap()` | 预生成 `type_level_config`：type → level → config |
| `GenerateTypeToConfigSoldierMap()` | 预生成 `type_subType_level_soldierConfig` |
| `InitGroupToConfigTech()` | 预生成 `groupLevelToConfigTech` 科技配置 Map |

### 2.2 等级锁系统

用于控制玩家内政等级对武将等级上限、兵种等级上限、天赋上限、技能上限的限制。

| 方法 | 说明 |
|------|------|
| `GenerateFunctionLevelLockMap()` | 从建筑配置的 `lock`/`param` 字段生成 `levelLockMap` |
| `IsFunctionLevelLimited(kind, level)` | 判断指定等级是否因内政建筑限制无法到达；返回 `{ isLimited, limitBuildingId }` |
| `GetFunctionLevelLimit(kind)` | 获取由内政建筑限制的最高等级 |

**等级锁类型**（`BuildingLockLevelKind`）：

| 枚举值 | 值 | 说明 |
|--------|-----|------|
| `Hero` | 1 | 武将等级上限 |
| `Soldier` | 2 | 兵种等级上限 |
| `HeroTalent` | 3 | 武将天赋上限 |
| `HeroSkill` | 4 | 武将技能上限 |

**逻辑说明**：
1. 遍历所有建筑的 `lock[i]` / `param[i]` 字段
2. 对每个 `lockKind`，按等级排序存入 `levelLockMap`
3. `IsFunctionLevelLimited` 判断：若当前等级 `< 解锁要求的建筑等级` 则受限
4. `FunctionLockGuard` 函数确保 0 级建筑也补上默认锁数据

### 2.3 建筑相关

| 方法 | 说明 |
|------|------|
| `SetBuildingInfo(buildings)` | 初始化设置建造队列 + 更新 buildingTypeMap |
| `AddOrUpdateBuilding(type, data)` | 添加或更新建造信息 |
| `GetBuildCost()` | 计算额外建造队列消耗；超出最大返回 -1 |
| `CheckIsExtraBuildingQueue(type)` | 检查某建筑是否在额外建造队列中 |
| `GetEffectedBuildingTime(originTime)` | 计算受属性加成的建造时间 |
| `GetCurLevelConfig(type)` | 获取当前等级的建筑配置 |
| `GetMaxLevelConfig(type)` | 获取最高等级的建筑配置 |
| `ShowUnlockTips(name, type)` | 显示解锁提示（锁住时弹窗） |
| `GetUnlockTips(name, type)` | 获取解锁提示数据（不弹窗，返回结构体） |

### 2.4 士兵相关

| 方法 | 说明 |
|------|------|
| `GetSoldierConfig(type, subType, level?)` | 获取兵种配置 |
| `GetSoldierLevel(type, subType)` | 获取兵种当前等级 |
| `SetSoldierLevel(type, level, subType)` | 设置兵种等级 |
| `GetSoldierMaxStage(type)` | 获取兵种最大阶段 |
| `GetValidSoldierConfigs()` | 获取所有已解锁可用的兵种配置 |
| `IsSoldierUnlocked(soldierType)` | 判断兵种是否已解锁 |
| `CheckCatapultValid()` | 判断投石车是否有效 |

### 2.5 升级描述生成

核心方法：`GetUpgradeDescription(configId, nextConfigId?)`

**返回值格式**：`[string, string, string][]` = `[属性文字描述, 当前值, 下一级值]`

**流程**：
1. 获取当前建筑配置和下一级配置
2. 读取 `effect_text[i]` / `effect_info[i]` / `effect_unit[i]` 构建描述
3. 调用 `AddUnlockDescription()` 添加解锁内容描述
4. 若 level === 0，当前值为下一级值，下一级值置空

**解锁内容描述逻辑**（`AddUnlockDescription`）：
- 遍历当前级和下一级的 `lock`/`param`，找出**新增的解锁内容**
- 对 `lockType === 3`（天赋）特殊处理：通过 `GetTalentColorName()` 获取颜色名称对比
- 其他类型直接显示数值变化

**配套私有方法**：
- `GetAllUnlocksForBuilding(buildingConfig)`：收集该建筑从 1 级到当前级的所有解锁内容
- `GetUnlockTitle(lockType)`：解锁标题映射
- `GetUnlockValue(lockType, param)`：解锁数值显示
- `GetTalentColorName(groupId)`：根据天赋组 id 获取颜色名（通过追踪天赋链末尾节点）

### 2.6 科技升级描述

| 方法 | 说明 |
|------|------|
| `GetUpgradeDescriptionTech(configId, showNext)` | 科技升级描述，同建筑类似，优先检查 `groupToGetDesFunc` 自定义函数 |

### 2.7 其他工具方法

| 方法 | 说明 |
|------|------|
| `GetServerProperty(name)` | 获取服务端属性 |
| `GetPlayerForceValue()` | 获取玩家战力值 |
| `GetMaxTeamCount()` / `GetMaxHeroCount()` / `Get3HeroTeamCount()` | 编队/英雄数量上限 |
| `IsGuildInitCity(cityId)` | 是否是联盟初始城 |
| `IsCampMainCity(cityId)` | 是否是势力主城 |
| `IsMultiSettlementCity(cityId)` | 是否是多用户城市 |
| `FilterDetailInfo(data)` | 过滤搬迁重复的玩家聚落数据（保留时间最近的） |
| `GetSoldierUpgradeLevelBuildingInfo()` | 已移除，返回 null |

---

## 3. 枚举定义

### 3.1 PIABuildingType — 内政建筑类型

| 枚举 | 值 | 说明 |
|------|-----|------|
| `mainCastle` | 101 | 主城（提高统率值） |
| `mill` | 121 | 磨坊（食物产出） |
| `loggingCamp` | 122 | 伐木场（木材产出） |
| `quarry` | 123 | 石料厂（石材产出） |
| `smeltingPlant` | 124 | 冶炼厂（金属产出） |
| `wareHouse` | 103 | 仓库（资源储存上限） |
| `drillGround` | 105 | 校场（部队战斗力/编队） |
| `infantryBattalion` | 131 | 步兵营 |
| `cavalryBattalion` | 132 | 骑兵营 |
| `pikemanBattalion` | 133 | 枪兵营 |
| `bowmanBattalion` | 134 | 弓兵营（训练速度加成） |
| `municipalOffice` | 109 | 市政所（铸贝） |
| `researchInstitute` | 110 | 研究院/督造司（科技） |
| `weaponsFactory` | 112 | 武器厂（部队攻击） |
| `armorFactory` | 113 | 盔甲厂（部队防御） |
| `militaryInstitute` | 114 | 军事学院（部队智力） |
| `trainingGround` | 115 | 操练场（部队攻速） |
| `conscriptionBattalion` | 141 | 募兵营 |
| `qin_tian_jian` | 144 | 钦天监 |
| `hu_ji_suo` | 147 | 户籍所 |
| `yan_wu_chang` | 148 | 演武场 |
| `smithy` | 153 | 铁匠铺（锻造装备） |

### 3.2 BuildingLockLevelKind — 等级锁类型

| 枚举 | 值 | 说明 |
|------|-----|------|
| `Hero` | 1 | 武将等级上限 |
| `Soldier` | 2 | 兵种等级上限 |
| `HeroTalent` | 3 | 武将天赋上限 |
| `HeroSkill` | 4 | 武将技能上限 |

### 3.3 PIAProperties — 属性变更通知枚举

用于 `UpdateProperty()` 时的属性名标记，触发 UI 更新。

| 枚举 | 值 | 说明 |
|------|-----|------|
| `typeToLevel` | "typeToLevel" | 建筑等级变更 |
| `curBuildingQueueCount` | "curBuildingQueueCount" | 建造队列数量变更 |
| `buildingTypeMap` | "buildingTypeMap" | 建造信息变更 |
| `type_subType_levelSoldier` | "type_subType_levelSoldier" | 兵种等级变更 |
| `tagGroupToConfig` | "tagGroupToConfig" | 标签组配置变更 |
| `groupToCurConfigTech` | "groupToCurConfigTech" | 科技配置变更 |
| `officerIDToOfficer` | "officerIDToOfficer" | 内政官变更（含 uuid） |
| `dwellingPlan` | "dwellingPlan" | 民居分配方案变更 |
| `municipalOffice` | "municipalOffice" | 市政厅数据变更 |
| `technologyHouse` | "technologyHouse" | 科技所数据变更 |
| `gamblingData` | "gamblingData" | 赌场数据变更 |

### 3.4 PropertyConfigEnum — Property 表常量枚举

| 枚举 | 值 | 说明 |
|------|-----|------|
| `extraQueueFactor` | 5093 | 额外队列花费增长率 |
| `extraQueueBase` | 5092 | 额外队列基础花费（格式: "itemId\|cost"） |
| `maxExtraQueue` | 5094 | 最大额外队列数量 |
| `baseQueueCount` | 5091 | 基础建造队列数 |
| `maxTaxTime` | 5223 | 铸贝次数上限 |

---

## 4. 数据流与变更通知机制

### 4.1 属性变更通知

```typescript
private dirtySet: Set<String> = new Set()

SetProperty(propertyName: string, value, update = true) {
    this[propertyName] = value
    this.dirtySet.add(propertyName)
    if (update) this.UpdateDirty()
}

UpdateProperty(propertyName: string) {
    this.dirtySet.add(propertyName)
    this.UpdateDirty()
}

UpdateDirty() {
    if (this.dirtySet.size > 0) {
        TriggerMgr.Trigger(E_TriggerType.on_personal_internal_affair_data_update, this.dirtySet)
        this.dirtySet.clear()
    }
}
```

**流程**：
1. 数据变更后调用 `SetProperty()` 或 `UpdateProperty()` 标记属性
2. `UpdateDirty()` 批量触发 `TriggerMgr`
3. UI 监听 `E_TriggerType.on_personal_internal_affair_data_update` 响应刷新

### 4.2 相关 Trigger 事件

- `E_TriggerType.on_personal_internal_affair_data_update` — 内政数据更新（携 dirtySet）
- `E_TriggerType.on_personal_internal_affair_building_level_change` — 建筑等级变更（携 type）

---

## 5. 已废弃/移除功能

| 功能 | 说明 |
|------|------|
| `typeToJumpFunc` | 跳转函数映射（已注释） |
| `typeToGetDesFunc` | 特殊描述函数映射（原本用于自定义建筑描述，已注释 `RegisterDescriptionGetFunc`) |
| `RemoveBuilding()` | 移除建筑（已注释） |
| `FinishBuilding()` | 完成建造（已注释） |
| `GetSoldierUpgradeLevelBuildingInfo()` | 士兵升阶建筑（已移除，返回 null） |
| 旧版 `GetUpgradeDescription()` | 原使用 `param1/param2` 参数名，新版改为 `effect_info/effect_unit` |

---

## 6. 依赖的外部模块

| 模块 | 用途 |
|------|------|
| `cfg.building` | 建筑配置表 |
| `cfg.building_tech` | 科技配置表 |
| `cfg.soldier` | 士兵配置表 |
| `cfg.soldier_cost` | 士兵消耗配置表 |
| `cfg.policy` | 政策/内政官配置表 |
| `cfg.property` | 系统属性配置表 |
| `cfg.hero_talent` | 英雄天赋配置表（GetTalentColorName） |
| `cfg.camp` | 势力配置表 |
| `cfg.story` | 演义配置表 |
| `Global.UserItem` | 物品周期计算 |
| `Global.UserTeam` | 部队数据 |
| `Global.UserServerProperty` | 服务端属性/属性加成 |
| `Global.UserGuild` | 联盟数据 |
| `Global.UserHero` | 英雄数据 |
| `Global.UserStoryWorld` | 演义世界数据 |
| `TriggerMgr` | 事件触发 |
| `ResourceUpdater` | 资源更新器 |