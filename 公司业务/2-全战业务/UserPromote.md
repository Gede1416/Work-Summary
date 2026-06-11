# UserPromote - 战力提升/晋升目标系统

## 概述

`UserPromote` 管理玩家的**野外晋升目标系统**与**战力提升建议系统**。其中晋升目标系统负责从玩家的自定义地图数据中读取队伍配置的晋升目标（农田/野怪），持续追踪目标完成进度（兵力、英雄等级、兵器数量、兵器等级）；战力提升建议系统则在战败后分析最新战报，从建筑升级、武将提升、编队优化、兵种搭配四个维度给出提升建议，并通过红点系统提示玩家。

---

## 1. 枚举定义

### 1.1 PromoteMapType

| 值 | 数值 | 说明 |
|----|------|------|
| `Monster` | 0 | 野怪晋升目标 |
| `Farmland` | 1 | 农田晋升目标 |

---

## 2. ServerRecordTeamPromoteInfo 内部类

用于记录从 `custom_data_map` 中解析出的晋升目标信息。

| 属性 | 类型 | 说明 |
|------|------|------|
| `uuid` | `Long` | 队伍UUID |
| `pveMapUUID` | `Long` | PVE地图UUID |
| `time` | `Long` | 时间戳 |
| `objectType` | `net_proto.MapObjectType` | 地图对象类型（`MOT_Farmland` 或其他） |
| `configId` | `number` | 配置ID |

---

## 3. UserPromote 主类

### 3.1 属性列表

| 属性 | 类型 | 说明 |
|------|------|------|
| `promoteTargetType` | `PromoteMapType` | 当前晋升目标类型 |
| `promoteTargetConfigId` | `number` | 当前晋升目标配置ID |
| `promoteTeamUUIDList` | `Long[]` | 参与晋升的队伍UUID列表 |
| `defeatMapUUID` | `Long` | 需要击败的地图UUID |
| `soldierCount` | `number` | 目标要求的总兵力 |
| `weaponCount` | `number` | 目标要求的兵器总数 |
| `weaponLv` | `number` | 目标要求的兵器平均等级 |
| `heroLevel` | `number` | 目标要求的英雄最低等级 |
| `battleFieldName` | `string` | 目标战场名称 |
| `battlePowerUpData` | `object` | 战力提升建议数据（见下方子表） |

**battlePowerUpData 结构：**

| 子属性 | 类型 | 说明 |
|--------|------|------|
| `building_effects` | `boolean` | 主城府能否继续升级 |
| `hero_effects` | `boolean` | 武将是否有提升空间 |
| `team_effects` | `boolean` | 编队能否优化 |
| `type_effects` | `boolean` | 兵种搭配是否需要优化 |
| `count_effects` | `number` | 四项建议中可提升项总数 |

### 3.2 计算属性

| 属性 | 返回类型 | 说明 |
|------|---------|------|
| `CanPromote` | `number` | 战力提升建议中可提升项的数量（即 `count_effects`） |
| `HavePromoteTarget` | `boolean` | 是否存在有效的晋升目标（`promoteTargetType != null` 且 `promoteTargetConfigId` 有效且 `promoteTeamUUIDList` 不为空） |
| `PromoteTargetFinish` | `private boolean` | 晋升目标是否全部达标：兵力、英雄最低等级、兵器数量、兵器平均等级均达到要求 |

### 3.3 生命周期方法

#### Init()

初始化晋升目标系统：

1. 调用 `ReadCustomMapInfo()` 从自定义地图数据读取当前晋升目标
2. 注册以下触发器监听事件，事件触发时检查目标是否完成：
   - `on_team_data_update` — 队伍数据更新
   - `on_team_data_update_soldier_num` — 队伍兵力更新
   - `on_hero_data_update` — 英雄数据更新
   - `on_weapon_update` — 兵器更新
   - `on_sync_custom_map` — 自定义地图数据同步（检查 keys 中是否有数字键，有则重新读取并触发 `on_promote_target_update`）

#### DeInit()

调用 `TriggerMgr.RemoveTriggerByTarget(this)` 移除所有与该实例关联的触发器。

### 3.4 晋升目标管理

#### ReadCustomMapInfo()

从 `Global.UserTeam.GetTeamsByCreateType()` 遍历所有队伍，读取 `Role.Ins.userData.custom_data_map[teamUUID]` 中的字符串并解析为 `ServerRecordTeamPromoteInfo`。

**解析格式：** `pvemap.uuid | mapobjecttype | configId | 时间戳`

