# UserInternalAffair - 内政系统

## 概述
`UserInternalAffair` 是客户端**内政系统**的核心管理类，负责管理城市建造、士兵（征兵/治疗/预备兵）、科技研究、内政官委任、资源存储、民居分配、市政厅、赌场（酒坊）、行商等所有与城市发展相关的业务逻辑。

---

## 类结构

### 1. `UserInternalAffair` 主类

#### 1.1 核心数据

##### 建造系统
| 属性 | 类型 | 说明 |
|------|------|------|
| `typeToLevel` | `Map<number, number>` | 建筑类型 → 当前等级 |
| `grade` | `number` | 当前建造阶数（= 城主府等级） |
| `buildingTypeMap` | `Map<number, IConstructBuilding>` | 建筑类型 → 建造中信息 |
| `buildingList` | `IConstructBuilding[]` | 当前建造队列（某项可能为空表示空闲位置） |
| `type_level_config` | `Map<number, Map<number, __building_temp>>` | 建筑类型 → 等级 → 配置 |
| `baseBuildingQueueCount` | `number` | 基础建造队列数量（默认3） |
| `baseExtraQueueCost` | `number` | 额外队列基础花费 |
| `extraQueueFactor` | `number` | 额外队列花费增长比率 |
| `maxExtraQueue` | `number` | 最大额外队列数量 |
| `extraQueueCostId` | `number` | 额外队列花费物品ID |
| `curBuildingQueueEmptyIdx` | `get: number` | 当前最近空闲队列位置 |

##### 士兵系统
| 属性 | 类型 | 说明 |
|------|------|------|
| `type_subType_LevelSoldier` | `Map<SoldierType, Map<number, number>>` | 士兵类型 → 子类型 → 等级 |
| `type_subType_level_soldierConfig` | `Map<number, Map<number, Map<number, __soldier_temp>>>` | 士兵配置索引 |
| `reserveSoldierNum` | `number` (observable) | 预备兵数量 |
| `reservistId` | `number` | 预备兵物品ID（11001） |
| `isAutoConscription` | `boolean` (observable) | 是否自动征兵 |
| `conscriptionCycle` | `ICycle` (observable) | 征兵周期数据 |
| `conscriptionTokenLastCalTime` | `number` | 征兵令上次计算时间 |

##### 伤兵系统
| 属性 | 类型 | 说明 |
|------|------|------|
| `healCycle` | `ICycle` | 伤兵治疗周期 |
| `totalWoundedSoldier` | `get: number` | 伤兵总数 |
| `healedSoldier` | `get: number` | 已治疗士兵数（本轮） |

##### 科技系统
| 属性 | 类型 | 说明 |
|------|------|------|
| `groupToCurConfigTech` | `Map<number, __building_tech_temp>` | 科技组 → 当前科技配置 |
| `groupLevelToConfigTech` | `Map<number, Map<number, __building_tech_temp>>` | 科技组 → 等级 → 配置 |
| `technologyHouse` | `ITechnologyHouse` (observable) | 科技所数据 |

##### 内政官
| 属性 | 类型 | 说明 |
|------|------|------|
| `officerIDToOfficer` | `Map<number, IOfficial>` | 配置ID → 内政官 |
| `uuidToOfficer` | `Map<string, IOfficial>` | uuid → 内政官 |
| `configIdToOfficer` | `Map<number, IOfficial>` | 英雄配置ID → 内政官 |

##### 民居/资源
| 属性 | 类型 | 说明 |
|------|------|------|
| `dwellingPlan` | `Map<number, number>` | 资源ID → 分配居民数量 |
| `planType` | `number` | 分配方案类型 |
| `resourceUpdater` | `ResourceUpdater` | 资源更新器 |
| `resourceCalcTime` | `Map<PIAResourceCalcTime, Long>` | 资源计算时间 |

##### 市政厅/铸币
| 属性 | 类型 | 说明 |
|------|------|------|
| `municipalOffice` | `CityHall` (observable) | 市政厅数据 |
| `maxTaxTimes` | `number` (observable) | 最大铸币次数 |

##### 酒坊（赌场/继承）
| 属性 | 类型 | 说明 |
|------|------|------|
| `gamblingData` | `IGamblingData` | 赌场数据 |
| `inheritData` | `IInheritData` | 英雄继承数据 |

##### 等级锁系统
| 属性 | 类型 | 说明 |
|------|------|------|
| `levelLockMap` | `Map<BuildingLockLevelKind, { level, buildingIds[] }[]>` | 功能类型 → 等级锁列表 |
| `dynamicProperties` | `Map<string, Long>` | 服务器动态属性 |
| `detailInfo` | `ISCSyncCityDetailInfo` | 缓存的内城详情 |
| `userShopInfo` | `IUserShopInfo` | 行商信息 |

