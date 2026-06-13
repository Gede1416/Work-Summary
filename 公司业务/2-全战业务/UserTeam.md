# UserTeam 类文档

## 概述

`UserTeam` 管理玩家的队伍系统，包括单体队伍（`UserTeamItem`）、队伍组（`UserTeamGroupItem`）、士兵数据（`SoldierItem`），负责队伍的编组、派遣、士气、兵力计算、编队推荐等功能。位于 `src/system/role/user_data/UserTeam.ts`。

---

## 1. 枚举定义

### 1.1 TeamBattleStatus

| 值 | 数值 | 说明 |
|----|------|------|
| `un_auto` | -1 | 非自动战斗 |
| `auto_normal` | 0 | 正常自动（委托） |
| `auto_alert` | 1 | 警戒 |

### 1.2 TeamSaveSoldierReason

| 值 | 说明 |
|----|------|
| `Can` | 可补兵 |
| `None` | 没队伍 |
| `OutGo` | 外出 |
| `Max` | 兵力满了 |
| `NoUsefulSoldier` | 没有可用的兵 |
| `Appointment` | 预约中 |
| `NOMainHero` | 没有主将 |

### 1.3 UserTeamDispatchState（队伍派遣状态枚举）

定义在 `ConstValue.ts`：

| 状态 | 说明 |
|------|------|
| `None` | 未编队/未派遣 |
| `Idle` | 闲置（在主城待命） |
| `Move` | 移动中 |
| `Battle` | 战斗中 |
| `Recall` | 召回中 |
| `QuickRecall` | 快速召回 |
| `Defeated` | 战败 |
| `Retreat` | 撤退 |
| `Defense_Inside` | 城内驻防 |
| `Defense_Outside` | 城外驻防 |
| `Defense_PrisonVan` | 押送囚车 |
| `Assemble` | 集结 |
| `Queue` | 排队/列队 |
| `CombatReadiness` | 战备状态 |

---

## 2. UserTeam 类

### 2.1 属性列表

| 属性 | 类型 | 说明 |
|------|------|------|
| `teamList` | `UserTeamItem[]` | 所有队伍列表（含演义队伍） |
| `teamGroupList` | `UserTeamGroupItem[]` | 队伍组列表 |
| `soldierList` | `SoldierItem[]` | 驻地士兵列表 |
| `storyTeam` | `UserTeamItem` | 演义（剧情）队伍 |
| `teamGroupArrivedCueList` | `TeamGroupArriveCueData[]` | 队伍组到达提示数据 |
| `selectTeamUUIDList` | `Long[]` | 选中的队伍UUID列表 |
| `selectOtherTeamUUIDList` | `string[]` | 选中的其它单位UUID列表 |
| `castingManualSkill` | `boolean` | 是否正在施放手动技能 |
| `commonSpeed` | `number` | 普通速度（配置1310） |
| `customSpeed` | `number` | 自定义速度（配置5154） |
| `teamNumInTeamGroup` | `number` | 每个队伍组的队伍数量，固定 **9** |
| `maxTeamGroupNum` | `number` | 最大队伍组数量，固定 **4** |
| `morale_cost_list` | `{min_blocks, max_blocks, cost}[]` | 士气消耗分段列表 |
| `user_team_ui_selected_team_uuid` | `Long` | 主界面选中队伍UUID |
| `assist_siege_engine_team_uuid` | `Long` | 协助攻城器械队伍UUID |

### 2.2 计算属性

| 属性 | 返回类型 | 说明 |
|------|---------|------|
| `isSelectGroup` | `boolean` | 当前是否选中组，固定返回 `false` |
| `SelectTeamUUIDList` | `Long[]` | 选中的队伍UUID列表（军团时为军团队伍UUID） |
| `SelectOtherTeamUUIDList` | `string[]` | 选中的其他单位UUID列表 |
| `teamGroupNum` | `number` | 队伍组数量 |
| `TeamGroupUnlockCount` | `number` | 可解锁队伍组数量（赛季+配置） |
| `GetTeamCurMaxCost` | `number` | 当前队伍最大统御值 |
| `FormationTeamUnlock` | `number` | 编队解锁属性值 |
| `IsPlayerHasTeamInBattle` | `boolean` | 是否有队伍在战斗中（非世界地图） |