**逻辑流程：**
1. 若无有效队伍信息，调用 `Reset()` 重置
2. 按时间戳降序找到最近的队伍目标作为 `lastTeamInfo`
3. 将所有与 `lastTeamInfo.pveMapUUID` 相同的队伍UUID加入 `promoteTeamUUIDList`
4. 根据 `objectType` 判定目标类型（`MOT_Farmland` → `PromoteMapType.Farmland`，否则 → `PromoteMapType.Monster`）
5. 获取配置并补齐队伍至 `min(config.limit_force, 5)` 个
6. 排序 UUID，设置 `promoteTargetConfigId`、`defeatMapUUID`
7. 调用 `RefreshTargetInfo()` 刷新目标数值，调用 `CheckPromoteTargetFinish()` 检查是否已完成

#### CheckPromoteTargetFinish()

检查晋升目标是否完成：

1. 若无有效晋升目标，直接返回
2. 检查 `PromoteTargetFinish`：
   - 兵力 >= `soldierCount`
   - 英雄最低等级 >= `heroLevel`
   - 兵器数量 >= `weaponCount`
   - 兵器平均等级 >= `weaponLv`
3. 若全部达标，调用 `Reset()` 重置，清除所有队伍的 custom_data_map，触发 `on_promote_target_update` 事件

#### IgnorePromoteTarget()

忽略当前晋升目标：

1. 检查是否有有效晋升目标，无则返回
2. 调用 `Reset()` 重置
3. 清除所有队伍的 `custom_data_map`
4. 触发 `on_promote_target_update` 事件

#### Reset()

重置所有晋升目标相关数据：

- `promoteTargetType` → `null`
- `promoteTargetConfigId` → `0`
- `promoteTeamUUIDList` → 空数组
- `battleFieldName` → `""`
- `soldierCount`, `weaponCount`, `weaponLv`, `heroLevel` → `0`

#### RefreshTargetInfo()

根据 `promoteTargetType` 从配置表中读取目标数值：

| 目标类型 | 数据来源 | 字段映射 |
|---------|---------|---------|
| `Farmland` | `cfg.world_resource_point.get(configId)` | `recommend[0]*recommend[1]` → 兵力；`recommend[2]` → 兵器数；`recommend[3]` → 兵器等级；`recommend[4]` → 英雄等级；`cfg.npc_battle.get(npc_battle_list[0]).battlemap_name` → 战场名 |
| `Monster` | `cfg.world_npc.get(configId)` | 同上结构 |

### 3.5 数据统计查询

| 方法 | 返回 | 说明 |
|------|------|------|
| `GetSoldierNum(teamUUIDs?)` | `number` | 获取指定队伍列表的总兵力。未传参时使用 `promoteTeamUUIDList`。遍历队伍累加 `team.teamData.soldier_num` |
| `GetHeroMinLevel(teamUUIDs?)` | `number` | 获取指定队伍列表中英雄的最低等级。未传参时使用 `promoteTeamUUIDList`。遍历所有英雄取最小 `proto_data.level` |
| `GetWeaponNum(teamUUIDs?)` | `number` | 获取指定队伍列表中所有英雄已学习兵器总数（`HeroLearnAllWeaponCount` 求和） |
| `GetWeaponAverageLevel(teamUUIDs?)` | `number` | 获取指定队伍列表中兵器平均等级（`HeroLearnAllWeaponLv` 总和 ÷ `HeroLearnAllWeaponCount` 总和，`Math.ceil` 取整） |

### 3.6 战力提升建议

该部分原为 `LastBattleReport.GetBattlePowerUpData`，后迁移至 `UserPromote` 中。

#### RefreshBattlePowerUp()

异步刷新战力提升建议数据：

**逻辑流程：**
1. 从 `Global.UserBattleReport.battleReports` 中取 `createTime` 最大的最新战报
2. 若无战报，调用 `ClearBattlePowerUpRed()` 清空建议
3. 请求战报的团队统计数据 `GetTeamGroupStatistics`
4. 若无统计数据，清空建议
5. 若战斗胜利（`detail.me.result == BattleReportResult_Win`），清空建议（战败才提示）
6. 分别区分己方队伍（`!is_custom_hero`）和敌方队伍（`is_custom_hero`）
7. 依次计算四项建议：
   - `GetBuildingEffects()` — 主城府能否继续升级
   - `GetHeroEffects(customTeam, enemyTeam, mapConfigId)` — 武将能否提升
   - `GetTeamEffects(customTeam)` — 编队能否提升
   - `GetTypeEffects(customTeam)` — 兵种搭配能否优化
8. 通过 `BattlePowerUpRedController.RefreshAll()` 刷新红点
9. 计算 `count_effects` 并触发 `on_promote_target_update` 事件

#### ClearBattlePowerUpRed()

清空所有战力提升建议状态并刷新红点：

- 将所有 `_effects` 字段设为 `false`
- `count_effects` 设为 `0`
- 调用 `BattlePowerUpRedController.RefreshAll()`
- 触发 `on_promote_target_update` 事件

#### GetBuildingEffects(): `boolean`

检查主城府（`PIABuildingType.mainCastle`）能否继续升级。

