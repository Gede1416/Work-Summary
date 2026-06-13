# JianzhuUILevelupController 建筑升级界面 — 刷新逻辑

> 对应文件：`Assets/Scripts/Hot/Logic/UI/Building/LevelUp/JianzhuUILevelupController.cs`
> Prefab：`prefab/ui/building/common/jianzhuUI_levelup.prefab`

---

## 调用链路

```
Create() → InitView() → RefreshView()
                            ├── RefreshZhenHunBeiMaterialPreviewInfo()
                            ├── RefreshUnlockBuildingText()
                            ├── RefreshLevelupAttribute()
                            └── (内联) 资源消耗刷新 / 进度条刷新
```

- `OnBuildingLevelUpSuccess` 事件回调中也会调用 `RefreshView()` 触发全量刷新。
- `InitView()` 仅执行一次（绑定 UI 控件列表、注册按钮事件），`RefreshView()` 可多次调用。

---

## 一、RefreshView() — 主刷新入口

**前置条件：** `baseBuildingPanel` 不能为 null，否则直接报错返回。

### 1.1 基础信息区

| UI 控件 | 数据来源 | 说明 |
|---------|---------|------|
| `txtCurrentLevel` | `currentBuildingCfg.Level` | 显示 "Lv.X" |
| `iconBuilding` | `currentBuildingCfg.SmallPic` | 异步加载建筑小图 |
| `detail` | `currentBuildingCfg.Desc` | 建筑描述文本 |

### 1.2 满级分支 (isMaxLevel == true)

1. 禁用升级按钮触摸 → `btnLevelUp.SetTouchEnable(false)`
2. 隐藏资源消耗区 → `hideWhenMaxLevel.SetActive(false)`
3. 隐藏升级按钮 → `btnLevelUp.gameObject.SetActive(false)`
4. 显示满级按钮 → `btnLevelMax.SetActive(true)`
5. 调用 `RefreshLevelupAttribute(true)` — 仅展示当前属性，无箭头/下级值
6. **直接 return，跳过后续所有逻辑**

### 1.3 非满级分支

#### 1.3.1 解锁建筑提示（仅 E_101 主建筑）
- `lineUnlock` 默认先关闭
- 调用 `RefreshUnlockBuildingText(nextCfg != null, currentLevel + 1)`
- 详见下方 §三

#### 1.3.2 前置条件检查

```
isMeetRequirePreCondition = (IsBuildingCfgRequirementsMet 返回 -1)
```

**不满足时：**

| 条件类型 | reqType | 显示内容 |
|---------|---------|---------|
| 前置建筑等级 | 1 | "升级条件：<前置建筑名>的等级达到<等级>" |
| 推图关卡进度 | 2 | "升级条件：通过推图关卡<关卡名>" |
| 鬼王未消灭(E_112) | — | "升级条件：<配置文本 900506>" |

- 不满足 → 显示 `requireGroup`，升级按钮置灰+禁用
- 满足 → 隐藏 `requireGroup`，升级按钮可点击+亮色图标

#### 1.3.3 属性变化
- 调用 `RefreshLevelupAttribute(false)` — 详见下方 §二

#### 1.3.4 资源消耗列表
- 数据源：`nextBuildingCfg.CostIdList` / `CostCountList`
- 最多显示 3 项 (`resContainerList[0..2]`)
- 每项设置 `CommonItem` 图标 + 数量文本
- 数量不足时文本标红 `<color=#CB473D>`，充足时绿色 `<color=#6f837a>`
- 超出数量的 slot 隐藏，`resItemIdList[i]` 置 0

#### 1.3.5 阶段属性进度条 (effectGroup)
- 数据源：`BuildingSystem.Ins.GetStageAttributeProgressInfo()`
- 返回 `(-1, _, _)` 或前置条件不满足 → 隐藏 `effectGroup`
- 否则显示进度条和阶段效果文本：
  - `jdtTxt` = "当前/上限"
  - `txtEffectX` = 阶段属性描述（来自该阶段建筑的 `StageAttributeText`）
  - `jdt` 进度条百分比

