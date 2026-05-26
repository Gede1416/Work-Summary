# UserHero - 英雄系统

## 概述
`UserHero` 是客户端英雄系统的核心管理类，负责英雄数据的**解析、存储、查询**以及英雄相关的**业务逻辑计算**（升级、升阶、重置、特训、转换等）。配套的 `HeroItem` 类封装单个英雄的属性和状态。

---

## 类结构

### 1. `UserHero` 主类

#### 1.1 核心数据
| 属性 | 类型 | 说明 |
|------|------|------|
| `heroList` | `HeroItem[]` | 玩家拥有的所有英雄列表（可观察） |
| `specialTrainingList` | `ISpecialTraining[]` | 特训列表 |
| `relatedSkillMap` | `Map<number, number[]>` | 英雄ID → 相关技能ID列表 |
| `heroConvertSetting` | `Map<number, HeroConvertSetting>` | 品质 → 转换设置（自动/双倍/进阶） |
| `exerciseCycles` | `Map<string, ICycle>` | uuid hash → 体力恢复周期（编队满体力自动涨经验） |
| `record_map` | `Map<number, number>` | 记录映射（本地存档用） |
| `select_hero_uuid` | `Long` | 当前选中的英雄uuid |
| `reset_time` / `reset_time_index` | `number` | 重置次数/索引 |
| `hero_handbook` | `number[]` | 图鉴收集列表 |
| `pointLevelUpAdditionList` | `number[]` | 等级加成点数（cfg 5002） |
| `auto_return_main_city` | `boolean` | 自动返回主城 |
| `maxHeroLv` | `number` | 英雄最大等级（默认50） |
| `maxHeroActionPoint` | `number` | 最大行动力 |
| `heroActionPointRegionTime` | `number` | 行动力恢复间隔 |
| `resetCounter` | `IHeroResetCounter` | 重置计数器 |

#### 1.2 主要方法

##### 初始化/解析
- `ParseByProto(proto: IUserHeroData)` — 从服务器协议解析所有英雄数据
- `ParseConvertSetting(proto: ISCInitHeroData)` — 解析英雄转换设置

##### 英雄查询
- `GetUserHeroByUuid(uuid: Long): HeroItem` — 通过uuid获取英雄
- `GetUserHeroById(heroId: number): HeroItem` — 通过英雄ID获取（仅第一个匹配）
- `GetHeroByHeroId(heroId: number): HeroItem[]` — 获取该ID的所有英雄
- `GetHeroListByCreateType(createType?: CreateType): HeroItem[]` — 按创建类型过滤
- `GetUserHeroByConfigID(ID: number): HeroItem` — 通过配置ID获取
- `GetUserHeroByQuality(quality, createType?): HeroItem[]` — 按品质获取
- `GetUserHeroBySort(sortType, createType?): HeroItem[]` — 按排序类型获取
- `GetRarityHeroIds(quality: number): number[]` — 获取指定品质的图鉴ID列表
- `GetValidHeroList(createType?: CreateType): HeroItem[]` — 获取有效英雄（非0uuid）

##### 排序
- `SortHeroList(sortType: HeroSortType, createType?, desc?)` — 按指定排序类型排序
- `SortHeroStatusListByHeroItem(heroList)` — 按状态排序（有消耗提示的排后面）
- `SortHeroStatusListByUuid(uuidList)` — 同上，入参为uuid列表

##### 升级/升阶
- `LevelUpHero(uuid, heroId, costHeroUuidList, isDouble?)` — 英雄升级
- `UpGradeHero(uuid, heroId, quality)` — 英雄升阶
- `UpGradeHeroMax(heroId, type)` — 一键升阶到最大
- `UpGradeApotheosized(uuid, heroId)` — 封神（5阶→神将）
- `IsHeroCanUpApotheosized(heroId, quality)` — 判断是否可以封神
- `GetHeroUpgradeStage(heroId, quality)` — 获取英雄升阶状态
- `GetHeroCostConfigList(heroId, targetQuality)` — 获取升阶消耗配置
- `GetMaxCanSkillUpGradeHero(uuid, heroId)` — 获取最大可升技能等级的英雄

##### 重置
- `ResetHero(uuid, heroId)` — 重置英雄
- `CanHeroReset(uuid: Long)` — 检查英雄是否可重置
- `GetResetCostCfg(): IResetCost` — 获取重置消耗配置

##### 特训
- `SpecialTrainingHero(uuid, heroId, costHeroUuidList, isDouble?)` — 特训
- `IsHeroSpecialTrainingByUuid(uuid: Long)` — 判断英雄是否在特训
- `GetHeroSpecialTrainingLevel(uuid: Long)` — 获取特训等级