##### UI 辅助
| 属性 | 类型 | 说明 |
|------|------|------|
| `typeToGetDesFunc` | `Map<number, Function>` | 建筑类型 → 特殊描述函数 |
| `groupToGetDesFunc` | `Map<number, Function>` | 科技组 → 特殊描述函数 |
| `normalLockedModelPath` | `string` | 普通资源点锁路径 |
| `desertLockedModelPath` | `string` | 沙漠资源点锁路径 |
| `snowLockedModelPath` | `string` | 雪地资源点锁路径 |
| `lockTipsStr` | `string` | 解锁提示文本 |

#### 1.2 主要方法

##### 初始化
- `Init()` — 初始化所有配置映射、等级锁、基础参数
- `DeInit()` — 清理士兵等级数据
- `GenerateTypeToConfigMap()` — 生成建筑类型→等级→配置映射
- `GenerateTypeToConfigSoldierMap()` — 生成士兵类型→子类型→等级→配置映射
- `InitGroupToConfigTech()` — 初始化科技组配置映射
- `GenerateFunctionLevelLockMap()` — 生成功能等级锁映射

##### 建造系统
- `SetBuildingInfo(buildings: IConstructBuilding[])` — 设置建造信息（初始化时调用）
- `AddOrUpdateBuilding(type, data)` — 添加或更新建造队列中的建筑
- `GetBuildCost(): number` — 获取额外队列建造消耗（超上限返回-1）
- `CheckIsExtraBuildingQueue(type): boolean` — 检查建筑是否在额外队列中
- `GetEffectedBuildingTime(originTime): number` — 计算受加成后的建造时间
- `GetCurLevelConfig(type): __building_temp` — 获取当前等级建筑配置
- `GetMaxLevelConfig(type): __building_temp` — 获取最大等级建筑配置
- `CanUpgradeBuilding(type: PIABuildingType): CanUpgradeBuildingResult` — 判断建筑能否升级/建造，返回结果包含 `canUpgrade` 布尔标志和 `reason`（具体不可升级原因）
  - 检查顺序：配置是否存在 → 是否满级 → 是否建造中 → 前置条件（建筑等级/主线任务/赛季任务）→ 资源是否充足
  - 前置配置检查 `pre_request`/`pre_request_type`，资源消耗应用 `GetBuildingCostReduceRate()` 减免

##### 士兵系统
- `GetSoldierConfig(type, subType?, level?)` — 获取士兵配置
- `GetSoldierLevel(type, subType?): number` — 获取士兵当前等级
- `SetSoldierLevel(type, level, subType?)` — 设置士兵等级
- `GetSoldierMaxStage(type): number` — 获取士兵最大阶段
- `GetSoldierConscriptionSingleTime(): number` — 获取单次征兵时间
- `GetSoldierConscriptionCostConfig()` — 获取征兵消耗配置（按优先级）
- `GetSoldierHealCostConfig()` — 获取伤兵治疗消耗配置（按优先级）
- `GetValidSoldierConfigs()` — 获取所有已解锁的非特殊兵种配置
- `IsSoldierUnlocked(soldierType): boolean` — 检查兵种是否已解锁
- `CheckCatapultValid(): boolean` — 检查投石车是否可用

##### 伤兵系统
- `GetHealedSoldierThisRound(): number` — 本轮已治疗总数（包含已加入预备兵部分）
- `GetHealedSoldier(): number` — 已治疗但未加入预备兵的总数
- `GetWoundedNum(): number` — 当前伤兵数量
- `GetHealEndTime(): number` — 预计治疗结束时间

##### 预备兵
- `GetReserveSoldierOccupiedNum(): number` — 预备兵总占用（可用数 + 伤兵 + 征兵中）
- `GetCurReserveSoldierOccupiedNumWithoutConscription(): number` — 预备兵占用（不含征兵）
- `GetCurrentSoldierCanUseNum(): number` — 当前可用士兵数
- `GetTotalSoldierNum(): number` — 总兵力（预备兵 + 伤兵 + 征兵中）
- `GetConscriptedSoldier(): number` — 已征募士兵数
- `GetMaxReserveSoldierNum(): number` — 预备兵上限
- `GetConscriptionEndTime(): number` — 征兵结束时间

##### 等级锁系统
- `IsFunctionLevelLimited(kind, level): { isLimited, limitBuildingId? }` — 判断等级是否受限，受限时返回需要解锁的建筑
- `GetFunctionLevelLimit(kind): number | null` — 获取功能等级上限

##### 建筑描述
- `GetUpgradeDescription(configId, nextConfigId?): [string, string, string][]` — 获取建筑升级描述（属性名、当前值、下值）
- `AddUnlockDescription(result, currentConfig, nextConfig)` — 添加解锁内容描述
- `GetUpgradeDescriptionTech(configId, showNext?): [string, string, string][]` — 获取科技升级描述

