# AvatarSpineController 详解

> **文件路径**: `Assets/Scripts/Hot/Logic/Characters/AvatarSpineController.cs`
> **命名空间**: `Hot.Logic`
> **基类**: `MonoBehaviour`
> **子类**: `HeroController`（玩家英雄）、`NpcController`（NPC）等
> **依赖**: Spine.Unity (SkeletonAnimation)、UniTask、MapSystem、LogicLoader

---

## 一、概述

`AvatarSpineController` 是游戏中所有 Spine 骨骼动画角色的**基类控制器**，挂载在角色 GameObject 上。它提供了一套通用的角色行为框架：

| 能力 | 说明 |
|------|------|
| **Spine 动画播放** | 管理 idle/attack/move/death/skill 五种动画的状态机切换 |
| **路径移动** | 基于时间的路径点插值移动（A→B→C 平滑移动） |
| **坐标转换** | 世界坐标 ↔ 逻辑格子坐标的自动同步 |
| **朝向控制** | 根据移动方向自动翻转 Spine 骨骼和特效节点的 ScaleX |
| **特效挂点** | 管理释放特效、受击特效、Buff 特效的挂载位置 |
| **随机对话气泡** | 定时随机弹出对话气泡（从配置表读取对话内容） |
| **时间函数注入** | 支持自定义时间获取函数，适配推图加速、后台暂停等场景 |

---

## 二、类定义与字段

### 2.1 Spine 动画配置（Inspector 可配）

```csharp
[SpineAnimation] public string idleAnimation;    // 待机动画名
[SpineAnimation] public string attackAnimation;  // 攻击动画名
[SpineAnimation] public string moveAnimation;    // 移动动画名
[SpineAnimation] public string deathAnimation;   // 死亡动画名
[SpineAnimation] public string skillAnimation;   // 技能动画名
```

- 使用 `[SpineAnimation("idle")]` 特性标记，`idleAnimation` 默认值为 `"idle"`
- 这些字段在 Inspector 中会显示为 Spine 动画下拉选择器
- 核心组件 `SkeletonAnimation` 从子节点 `"spine"` 上获取

### 2.2 战斗相关字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `BattleMapType` | `BattleMapType` | 当前所属地图类型（Jungle=主地图 / Stage=推图关卡） |
| `releaseEffectTrans` | `Transform` | 技能释放特效的挂载点 |
| `hitEffectCenterTrans` | `Transform` | 受击特效中心挂载点 |
| `hitEffectRootTrans` | `Transform` | 受击特效根部挂载点 |
| `BuffEffectDict` | `Dictionary<long, GameObjectPoolItem>` | 已挂载的 Buff 特效字典，Key 为 Buff ID |
| `playingDeathAnimation` | `bool` | 是否正在播放死亡动画 |

### 2.3 路径移动字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `worldPath` | `List<Vector2>` | 当前移动路径的世界坐标点列表 |
| `isMovingAlongPath` | `bool` | 是否正在沿路径移动 |
| `startTime` / `endTime` | `long` | 路径移动的开始/结束时间戳（毫秒） |
| `timePerSegment` | `long` | 每段路径的耗时（毫秒），由总时间 ÷ 段数计算 |
| `UnitMoveTime` | `long` | 单格移动耗时，默认 300ms |
| `TargetPosList` | `Vector2Int[]` | 可选的移动目标位置列表 |
| `OnMoveFinished` | `event Action` | 路径移动完成事件回调 |

### 2.4 位置与朝向

| 字段 | 类型 | 说明 |
|------|------|------|
| `LogicPos` | `Vector2Int` | 当前角色的逻辑格子坐标（自动同步） |
| `birthPosList` | `static List<Vector2Int>` | 预设的出生点列表（战斗演示用） |
| `dispatchPos` | `static Vector2Int` | 预设的派遣位置 (46, 52) |

### 2.5 随机对话

| 字段 | 类型 | 说明 |
|------|------|------|
| `randomDialog` | `bool` | 是否启用随机对话气泡 |
| `dialogInterval` | `int` | 对话间隔上限（秒），默认 30s |
| `dialogTriggerTime` / `dialogLeftTime` | `float` | 对话触发倒计时 / 剩余缓冲时间 |
| `_cachedDialogPrefab` | `static GameObject` | 缓存的气泡预制体 |
| `DialogPrefabPath` | `const string` | 气泡预制体路径 |

---

## 三、核心方法详解

### 3.1 生命周期

```
Awake() → Start() → Update() → OnDestroy()
```

#### Awake() — 初始化

1. 从 `transform.Find("spine")` 获取 `SkeletonAnimation` 组件
2. 若特效挂点不存在，自动创建 `releaseEffect`、`hitEffectCenter`、`hitEffectRoot` 三个空子 GameObject
3. 调用 `TryInitDebug()`（partial 方法，定义在其他文件中）初始化调试用圆形纹理
4. 异步预加载对话气泡预制体 `LoadDialogPrefabAsync()`