##### 属性计算
- `GetHeroFinalProp(uuid, heroId): number[]` — 获取英雄最终四维属性 [ad, def, ap, ag]
- `GetHeroWeaponPropAddition(heroInfo): number[]` — 计算武器属性加成
- `GetCfgHeroPropGrowth(heroId: number): number[]` — 获取配置成长属性
- `GetHeroActionPoint(curAP, startRecoverTime, maxAP, recoverTime): number[]` — 计算当前行动力
- `GetFormationTotalProp(team?, cfg?): number[]` — 获取编队总属性

##### 图鉴/红点
- `GetHeroHandBookInfo(heroId: number): { star, heroCount, canUpQuality }` — 图鉴信息
- `GetTotalStarByHeroIdInHandbook(heroId: number)` — 图鉴总星数
- `GetRedPointCount(): number` — 红点计数
- `GetRedDotHandler(): HeroRedBlockType[]` — 红点处理器

##### 其他
- `GetDefaultHeroCfg(): __hero_temp` — 获取默认英雄配置
- `IsHeroInExercise(uuid: Long)` — 判断英雄是否在训练中
- `GetHeroStatusTipByUuid(uuid: Long): string` — 获取英雄状态提示文本
- `CountUpGradeCanToCostNum(heroId, quality): number` — 计算升阶可消耗数量

---

### 2. `HeroItem` 类

#### 2.1 核心数据
| 属性 | 类型 | 说明 |
|------|------|------|
| `config` | `__hero_temp` | 英雄配置表（来自 cfg.hero） |
| `proto_data` | `IHeroData` | 服务器协议数据（包含uuid、等级、品质等） |
| `heroDisplayData` | `IHeroDisplayData` | 皮肤数据 |
| `talentLearnStatus` | `Map<number, number>` | 天赋学习状态 |
| `talentLevelMap` / `talentLevelMapList` | 天赋等级映射 |

#### 2.2 属性 Getter

##### 基础信息
| Getter | 返回 | 说明 |
|--------|------|------|
| `heroLevel` | `number` | 英雄等级 |
| `heroName` | `string` | 英雄名称（带〇等重名标记） |
| `heroNameWithoutSame` | `string` | 英雄名称（不带重名标记） |
| `heroAd / heroDef / heroAp / heroAg` | `number` | 四维属性值 |
| `heroCareer` | `number` | 职业 |
| `heroNameWithLv` | `string` | "名称 Lv.XX" 格式 |
| `heroPower` | `number` | 战力 |
| `heroStrengthen` | `number` | 强化等级 |

##### 属性加成
| Getter | 返回 | 说明 |
|--------|------|------|
| `heroGrowthProp` | `number[]` | 成长四维 [ad, def, ap, ag] |
| `heroBaseProp` | `number[]` | 基础四维（不含装备） |
| `heroERquipProp` | `number[]` | 装备提供的四维属性 |
| `finalProp` | `number[]` | 最终四维（含所有加成） |

##### 状态判断
| Getter | 返回 | 说明 |
|--------|------|------|
| `isHeroGoOut` | `boolean` | 是否出征中 |
| `isOfficer` | `boolean` | 是否是内政官（按英雄名判断） |
| `isOfficerByUuid` | `boolean` | 是否是内政官（按uuid判断） |
| `isHeroUnlockWeaponOnce` | `boolean` | 是否已解锁一次武器 |
| `isHeroSpecialTraining` | `boolean` | 是否特训中 |
| `isHeroCanApotheosized` | `boolean` | 是否可封神（5阶） |
| `IsFullActionPoint` | `boolean` | 行动力是否满 |
| `getHeroStatus` | `HeroStatus` | 英雄状态枚举（出征/内政/编队/演义/空闲） |
| `getHeroRarity` | `number` | 稀有度 |
| `isBattleSimulatorFinished` | `boolean` | 演武是否完成 |
| `isBattleSimulatorLocked` | `boolean` | 演武是否锁定 |

##### UI 显示
| Getter | 返回 | 说明 |
|--------|------|------|
| `heroIcon` | `string` | 英雄图标路径 |
| `heroSpinePath` | `string` | Spine动画路径 |
| `GetHeroCardIcon` / `heroHalfIcon` / `GetHeroSmallIcon` | `string` | 不同尺寸图标 |
| `GetIconFrame` | `string` | 品质头像框 |
| `GetHeroCanReset` | `{ isCanReset, txtTip, txtShow }` | 是否可重置及原因 |
| `GetHeroActionPoint` | `number[]` | 当前/最大行动力 |
| `GetHeroUpGradeStatus` | `HeroQualityStatus` | 升阶状态（普通/满级/可封神/已封神） |
| `HeroLearnAllWeaponCount` | `number` | 已学兵器数量 |
| `HeroLearnAllWeaponLv` | `number` | 已学兵器总等级 |
| `HeroSeason` | `number` | 赛季 |
| `GetEquipProp` | `EquipProp` | 装备属性 |
| `GetEquipPropDecompose` | `number` | 装备分解后属性 |