### 2.3 核心方法

#### 数据初始化

| 方法 | 说明 |
|------|------|
| `ParseByProto(proto)` | 从网络协议解析队伍数据，构建 `teamList`、`teamGroupList`、`soldierList`、初始化士气消耗列表并触发事件 |

#### 队伍查询

| 方法 | 说明 |
|------|------|
| `GetInCurrentMapTeams()` | 获取当前地图的所有队伍 |
| `GetInCurrentMapTeam(index)` | 按序号获取当前地图队伍 |
| `GetInTargetMapTeamList(map_uuid)` | 获取指定地图的**普通创建类型**队伍列表 |
| `GetInTargetMapTeam(map_uuid, index)` | 获取指定地图按序号的队伍 |
| `GetTeamByUUID(uuid)` | 按UUID查找队伍 |
| `GetTeamGroup(uuid)` | 按UUID查找队伍组 |
| `GetTeamByUuidAndCreateType(uuid, type)` | 按UUID和创建类型查找队伍 |
| `GetTeamIdxByUUID(uuid)` | 获取队伍在 `teamList` 中的索引 |
| `GetTeamGroupIdxByUUID(uuid)` | 获取队伍组在 `teamGroupList` 中的索引 |
| `GetTeamByHero(hero_uuid)` | 根据英雄UUID获取队伍 |
| `GetTeamIndex(team_uuid, type?)` | 获取队伍在指定类型列表中的序号，无则返回 9999 |
| `GetSoldierIndex(soldierNum)` | 获取士兵在 `soldierList` 中的索引 |
| `GetSoldierById(id)` | 按ID获取士兵数据 |
| `GetTeamsByCreateType(type)` | 按创建类型过滤队伍列表 |
| `GetTeamUUIDList(type)` | 获取指定创建类型的队伍UUID列表 |
| `GetAllUserTeams()` | 获取所有已配置英雄的用户队伍（排除 Guild 无主城情况） |

#### 选中操作

| 方法 | 说明 |
|------|------|
| `GetSelectedTeams()` | 获取当前选中的所有队伍 |
| `FilterSelectedTeamUUIDList(filter)` | 过滤选中的队伍UUID列表 |
| `GetAliveTeams()` | 获取所有存活队伍 |
| `CheckTeamSelected(team_uuid)` | 检查队伍是否被选中 |
| `AddOrDeleteTeamUUIDSelected(uuid, only_add)` | 添加/移除选中队伍，**触发 `on_select_team_update` 事件** |
| `DeselectAllTeam()` | 取消所有队伍选中 |
| `AddOrDeleteOtherTeamUUIDSelected(uuid)` | 添加/移除其他单位选中 |

#### 状态判断

| 方法 | 说明 |
|------|------|
| `JudgeTeamCanEnterCiterBattle()` | 判断是否有队伍可进入城市战斗 |
| `isHasOtherTeamInSameMap(uuid, mapUuid)` | 同地图是否有其他队伍 |
| `isHasOtherNoAutoBattleTeamInSameMap(uuid, mapUuid)` | 同地图是否有其他非自动战斗队伍 |
| `CheckHeroInTeam(hero)` | 检查英雄是否在队列中，返回位置索引（-1未配置） |
| `CheckSameHeroInTeam(hero, type?)` | 检测同名英雄是否已在队列中 |
| `CheckSameHeroInTeamExclusive(hero, type?)` | 检测同名英雄是否在队列中（排除自身） |
| `GetHeroTeamIndex(hero)` | 根据英雄获取队伍序号 |
| `GetTeamIsInCurrentMapNum()` | 获取当前地图的队伍数量 |
| `SetSoldierNumById(id, num)` | 设置士兵数量并触发更新事件 |
| `GetTeamSaveMaxNumByTeamUuid(team_uuid, leftNum)` | 计算队伍最大可补充兵力及原因 |