#### Update() — 每帧更新

1. 若 `randomDialog == true`，调用 `TryTriggerDialog()` 检测是否该弹对话
2. 调用 `HandlePathMovement()` 处理路径移动插值

### 3.2 动画系统 — `PlayAnimation()`

```csharp
public void PlayAnimation(string animationName, bool loop, bool destroy = true)
```

**动画状态机规则**（按优先级）：

| 优先级 | 规则 | 说明 |
|--------|------|------|
| 1 | 死亡动画播放后不被打断 | `currentAnimation == deathAnimation && destroy` → 直接 return |
| 2 | 循环动画去重 | `animationName == currentAnimation && loop` → 防止每帧重复调用导致卡第一帧 |
| 3 | 技能 > 普攻 | 技能动画播放中，普攻请求被忽略 |
| 4 | 非循环动画播完回 Idle | 通过 `AddAnimation` 排队回到 `idleAnimation` |
| 5 | 死亡动画特殊处理 | 播完后根据 `destroy` 参数决定销毁 GameObject 还是回到 Idle |

**代码流程**：
```
SetAnimation(0, animName, loop)  // 立即播放，中断当前
  ↓ (if !loop)
AddAnimation(0, idleAnimation, true, 0f)  // 排队回 Idle
```

### 3.3 路径移动系统

#### 移动流程

```
MoveToTargetPos(Vector2Int targetPos)
  → 计算当前逻辑坐标 sourcePos
  → logicMap.GetPath() 获取 A* 路径
  → 转换为世界坐标列表
  → MoveAlongPath(posList, stTime, edTime)
    → HandlePathMovement()（每帧 Update 调用）
```

#### MoveAlongPath() — 启动移动

```csharp
public void MoveAlongPath(List<Vector2> worldPath, long startTimeMs, long endTimeMs)
```

- 校验：路径点 ≥ 2，结束时间 > 开始时间
- 计算 `timePerSegment = totalDuration / (pathCount - 1)`
- 设置 `isMovingAlongPath = true`

#### HandlePathMovement() — 每帧插值

```
currentTime = GetCurrentTime()  // 自定义时间源

if currentTime >= endTime:
    → 瞬移到终点 → 播放 Idle → 触发 OnMoveFinished

else:
    → 计算 elapsedTime，确定当前所在路径段 t
    → Vector2.Lerp(startPos, endPos, t) 线性插值
    → 播放 moveAnimation
    → SetLookAtDir(direction) 更新朝向
    → OnTransformPositionChanged() 同步逻辑坐标
```

#### MoveToTargetPos() — A* 寻路移动

1. 根据 `BattleMapType` 选择对应的地图数据（主地图 / 推图地图）
2. 获取角色当前逻辑坐标
3. 调用 `logicMap.GetPath()` 进行 A* 寻路
4. 将逻辑路径转换为世界坐标列表
5. 计算时间：`duration = (pathCount - 1) * UnitMoveTime`
6. 调用 `MoveAlongPath()` 执行移动

#### UnitMove() — 单步移动

```csharp
public void UnitMove(Vector2 sourcePos, Vector2 targetPos, long stTime, long edTime)
```

直接构造两点路径并移动，用于已知起点终点的简单移动场景。

### 3.4 朝向控制 — `SetLookAtDir()`

```csharp
public void SetLookAtDir(Vector2 dir)
```

根据水平方向分量翻转所有视觉元素：

| dir.x | 含义 | Skeleton.ScaleX | 特效 ScaleX |
|-------|------|-----------------|-------------|
| > 0 | 向右 | **-1**（Spine 坐标系取反） | -1 |
| < 0 | 向左 | 1 | 1 |
| = 0 | 不处理 | 保持原样 | 保持原样 |

> **注意**：Spine 的 ScaleX 正负与直觉相反，向右移动时 ScaleX = -1

### 3.5 坐标转换 — `OnTransformPositionChanged()`

每帧移动后自动调用，将世界坐标转换为逻辑格子坐标：

1. 根据 `BattleMapType` 选择地图数据源
2. 调用 `MapSystem.WorldToLogicPos()` 转换
3. 若逻辑坐标变化，更新 `LogicPos` 并调用虚方法 `UpdateDataPosition()`
4. 子类可重写 `UpdateDataPosition()` 同步服务端数据

### 3.6 随机对话气泡 — `TryTriggerDialog()`

```
触发逻辑（每帧检测）：
  首次：dialogTriggerTime = Random(3, dialogInterval)
        dialogLeftTime = dialogInterval - dialogTriggerTime

  dialogTriggerTime 倒计时 → 0：
    → RandomDialog() 弹出气泡
    → 重新随机下次触发时间（带剩余时间补偿，保持平均间隔 ≈ dialogInterval）
```

