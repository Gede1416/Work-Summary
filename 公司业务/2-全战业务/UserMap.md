# UserMap 类文档

## 概述

`UserMap` 管理玩家当前地图状态，包括地图类型、配置ID、UUID、生物群系等。位于 `src/system/role/user_data/UserMap.ts`。

---

## 1. 属性列表

| 属性 | 类型 | 说明 |
|------|------|------|
| `currentMapConfigId` | `number` | 当前地图配置ID（cityMap时，对应 `map_battle` 表ID；世界地图为0） |
| `currentMapUUID` | `Long` | 当前地图UUID |
| `currentMapType` | `net_proto.MapType` | 当前地图类型 |
| `enterTargetMapType` | `net_proto.MapType` | 目标进入的地图类型 |
| `currentBiomeType` | `BiomeType` | 当前生物群系类型 |
| `initTimelineObj` | `CS.UnityEngine.GameObject` | 初始化时间线对象 |
| `guideBossMapId` | `number` | 引导Boss地图ID |
| `guideCityMapId` | `number` | 引导城市地图ID |
| `guideStoryMapId` | `number` | 引导剧情地图ID |
| `farmlandFilterData` | `FarmlandFilterData` | 农田过滤数据 |

---

## 2. 计算属性

| 属性 | 说明 |
|------|------|
| `currentSeasonHugeWorldDataID` | 根据当前赛季（`Global.server_season`）遍历 `cfg.season` 表，获取对应的 `world_map` ID，默认 `101001` |
| `currentSeasonHugeWorldResourceID` | 同上，返回当前赛季的大世界资源ID |
| `mapControllerAwake` | 判断当前场景是否为 `MapController`（通过 `SceneUtil.GetCurrentSceneName()`） |

---

## 3. 核心方法

### 3.1 GetCurrentMapUUID()

返回当前地图的 UUID 对象：
```typescript
{ type: this.currentMapType, uuid: this.currentMapUUID, id: this.currentMapConfigId }
```

### 3.2 GetCurrentMapUUIDReconnect()

重连时获取地图 UUID，当前实现与 `GetCurrentMapUUID()` 相同。

### 3.3 GetWorldBuildingOpenData(worldBuildingId)

获取世界建筑的开启状态和时间。

**参数**：
- `worldBuildingId`：世界建筑ID

**返回值**：
```typescript
{ isOpen: boolean, openTime: number }
```

**逻辑**：
1. 从 `cfg.world_building` 表读取配置
2. 如果 `Config.open_time <= 0`，无需开启时间，直接返回已开启
3. 否则计算开启时间 = 服务器开服时间 + `Config.open_time` 分钟
4. 根据开启时间的小时数进行**时间段对齐**：
   - 12点以前 → 对齐到当天 **12:00**
   - 12:00-15:00 → 对齐到当天 **15:00**
   - 15:00-18:00 → 对齐到当天 **18:00**
   - 18:00-21:00 → 对齐到当天 **21:00**
   - 21:00以后 → 对齐到 **第二天12:00**
5. 比较当前时间与对齐后的目标开放时间，返回是否开启及目标时间

---

## 4. 涉及的枚举与常量

| 枚举/类型 | 来源 | 说明 |
|-----------|------|------|
| `net_proto.MapType` | 网络协议 | 地图类型（世界地图、城市、战场等） |
| `BiomeType` | `MapConstValue` | 生物群系类型 |
| `FarmlandFilterData` | `MapWorldFarmlandData` | 农田筛选数据 |
| `ConstSceneNameInJs` | `ConstValue` | JS侧场景名称常量 |

---

## 5. 依赖的外部模块

| 模块 | 用途 |
|------|------|
| `cfg.season` | 赛季配置表 |
| `cfg.world_building` | 世界建筑配置表 |
| `Global` | 全局单例，访问 `server_season`、`server_open_time` |
| `TimeUtil` | 时间工具（`GetServerMilliSecond`、`GetServerDayStartTime`、`GetDateNumbers`） |