##### 武器/技能相关 Getter
- `heroWeaponTag / heroWeaponIcon` — 武器标签和图标
- `GetWeaponLevel(weaponIdx)` — 指定武器槽等级
- `GetHeroWeaponByWeaponIdx(weaponIdx)` — 指定武器槽的武器数据
- `GetSkill(skillIdx)` — 获取指定技能
- `skillLv / skillId` — 技能等级/ID

##### 新手/引导相关
- `needShowNewHandGuide` — 是否需要新手引导
- `isCompleteNewHandGuide` — 新手引导是否完成

#### 2.3 主要方法
- `ParseByProto(proto: IHeroData)` — 协议解析
- `GetHeroEnterMapCdTime(mapId)` — 获取地图CD时间
- `IsHeroHasMapCdByMapId(mapId)` — 判断是否有地图CD
- `CheckHeroIsInStoryTeam()` — 是否在演义队伍中

---

### 3. 辅助类型

#### 3.1 枚举
```typescript
enum HeroSortType {
    Level,       // 按等级排序
    Quality,     // 按品质排序
    Rare,        // 按稀有度排序
    Power,       // 按战力排序
    GetTime,     // 按获得时间排序
    Career,      // 按职业排序
    Star,        // 按星级排序
    None,        // 不排序
}

enum HeroStatus {
    None,         // 空闲
    InTeam,       // 在编队中
    InOfficer,    // 委任中（内政官）
    InDispatch,   // 派遣中
    GoOut,        // 出征中
    InStoryTeam,  // 演义队伍中
}

enum HeroCommonStatus {
    None,             // 普通状态
    InDoing,          // 正在进行某种状态
    SameHeroInDoing,  // 同名武将正在进行某种状态
}

enum HeroQualityStatus {
    Common,           // 正常升级状态
    CommonMax,        // 正常升级到满级，不能封神
    CanApotheosized,  // 可封神
    Apotheosized,     // 已封神
}
```

#### 3.2 接口/类
```typescript
interface HeroPreData {
    hero_id: number
    hero_lv: number
    hero_quality: number
    ad: number; def: number; ap: number; ag: number
    weapon_list: WeaponPreData[]
    talent_list: number[]
    special_skill_map: Map<number, number>
    user_display?: net_proto.IHeroDisplayData
    strength: number
    exp: number
}

class HeroConvertSetting {
    quality: number
    auto: boolean      // 自动
    is_double: boolean // 双倍
    advance: boolean   // 进阶
}
```

---

## 业务逻辑总结

### 英雄生命周期
1. **获取** — 通过招募等途径获得，英雄数据由服务器下发
2. **升级** — 消耗同名/万能英雄提升等级（`LevelUpHero`）
3. **升阶** — 消耗同名英雄提升品质（`UpGradeHero`），有自动升阶（`UpGradeHeroMax`）
4. **封神** — 5阶满级后可封神为神将（`UpGradeApotheosized`）
5. **特训** — 消耗英雄进行特殊训练（`SpecialTrainingHero`）
6. **重置** — 重置英雄返还资源（`ResetHero`）

### 属性计算
- `GetHeroFinalProp` 计算最终四维 = 基础 + 成长 × 等级 + 装备 + 天赋 + 编队加成 + 其他
- 属性分为 ad(攻击)、def(防御)、ap(智力)、ag(速度)
- 行动力恢复通过 `GetHeroActionPoint` 计算

### 英雄消耗优先级
- `GetHeroStatusTipByUuid` 返回状态提示，用于排序
  - 已解锁武器的英雄不可消耗
  - 特训中的英雄不可消耗
  - 无提示的英雄可优先作为消耗材料

### 图鉴系统
- `hero_handbook` 记录已收集英雄ID
- `GetHeroHandBookInfo` 提供图鉴详情（星数、可升品质）
- 图鉴激活获得属性加成

---

## 关联模块
- **UserTeam** — 英雄编队，GetTeamByHero 判断英雄是否在队伍中
- **UserInternalAffair** — 内政官系统，委任英雄为内政官
- **UserEquip / UserWeapon / UserSoldier** — 装备、武器、士兵系统，影响英雄属性
- **HeroTalentManager** — 天赋管理器，管理英雄天赋培养
- **Global.UserArena** — 竞技场，判断英雄是否在竞技场编队中