---

## 二、RefreshLevelupAttribute(isMaxLevel) — 属性变化区

刷新 `levelupContainerList` 中的 5 行属性行。

### 行 1（固定）：等级

```
Lv.当前等级  →  Lv.下一等级
```
满级时隐藏箭头和下一级文本。

### 行 2~5（动态）：配置表效果

数据源：`currentBuildingCfg.EffectTextList` / `EffectInfoList` / `EffectUnitList`

每行：
- `EffectTextList[i]` → 描述文本
- `EffectInfoList[i]` + `EffectUnitList[i]` → 当前值（带单位）
- 下一级同理，使用 `nextBuildingCfg` 对应字段

满级时：隐藏箭头、下一级值置空。
未使用的行：`SetActive(false)`。

**兜底逻辑：** `EffectInfoList` / `EffectUnitList` 长度不足时自动补齐空字符串，防止索引越界。

---

## 三、RefreshUnlockBuildingText() — 新增建筑预览（仅 E_101）

仅在 **主建筑 E_101 升级** 时可能展示。

**判断逻辑：**

遍历 `building` 配置表，筛选同时满足以下条件的建筑行：

1. 类型 ≠ E_101（排除主建筑自身）
2. `cfg.Level == 1`（仅首档代表"新增"）
3. 前置条件中有 `type=1, pre=targetMainCfg.ID`（目标主建筑等级解锁）
4. 下一级可满足升级条件：`IsBuildingCfgRequirementsMet(cfg, mapProgress, targetMainCfg.ID) == -1`
5. 当前等级不可升级：`IsBuildingCfgRequirementsMet(cfg, mapProgress) != -1`

满足条件的建筑名称用逗号拼接，显示在 `txUnlockBuilding`，并激活 `lineUnlock`。

---

## 四、RefreshZhenHunBeiMaterialPreviewInfo() — 镇魂碑材料预览（仅 E_112）

仅在 **建筑类型 E_112（镇魂碑）** 时启用。

| 操作 | 说明 |
|------|------|
| `btnMaterialPreview` 显隐 | E_112 时显示，其他类型隐藏 |
| `zhenHunBeiCurMapBattleId` | 优先取当前建筑配置 `Param1`，回退取 `userData.MapBattleId` |
| `zhenHunBeiNextMapBattleId` | 满级时为 0；非满级取下一级建筑配置 `Param1`，无值则为 0 |

按钮点击 → 打开 `MaterialPreviewUIController` 弹窗，展示当前/下一级地图材料对比。

---

## 五、关键数据源汇总

| 数据 | 来源 |
|------|------|
| 当前建筑配置 | `baseBuildingPanel.GetBuildingConfig()` |
| 下一级建筑配置 | `BuildingSystem.Ins.GetNextBuildingConfigByType(type)` |
| 建筑类型 | `baseBuildingPanel.GetBuildingType()` |
| 是否满级 | `BuildingSystem.Ins.IsMaxLevel(type)` |
| 前置条件检查 | `BuildingSystem.Ins.IsBuildingCfgRequirementsMet(cfg, mapProgress)` |
| 推图进度 | `BuildingSystem.Ins.GetMapProgressForBuildingReq()` |
| 物品数量 | `ItemSystem.Ins.GetItemCount(itemId)` |
| 阶段属性进度 | `BuildingSystem.Ins.GetStageAttributeProgressInfo(type, cfgId)` |
| Boss 存活状态 | `MapSystem.Ins.IsBossDead()`（仅 E_112） |

---

## 六、特殊建筑类型行为

| 建筑类型 | 特殊逻辑 |
|---------|---------|
| **E_101（主建筑）** | 显示"新增可建设建筑"预览行；升级成功后弹出 `BuildingUnlockController` |
| **E_103/E_107/E_108** | 升级成功后检查 Param1~3 变化，弹出 `ForgeBuildingLvUpPopupController`（铁匠铺装备解锁） |
| **E_112（镇魂碑）** | 显示材料预览按钮；升级前检查 BOSS 是否死亡；升级成功后自动关闭界面 |