#### RandomDialog() — 弹出气泡

1. 从缓存预制体实例化 `DialogueBubble`
2. 从配置表 `Cfg.Ins.dialog` 随机取一条对话数据
3. 调用 `bubble.Setup(跟随Transform, 内容, 持续3秒, 偏移(0, 2, 0))`

### 3.7 时间函数注入系统

```csharp
private Func<long> _getTimeFunc = () => TimeMgr.Ins.Now();       // 默认
private Func<long> _getTimeScaleFunc = () => 1;                   // 默认

public void SetGetTimeFunc(Func<long> getTimeFunc, Func<long> getTimeScaleFunc = null)
```

**设计意图**：不同场景需要不同的时间基准

| 场景 | 时间函数 | 说明 |
|------|----------|------|
| 普通 UI/主界面 | `TimeMgr.Ins.Now()` | 考虑了切后台暂停 |
| 推图/关卡 | `StageMapMapTimer.GetRunningTime()` | 考虑了加速（倍速） |
| 默认 | 系统时间 | 不考虑暂停和加速 |

### 3.8 战斗演示辅助

```csharp
public static List<Vector2Int> birthPosList = new() { (43,64), (45,64), (47,62), (43,62), (47,55), (47,63) };
public static Vector2Int dispatchPos = new(46, 52);

public static Vector2Int RandomBirthPos()  // 随机出生点
public void SetRandomTargetPos()           // 随机选择一个巡逻目标并移动
```

---

## 四、继承关系

```
MonoBehaviour
  └── AvatarSpineController          ← 本文件（角色基类）
        ├── HeroController           ← 玩家英雄（行为树、战斗、交易、装备）
        └── NpcController            ← NPC（新增于 2026-06-02）
```

### 子类需关注的扩展点

| 虚方法 | 用途 |
|--------|------|
| `Awake()` | 子类可重写添加初始化逻辑 |
| `Start()` | 子类可重写添加首帧逻辑 |
| `Update()` | 子类可重写添加每帧逻辑（注意调用 base） |
| `UpdateDataPosition()` | 位置变更时同步数据到服务端 / Model |
| `SetGetTimeFunc()` | 注入场景特定的时间函数 |

---

## 五、数据流图

```
┌─────────────────────────────────────────────────────┐
│                   AvatarSpineController              │
│                                                      │
│  Update()                                            │
│    ├─→ TryTriggerDialog() ──→ RandomDialog()         │
│    │     └─→ Instantiate(dialogPrefab)               │
│    │         └─→ bubble.Setup(transform, text, 3s)   │
│    │                                                  │
│    └─→ HandlePathMovement()                          │
│          ├─→ GetCurrentTime()  // 自定义时间源        │
│          ├─→ Vector2.Lerp()    // 线性插值            │
│          ├─→ PlayAnimation(moveAnim, true)           │
│          ├─→ SetLookAtDir(dir)  // 翻转朝向          │
│          └─→ OnTransformPositionChanged()            │
│                ├─→ MapSystem.WorldToLogicPos()       │
│                └─→ UpdateDataPosition()  // 虚方法    │
│                                                      │
│  PlayAnimation(name, loop)                           │
│    ├─→ SetAnimation(0, name, loop)  // 立即播放      │
│    └─→ AddAnimation(0, idle, true)  // 排队回 Idle   │
│                                                      │
│  MoveToTargetPos(targetPos)                          │
│    ├─→ logicMap.GetPath()          // A* 寻路        │
│    └─→ MoveAlongPath(posList, st, ed)                │
└─────────────────────────────────────────────────────┘
```

---

## 六、注意事项

1. **Spine ScaleX 取反**：Spine 坐标系与 Unity 不同，向右移动时 `ScaleX = -1`，向左时 `ScaleX = 1`，同时所有子特效节点也要同步翻转
2. **partial class**：`AvatarSpineController` 是 partial class，部分逻辑（如 `TryInitDebug()`、`DestroyDebug()`）定义在其他文件中
3. **静态预制体缓存**：`_cachedDialogPrefab` 是 static，所有实例共享一个气泡预制体，`_loadingDialogPrefab` 保证只加载一次
4. **时间函数默认值**：如果不调用 `SetGetTimeFunc()`，默认使用 `TimeMgr.Ins.Now()`，在推图场景中需要显式设置
5. **路径移动是时间驱动的**：不是帧驱动，因此帧率波动不影响移动速度。移动位置完全由 `(currentTime - startTime) / totalDuration` 决定
6. **循环动画去重**：连续调用同一循环动画会被忽略，避免每帧设置导致动画卡在第一帧
7. **特效节点自动创建**：如果未手动指定 `releaseEffectTrans` 等挂点，Awake 会自动创建空 GameObject 作为挂点