##### 资源/存储
- `GetMaxStorage(id: number): number` — 获取指定资源存储上限
- `GetCopperOut(): number` — 获取铸币产出速率
- `GetCopperStoryOut(): number` — 获取演义铸币加成

##### 内政官
- `GetEffectValueDisplay(hero, officer): number` — 获取内政官效果显示值
- `GetEffectValue(hero, officer): number` — 获取内政官影响力数值
- `CheckHeroAppointment(uuid: Long): boolean` — 检查同类型英雄是否已被派遣

##### 赌场
- `GetTodayGamblingTimes(): number` — 获取今日赌场次数（以凌晨3点为分界）
- `SetGamblingData(times, time)` — 设置赌场数据

##### 解锁提示
- `ShowUnlockTips(name, type)` — 显示建筑解锁提示
- `GetUnlockTips(name, type)` — 获取解锁提示数据

##### 城市检测
- `IsGuildInitCity(cityId): boolean` — 是否联盟初始城
- `IsCampMainCity(cityId): boolean` — 是否势力主城
- `IsMultiSettlementCity(cityId): boolean` — 是否多用户城市（联盟初始城或势力主城）
- `FilterDetailInfo(data: ISettlementInfo[])` — 筛选重复玩家数据，保留搬迁时间最近的

##### 编队信息
- `GetMaxTeamCount(): number` — 最大编队数（5）
- `GetMaxHeroCount(teamIdx): number` — 每队最大英雄数（3）
- `Get3HeroTeamCount(): number` — 3英雄编队数量（5）

##### 消息/脏标记
- `SetProperty(propertyName, value, update?)` — 设置属性并标记脏数据
- `UpdateProperty(propertyName)` — 标记属性为脏
- `UpdateDirty()` — 触发脏数据更新事件

##### 已移除功能
- `GetSoldierUpgradeLevelBuildingInfo(): [__building_temp, number]` — 已移除（所有士兵升阶建筑已不再使用）

##### 辅助
- `GetPlayerForceValue(): number` — 获取玩家战力值
- `GetServerProperty(name): number` — 获取服务器属性值
- `GetTalentColorName(groupId): string` — 根据天赋组ID获取颜色名称
- `GetAllUnlocksForBuilding(buildingConfig): Map<number, number>` — 获取建筑所有解锁内容
- `GetUnlockTitle(lockType): string` — 获取解锁标题
- `GetUnlockValue(lockType, param): string` — 获取解锁数值显示
- `GetLevel1TechConfig(group)` — 获取科技组1级配置

---

### 2. 辅助类型

#### 2.1 枚举

```typescript
/** 内政属性枚举 - 用于脏标记更新 */
enum PIAProperties {
    typeToLevel = "typeToLevel",                       // 建筑等级
    curBuildingQueueCount = "curBuildingQueueCount",    // 建造队列数
    buildingTypeMap = "buildingTypeMap",                // 建造中建筑
    type_subType_levelSoldier = "type_subType_levelSoldier", // 士兵等级
    tagGroupToConfig = "tagGroupToConfig",
    groupToCurConfigTech = "groupToCurConfigTech",      // 科技配置
    officerIDToOfficer = "officerIDToOfficer",          // 内政官（含uuidToOfficer）
    dwellingPlan = "dwellingPlan",                      // 民居分配
    municipalOffice = "municipalOffice",                // 市政厅
    technologyHouse = "technologyHouse",                // 科技所
    gamblingData = "gamblingData",                      // 赌场
}

/** 内政建筑类型枚举 */
enum PIABuildingType {
    mainCastle = 101,           // 主城（城主府）：提高最大统率值
    mill = 121,                 // 磨坊：增加食物产出
    loggingCamp = 122,          // 伐木场：增加木材产出
    quarry = 123,               // 石料厂：增加石材产出
    smeltingPlant = 124,        // 冶炼厂：增加金属产出
    wareHouse = 103,            // 仓库：增加资源存储上限
    drillGround = 105,          // 校场：部队战斗力，预备役
    infantryBattalion = 131,    // 步兵营
    cavalryBattalion = 132,     // 骑兵营
    pikemanBattalion = 133,     // 枪兵营
    bowmanBattalion = 134,      // 弓兵营（训练速度加成）
    municipalOffice = 109,      // 市政所（市政厅）：铜贝产出
    researchInstitute = 110,    // 研究院（督造司）：科技研究
    weaponsFactory = 112,       // 武器厂：部队攻击力
    armorFactory = 113,         // 盔甲厂：部队防御力
    militaryInstitute = 114,    // 军事学院：部队智力
    trainingGround = 115,       // 操练场：部队攻击速度
    conscriptionBattalion = 141,// 募兵营
    qin_tian_jian = 144,        // 钦天监
    hu_ji_suo = 147,            // 户籍所
    yan_wu_chang = 148,         // 演武场
    smithy = 153,               // 铁匠铺：锻造装备
}

/** 功能等级锁类型 */
enum BuildingLockLevelKind {
    Hero = 1,       // 武将等级上限
    Soldier = 2,    // 兵种等级上限
    HeroTalent = 3, // 武将天赋上限
    HeroSkill = 4,  // 武将技能上限
}
```