#### 兵力计算

| 方法 | 说明 |
|------|------|
| `GetCurrentSoldierCanUseNum()` | 当前可分配兵力（战场地图取城市战斗预备兵，否则取内政预备兵） |
| `GetCurrentSoldierInTeamNum()` | 队伍中已占用的兵力总和 |
| `GetCurrentSoldierAllCount()` | 可分配兵力 + 队伍中兵力 |
| `GetCurrentSoldierTypeGarrisonBySoldierType(type)` | 驻地某兵种兵力 |
| `GetCurrentSoldierTypeInTeamBySoldierType(type)` | 编队中某兵种兵力 |
| `CountTeamSoldierNumByHeroUuidList(heroList, isTeam?)` | 根据英雄UUID列表计算队伍兵力上限（英雄等级 × 5001 + 品质加成 + 编队上限加成） |
| `CountTeamSoldierNumByHeroBriefDataList(list)` | 根据简要英雄数据计算兵力上限 |
| `CountTeamPreSoldierNumByHeroList(heroList)` | 计算预备兵上限（已废弃，始终返回0） |
| `CountTeamSoldierNumByTeamUUid(teamUUID)` | 根据队伍UUID计算兵力上限 |

#### 统御值与兵种适性

| 方法 | 说明 |
|------|------|
| `GetTeamCostByHeroList(heroList)` | 根据英雄UUID列表计算统御值总和 |
| `GetTeamCostByHeroBriefDataList(list)` | 根据简要英雄数据计算统御值总和 |
| `GetTeamSoldierKindAdaptByHeroUUIDList(list, kind)` | 统计英雄列表中对某兵种适性匹配的个数 |
| `GetTeamSoldierKindAdaptByHeroList(list, kind)` | 同上，使用 `HeroItem[]` 输入 |
| `GetTeamSoldierKindAdaptByHeroViewData(list, kind)` | 同上，使用 `HeroViewData[]` 输入 |
| `GetTeamSoldierKindAdaptByHeroBriefDataList(list, kind)` | 同上，使用 `IHeroBriefData[]` 输入 |

#### 队伍属性计算

| 方法 | 说明 |
|------|------|
| `GetTeamPropByHeroListID(heroList, soldier_career, soldierID)` | 计算队伍综合属性（含兵种适性、特技加成、装备属性、兵种基础属性） |
| `GetTeamPropByHeroViewData(heroList, soldier_career, soldierID)` | 同上，使用 `HeroViewData[]` 输入 |

#### 士气系统

| 方法 | 说明 |
|------|------|
| `GetMoraleDefaultTypeStringByMoraleValue(morale)` | 根据士气值获取默认状态显示字符串 |
| `GetMoraleStatePropertyByMoraleValue(morale)` | 根据士气值获取所处的状态区间属性 |
| `GetMoraleDescByMoraleValue(morale)` | 根据士气值获取士气描述（伤害/治疗效果影响） |

#### 编队推荐

| 方法 | 说明 |
|------|------|
| `GetRecommendSubHeroIdList(final_soldier_kind, recommend_hero_id_list)` | 根据兵种和候选列表推荐副将（考虑统御值上限，冲突武将去重） |
| `GetRecommendWeaponIdListByHeroItemList(canUseHeroList, weaponGroupIds, canUseHeroIds)` | 推荐武器列表（排除冲突、检测拥有状态、检测同名法宝） |
| `ConstructRecommendApplyFakeTeamData(isAllowMainNull, heroIds, weaponGroupIds, heroGroupIds?)` | 构建推荐阵容的假队伍数据（返回 `UserTeamItem` + 武器推荐列表） |
| `ConstructRecommendNearestGoldenTargetTeamData(isAllowMainNull, heroGroupIds, weaponGroupIds)` | 为金色武将构建最近似的推荐阵容（放宽拥有要求，逐级降级） |
| `GetBackupFinalSubHeroIdListBySoldierKindListAndHeroIdList(soldierKinds, mainHeroId, firstSubList, secondSubList, targetGroupIds)` | 计算后备副将方案（按兵种类型遍历匹配） |