**条件：** 调用 `Global.UserInternalAffair.CanUpgradeBuilding()`，返回 `canUpgrade` 字段。

#### GetHeroEffects(customTeam, enemyTeam, mapConfigId): `boolean`

检查武将能否提升：

| 条件 | 说明 |
|------|------|
| 平均等级低于敌方 | 己方平均等级 < 敌方平均等级 |
| 平均等级低于地图等级 | 己方平均等级 < `cfg.npc_battle.get(mapConfigId).map_lv` |
| 有闲置更高品质武将 | 闲置武将（`team_uuid == Long.ZERO`）中最高品质 > 已配置武将中最低品质 |

任一条件满足则返回 `true`。

#### GetTeamEffects(customTeam): `boolean`

检查编队能否优化：

| 条件 | 说明 |
|------|------|
| 武将未满 | 当前出战武将数 < 已解锁位置数（`UserTeam.getUnlockedTeamPositions()`） |
| 带兵未满 | 遍历队伍，实际兵力（`injured + dead + left`）< 最大兵力 |
| 更高品质角色可替换 | 全部武将的最高品质 > 当前出战武将的最高品质 |

任一条件满足则返回 `true`。

#### GetTypeEffects(customTeam): `boolean`

检查兵种搭配能否优化：

- 统计己方各兵种数量
- 若同一兵种人数 **>= 7**，则判定为兵种过于单一，返回 `true`

---

## 4. 业务逻辑总结

### 4.1 晋升目标读取流程

```
custom_data_map[teamUUID] 中存储格式: "pvemapUUID | objectType | configId | timestamp"
    ↓
解析为 ServerRecordTeamPromoteInfo
    ↓
按 timestamp 找到最近的目标作为 lastTeamInfo
    ↓
筛选所有同 pveMapUUID 的队伍加入 promoteTeamUUIDList
    ↓
判断目标类型 (Farmland / Monster)
    ↓
补齐队伍至 min(limit_force, 5) 个
    ↓
RefreshTargetInfo() 读取配置表目标数值
    ↓
CheckPromoteTargetFinish() 判断是否已完成
```

### 4.2 目标达成判定

晋升目标完成需要同时满足四项条件：
1. 队伍总兵力 >= 目标要求兵力
2. 队伍中英雄最低等级 >= 目标要求等级
3. 队伍中已学习兵器总数 >= 目标要求兵器数
4. 队伍中兵器平均等级 >= 目标要求兵器平均等级

### 4.3 战力提升建议触发流程

```
战斗结束 → 最新战报到达
    ↓
取 createTime 最大的战报
    ↓
请求团队统计数据
    ↓
判断战斗结果
    ├─ 胜利 → 清空建议（无提示）
    └─ 败北 → 四项检测
        ├─ GetBuildingEffects()   — 主城府是否可升级
        ├─ GetHeroEffects()       — 武将平均等级是否低于敌方/是否有闲置高质量武将
        ├─ GetTeamEffects()       — 编队武将/兵力/品质是否可优化
        └─ GetTypeEffects()       — 兵种是否过于单一
            ↓
BattlePowerUpRedController.RefreshAll() 刷新红点
    ↓
TriggerMgr.Trigger(on_promote_target_update)
```

### 4.4 触发器监听机制

`Init()` 中注册的监听确保以下几种情况会自动重新检查晋升目标完成状态：

| 事件 | 触发时机 |
|------|---------|
| `on_team_data_update` | 队伍数据更新 |
| `on_team_data_update_soldier_num` | 队伍兵力变化 |
| `on_hero_data_update` | 英雄数据更新（升级等） |
| `on_weapon_update` | 兵器数据更新 |
| `on_sync_custom_map` | 自定义地图数据同步（玩家手动设置新目标） |

---

## 5. 关联模块

| 模块 | 用途 |
|------|------|
| `Global.UserTeam` | 获取队伍列表、按UUID查询队伍、计算队伍兵力上限/编队位置等 |
| `Global.UserBattleReport` | 获取战报列表和团队统计数据 |
| `Global.UserHero` | 获取全部英雄列表，检查英雄品质、等级等 |
| `Global.UserInternalAffair` | 检查主城府升级可行性 |
| `Role.Ins.userData.custom_data_map` | 读取/写入自定义地图数据，持久化晋升目标状态 |
| `BattlePowerUpRedController` | 刷新战力提升建议红点 |
| `TriggerMgr` / `E_TriggerType` | 事件系统，监听数据变化触发检查 |
| `cfg.npc_battle` | 野外战斗配置（战场名、推荐等级、兵力限制等） |
| `cfg.world_resource_point` | 世界资源点配置（农田推荐兵力/兵器/等级等） |
| `cfg.world_npc` | 世界野怪NPC配置（野怪推荐兵力/兵器/等级等） |
| `net_proto.BattleReportResult` | 战报结果枚举（Win/Defeat） |