#### 2.2 配置枚举
```typescript
enum PropertyConfigEnum {
    extraQueueFactor = 5093,   // 额外队列花费增长比率
    extraQueueBase = 5092,     // 额外队列基础花费
    maxExtraQueue = 5094,      // 最大额外队列数量
    baseQueueCount = 5091,     // 基础队列数量
    maxTaxTime = 5223,         // 最大铸币次数
}
```

#### 2.3 辅助函数
```typescript
/** 等级锁守卫函数：补全缺失的锁类型默认值 */
function FunctionLockGuard(locks: BuildingLockLevelKind[], params: number[])
// 自动补全 Hero(1)、Soldier(2)、HeroTalent(3)、HeroSkill(4) 的默认值
```

---

## 业务逻辑总结

### 建造系统
1. 玩家通过 `buildingList`（建造队列）进行建筑升级
2. 每个建筑类型（type）对应一个等级（`typeToLevel`）
3. 基础建造队列为3个，可通过花费道具增加额外队列（`GetBuildCost`）
4. 建造时间受服务器属性 `build_time` 加速（`GetEffectedBuildingTime`）
5. 建筑解锁条件为前置建筑类型等级达到要求（`pre_request`/`pre_request_type`）

### 等级锁系统
- 城主府等级决定功能解锁上限（武将等级、兵种等级、天赋上限、技能上限）
- `GenerateFunctionLevelLockMap()` 从建筑配置表生成锁映射
- `IsFunctionLevelLimited()` 判断指定等级是否受限
- `GetFunctionLevelLimit()` 获取当前最高可达等级

### 士兵系统
- 士兵分为多个类型（步兵、骑兵、枪兵、弓兵、投石车等）
- 每个兵种有子类型和等级（`type_subType_LevelSoldier`）
- 征兵：通过 `conscriptionCycle` 管理征兵周期，可自动征兵
- 治疗：通过 `healCycle` 管理伤兵治疗周期
- 预备兵：`reserveSoldierNum` + 治疗中 + 征兵中 = 总占用
- 消耗配置按优先级选择（`GetSoldierConscriptionCostConfig`/`GetSoldierHealCostConfig`）

### 科技系统
- 科技按组（`group`）划分，每组一个当前等级
- `technologyHouse` 存储科技所整体数据
- 科技升级描述通过 `GetUpgradeDescriptionTech` 获取
- 可设置特殊处理函数（`groupToGetDesFunc`）

### 内政官
- 英雄可被委任为内政官，提供属性加成
- 通过 `officerIDToOfficer`/`uuidToOfficer`/`configIdToOfficer` 三种索引查询
- `GetEffectValue` 计算内政官对资源产出的影响值

### 资源存储
- `GetMaxStorage` 按资源类型（食物/木材/金属/石材）返回存储上限
- 存储上限受建筑等级和服务器属性影响

### 建筑描述（UI）
- `GetUpgradeDescription` 生成 [属性名, 当前值, 下一级值] 三元组
- 支持特殊处理函数覆盖默认行为
- 自动处理0级建筑的描述（当前值 = 下一级值）
- `AddUnlockDescription` 在升级描述中嵌入解锁内容：武将等级上限、兵种等级上限、武将天赋上限（带颜色名）

### 脏标记更新
- `dirtySet` 记录变更的属性名
- `UpdateDirty()` 通过触发 `E_TriggerType.on_personal_internal_affair_data_update` 事件通知UI更新

### 赌场（酒坊）
- `GetTodayGamblingTimes` 计算今日可赌博次数
- 以凌晨3点为日切分界点
- 通过 `gamblingData` 存储赌博次数和上次时间

---

## 关联模块
- **UserHero** — 内政官系统调用 `UserHero.GetHeroFinalProp` 计算效果值
- **UserTeam** — 获取当前部队士兵占用（`GetCurrentSoldierCanUseNum`）
- **UserServerProperty** — 获取服务器属性（建造时间、资源存储上限等）
- **UserItem** — 计算周期物品数量（征兵、治疗进度）
- **Global.UserStoryWorld** — 演义铸币加成
- **Global.UserGuild** — 联盟初始城检测
- **Global.ConditionGuideMgr** — 引导条件触发
- **cfg.building / cfg.soldier / cfg.building_tech / cfg.soldier_cost** — 配置表