#### 其他

| 方法 | 说明 |
|------|------|
| `isTeamGroupToTargetFarmland(targetUuid)` | 判断是否有队伍组前往目标农田 |
| `isTeamGroupToTargetByTargetMessage(targetUuid, targetType)` | 判断是否有队伍组前往目标 |
| `GetMoraleCostConfig()` | 通过配置ID 8002~8004初始化士气消耗分段数据 |
| `SetBuildingInfo(buildings)` | 解析建筑信息（已废弃，原用于内政建造队列同步） |
| `AddOrUpdateBuilding(type, data)` | 添加或更新建造信息 |
| `static getDefaultTeamUnlockCount()` | 获取默认队伍解锁数量（配置10600） |
| `static getUnlockedTeamPositions()` | 获取所有解锁的位置索引列表 |

---

## 3. UserTeamItem 类（单体队伍）

### 3.1 属性列表

| 属性 | 类型 | 说明 |
|------|------|------|
| `teamData` | `net_proto.ITeamData` | 队伍网络协议数据（核心数据源） |
| `overrideHeadIconByCustomHero` | `boolean` | 是否用自定义武将替换头像 |
| `lastUpdateManaTime` | `number` | 上次恢复法力时间戳 |
| `isCameraFollowTarget` | `boolean` | 摄像机是否跟随 |
| `showBattleStatus` | `boolean` | 是否显示战斗状态 |
| `manaRecoverSchedule` | `ScheduleItem` | 法力恢复定时器（已废弃） |
| `model_apply_temp_hero_list` | `HeroItem[]` | 模版应用临时英雄列表 |
| `hero_recommend_id_list` | `number[]` | 英雄攻略推荐预览ID列表 |

### 3.2 计算属性

| 属性 | 说明 |
|------|------|
| `teamUUID` | 队伍UUID（`teamData.uuid`） |
| `userUUID` | 所属玩家UUID（`teamData.user_uuid`） |
| `teamGroup` | 所属队伍组（通过 `teamGroupList` 查找包含自身UUID的组） |
| `hero` | 队伍主将（通过 `hero_uuid` 在 `UserHero` 中查找） |
| `hero_list` | 队伍所有英雄列表（当前只返回主将） |
| `AutoBattle` | 是否自动战斗（`auto_battle_type != -1`） |
| `IsBattling` | 是否在战斗中（攻城器械时检查器械状态） |
| `teamAutoStatus` | 自动战斗状态 |
| `IsOutCity` | 是否出城（委托给队伍组判断） |
| `maxSoldierNum` | 队伍最大兵力（通过主将计算） |
| `soldierId` | 兵种ID（通过 `UserSoldier.GetSoldierDataByHeroUUID` 获取） |
| `IsInTeleport` | 是否在传送中（委托给队伍组判断） |
| `IsManaRecovering` | 是否正在恢复法力 |
| `HasBattleTarget` | 是否有战斗目标 |
| `getGroupTeamUuid` | 获取组队UUID对象 `{user_uuid, team_uuid}` |
| `BattleMapCoord` | 战场坐标 |
| `IsRushing` | 是否冲锋中 |
| `IsInCurrentMap` | 是否在当前地图 |
| `IsInWorldMap` | 是否在世界地图 |
| `isHasOtherTeamInSameMap` | 同地图是否有其他队伍 |
| `multi_kill_count` | 连杀数 |
| `ConfigId` | 兵种配置ID |
| `IsInTeamExpAddition` | 编队是否额外加经验（编队中满体力英雄） |
| `IsNoneState` | 是否无状态 |
| `IsIdleState` | 是否闲置状态 |
| `isGoOut` | 是否已派遣出城 |
| `DispatchState` | 派遣状态 |
| `MoraleDesc` | 士气描述文本 |
| `MoralLimit` | 士气限制 `{min, default_num, max}` |
| `LocationMapUUID` | 所在位置地图UUID |
| `LocationMapName` | 所在位置地图名称 |
| `HugeWorldCoordinates` | 大世界坐标 |
| `Coordinates` | 当前坐标（大世界或战场） |
| `MapUuid` | 当前地图UUID |
| `IsAlive` | 是否存活（`soldier_num > 0`） |
| `Walkable` | 是否可移动（存活且在当前地图） |
| `GetTeamLimit` | 队伍限制 `{soldierLimit, preSoldierLimit}` |

