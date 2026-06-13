# 功能解锁（function_open 表）

## 概述

主界面和各功能入口通过 `function_open` 表控制功能解锁条件。在满足解锁条件前，根据 `close_type` 决定隐藏入口或置灰+上锁。

## 配置表字段

| 字段 | 说明 |
|------|------|
| `id` | 功能 ID |
| `0_name` | 功能名称 |
| `1_desc` | 功能简介 |
| `page_type` | 功能类型枚举（对齐 `page_jump` 表 page 字段定义） |
| `open_type` | 解锁条件类型：0=无条件，1=前置建筑，2=推图关卡进度，3=主线任务完成xx章 |
| `open_param` | 解锁条件参数 |
| `close_type` | 未解锁显示类型：0=入口不显示，1=置灰+上锁 |
| `2_close_text` | 功能未解锁飘字提示（上锁状态可点击时用） |

## 各 open_type 条件获取方式

### open_type=0：无条件

直接返回已解锁，无需获取任何数据。

### open_type=1：前置建筑

`open_param` 存 building 表配置行 ID。

**获取方式：**

```
1. 用 open_param 读 building 表 → Cfg.Ins.building.get(open_param)
2. 从 building 行取出 Type（建筑类型）和 Level（需求等级）
3. 用建筑类型获取玩家当前建筑 → BuildingSystem.Ins.GetBuildingConfigByType(type)
4. 比较当前建筑 Level >= 需求 Level
```

**关键 API：**
- `Cfg.Ins.building.get(id)` → `CfgGen.building`
- `BuildingSystem.Ins.GetBuildingConfigByType(type)` → `CfgGen.building`（当前等级配置）
- `cfg.Level` → 等级

**参考代码：** `BuildingSystem_Util_cfg.cs:IsCurBuildingLevelRequirementMet()`

### open_type=2：推图关卡进度

`open_param` 存目标 mission ID。

**获取方式：**

```
1. 获取当前进度 mission ID → G.userData?.stageMapData?.StageId
2. 获取目标 mission ID → open_param
3. 分别读 mission 表取 Chapter 和 Stage
4. 比较：当前 Chapter > 目标 Chapter 则通过
         当前 Chapter = 目标 Chapter 且当前 Stage >= 目标 Stage 则通过
         否则未通过
```

**关键 API：**
- `G.userData?.stageMapData?.StageId` → `uint`（当前 mission ID）
- `Cfg.Ins.mission.get(id)` → `CfgGen.mission`
- `cfg.Chapter` / `cfg.Stage` → int

**参考代码：** `BuildingSystem_Ruin.cs:IsMissionProgressReached()`

### open_type=3：主线任务完成xx章

`open_param` 存目标章节 ID（`quest_chapter` 表 id）。

**获取方式：**

```
1. 获取主线数据 → G.userData?.questContainer?.mainQuestData
2. 获取当前章节 ID → mainQuestData.ChapterQuestId
3. 如果当前章节 > 目标章节 → 通过
4. 如果当前章节 < 目标章节 → 未通过
5. 如果当前章节 = 目标章节：
   - 获取章节配置 → mainQuestData.GetCfg()
   - 检查已完成任务数 → mainQuestData.GetRewardQuestCount() >= 章节任务总数
```

**关键 API：**
- `G.userData?.questContainer?.mainQuestData` → `ClientMainQuestData`
- `mainQuestData.ChapterQuestId` → `ulong`
- `mainQuestData.GetCfg()` → `CfgGen.quest_chapter`
- `mainQuestData.GetRewardQuestCount()` → `int`
- `Cfg.Ins.quest_chapter.get(id)` → `CfgGen.quest_chapter`

**参考代码：** `BuildingSystem_Ruin.cs:IsMainQuestChapterCompleted()`

## 代码实现

管理器类：`Assets/Scripts/Hot/Logic/System/FunctionUnlockManager.cs`

```csharp
// 调用方式
var status = FunctionUnlockManager.Ins.GetStatus(functionOpenId);
// status.IsUnlocked → bool
// status.CloseType → 0=隐藏, 1=置灰+上锁
// status.CloseText → 未解锁飘字提示
```