### 3.3 核心方法

| 方法 | 说明 |
|------|------|
| `ParseTeamData(proto)` | 解析队伍协议数据，处理状态重置、设置回调 |
| `ToMapUnitUUIDString()` | 转换为地图单位UUID字符串 |
| `ToUUIDString()` | 转换为哈希字符串 |
| `OnDelete()` | 清理定时器 |
| `GetMoraleChange(end_coord)` | 计算移动到目标时的士气变化（新区块扣士气） |
| `GetMoraleLineNum(distance, map_size)` | 根据距离计算士气衰减值（分段累乘） |
| `GetTeamTimePathFindingByTargetPfAgent(target, offset, actionType, ...)` | 获取路径规划时间（委托给队伍组） |
| `getTeamGroupStatusToFarmlandByTargetMessage(targetUuid, targetType)` | 获取队伍组与目标农田的状态（委托给队伍组） |

---

## 4. UserTeamGroupItem 类（队伍组）

### 4.1 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `teamGroupData` | `net_proto.ITeamGroup` | 队伍组网络协议数据 |

### 4.2 计算属性

| 属性 | 说明 |
|------|------|
| `TeamgroupIndex` | 队伍组在 `teamGroupList` 中的索引 |
| `DefaultTeamGroupUnlockCount` | 默认解锁队伍组数（配置10600第一个值） |
| `TeamGroupUnlockCount` | 实际可解锁队伍组数（赛季+默认） |
| `LocationMapUUID` | 队伍组所在位置地图UUID（遍历所有队伍判断） |
| `DefaultTeamUnlockCount` | 默认每个队伍组的队伍解锁数量 |
| `IsUnlocked` | 该队伍组是否已解锁 |
| `UnlockedTeamPositions` | 该队伍组中解锁的位置索引列表 |
| `UnlockedTeamCount` | 解锁位置数量 |
| `IsEmpty` | 是否为空（所有队伍均无英雄） |
| `FirstTeamData` | 第一个有英雄的队伍数据 |
| `IsOutCity` | 是否出城（不在主城或防御状态） |
| `HugeWorldCoordinates` | 大世界坐标 |
| `WorldMapUuid` | 世界地图UUID |
| `userUUID` | 队伍组所属玩家UUID |
| `TotalCurrentSoldierNum` | 所有队伍当前兵力总和 |
| `TotalMaxSoldierNum` | 所有队伍最大兵力总和 |
| `TotalSoldierNumInBattle` | 所有队伍战斗中兵力总和 |

### 4.3 核心方法

| 方法 | 说明 |
|------|------|
| `ParseTeamGroupData(proto)` | 解析队伍组协议数据，保留原有 `auto_replenish` 设置 |
| `GetDispatchState()` | 获取队伍组派遣状态（判断逻辑见下方状态机） |
| `IsInWorldMap()` | 是否在世界地图（检查所有队伍是否在战场地图） |
| `GetTeamTimePathFindingByTargetPfAgent(...)` | 根据PFAgent计算路径时间（考虑加速效果） |
| `ToMapTeamGroupUUIDString()` | 转换为地图单位UUID字符串 |
| `getTeamGroupStatusToFarmlandByTargetMessage(targetUuid, targetType)` | 检查是否前往目标农田 |
| `getWorkingFarmlandAction()` | 获取当前工作的农田动作类型 |
| `IsTeamPositionUnlocked(positionIndex)` | 检查该队伍组中指定位置是否解锁 |

### 4.4 GetDispatchState 状态机

```
UserTeamGroupItem.GetDispatchState() 逻辑流程：

1. 无数据或为空 → None
2. 无主城（俘虏） → None
3. 队伍组有队伍在撤退 → Retreat
4. 战败:
   - 加速撤回中 → QuickRecall
   - 否则 → Defeated
5. 正在召回主城:
   - 加速中 → QuickRecall
   - 否则 → Recall
6. 在世界地图:
   - 移动中:
     - 囚车/补给车 → Assemble
     - 否则 → Move
   - 停止:
     - 防御/哨塔/囚车 → Defense_PrisonVan / Defense_Inside / Defense_Outside
     - 集结战斗 → Defense_Outside
     - 空闲状态 → Idle
     - 补给车 → Queue
7. 在战场地图:
   - 有队伍战斗中 → Battle
   - 否则 → CombatReadiness
```

---

## 5. SoldierItem 类

| 属性 | 类型 | 说明 |
|------|------|------|
| `proto_data` | `net_proto.ISoldier` | 士兵协议数据 |
| `cfg` | `__soldier_temp` | 士兵配置数据 |

| 方法 | 说明 |
|------|------|
| `ParseByProto(proto)` | 解析士兵协议数据，加载配置 |

---

## 6. TeamGroupArriveCueData 类

| 属性 | 类型 | 说明 |
|------|------|------|
| `team_group_uuid` | `Long \| null` | 队伍组UUID |
| `msg` | `net_proto.IMLString \| null` | 提示消息 |
| `pos` | `net_proto.IVec2Int \| null` | 位置 |
| `isStation` | `boolean` | 是否驻留 |

---

## 7. DisPatchTeamData 类

| 属性 | 类型 | 说明 |
|------|------|------|
| `type` | `MapUnitType` | 地图单位类型 |
| `UserTeamData` | `UserTeamItem?` | 队伍数据 |

---

## 8. 外部依赖与事件

### 8.1 依赖模块

| 模块 | 用途 |
|------|------|
| `Global` | 全局单例，访问 `UserHero`、`UserInternalAffair`、`UserMap`、`UserGuild`、`UserCityBattle` 等 |
| `cfg.property` | 属性配置表（队伍速度、士气、兵种适性等） |
| `cfg.soldier` | 士兵配置表 |
| `cfg.hero` | 英雄配置表 |
| `cfg.world_building` | 世界建筑配置表 |
| `MapAPI` | 地图API（单位选取、路径寻路等） |
| `HugeWorldTerrainData` | 大世界地形数据 |
| `CellCoordinates` | 坐标工具类 |
| `MapTeamData` | 队伍地图数据 |
| `TimeUtil` | 时间工具 |
| `util` | 通用工具 |

### 8.2 触发的事件

| 事件 | 触发时机 |
|------|---------|
| `on_soldier_num_update` | 士兵数量更新时 |
| `on_select_team_update` | 选中队伍变化时 |
| `on_team_data_update_mana` | 法力值更新时（已废弃） |

---

## 9. 配置表引用

| 配置ID | 用途 | 默认值 |
|--------|------|--------|
| 1310 | 普通队伍速度 | - |
| 5154 | 自定义队伍速度 | - |
| 8000 | 默认士气值 | - |
| 8001 | 最大士气值 | - |
| 8002-8004 | 士气消耗分段（块数/消耗比） | - |
| 8006 | 士气状态区间分段 | - |
| 8007-8012 | 各区间状态属性（伤害/治疗效果百分比） | - |
| 5001 | 英雄等级 · 兵量基数 | - |
| 5006 | 预备兵基数（已废弃） | - |
| 10600 | 编队解锁数量配置（[0]:队伍组数, [1]:每队伍组队伍数） | - |
| 1403 | 兵种适性加成系数 | - |