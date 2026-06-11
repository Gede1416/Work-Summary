# StateMachine 状态机系统详解

## 1. 概述

StateMachine 是项目中 NPC 行为驱动的核心框架，位于 `Assets/Scripts/Hot/Logic/Characters/StateMachine.cs`。它将 NPC 的行为分解为有限个状态，每个状态绑定一个 `IStateMachineBehavior`，通过 `ChangeState()` 切换状态自动触发生命周期回调。

**使用该框架的系统：** `ShowNpcSystem`（`Assets/Scripts/Hot/Logic/System/ShowNpcSystem/`）

---

## 2. 核心类

### 2.1 StateMachine — 状态机引擎

```csharp
// 文件: Assets/Scripts/Hot/Logic/Characters/StateMachine.cs
public class StateMachine
{
    protected Dictionary<int, IStateMachineBehavior> mStateBehaviors; // 状态→行为映射
    public virtual void Init(Dictionary<int, IStateMachineBehavior> behaviors);
    public virtual void ChangeState(StateMachineData data, int newState);
    public void Update(StateMachineData data, float deltaTime);
}
```

| 方法 | 作用 |
|------|------|
| `Init(behaviors)` | 注册状态枚举→行为对象的映射 |
| `ChangeState(data, newState)` | 触发旧状态 `OnExit` → 更新 `data.currentState` → 新状态 `OnEnter`，重置 `stateDuration` |
| `Update(data, deltaTime)` | 累加 `stateDuration`，执行当前状态的 `OnRun` |

### 2.2 IStateMachineBehavior — 状态行为接口

```csharp
public interface IStateMachineBehavior
{
    void OnEnter(StateMachineData data);   // 进入状态时调用一次
    void OnRun(StateMachineData data, float deltaTime);  // 每帧调用
    void OnExit(StateMachineData data);    // 离开状态时调用一次
}
```

每个状态对应一个实现该接口的类，由 StateMachine 自动驱动生命周期。

### 2.3 StateMachineData — 状态数据

```csharp
// 文件: ShowNpcSystem_StateData.cs
public class StateMachineData
{
    public ulong uuid;            // 唯一标识
    public int currentState;      // 当前状态（枚举值）
    public float stateDuration;   // 当前状态已持续时间（秒），由 StateMachine.Update 自动累加
    public NpcStateMachineData npcData;  // NPC 特有数据
}

public class NpcStateMachineData
{
    public float stayTriggerTime;           // 停留触发时间（StayBehavior 判断依据）
    public AvatarSpineController Controller; // 行为控制器（寻路、动画）
    public Action onWalkComplete;           // 行走完成回调
    public Action onStayComplete;           // 停留完成回调
    public StateWalkData walkData;          // 行走目标数据
}

public class StateWalkData
{
    public Vector2Int targetPos;  // 目标逻辑坐标
}
```

---

## 3. 状态枚举与行为

当前 ShowNpcSystem 定义了两个状态：

```csharp
public enum NpcStateMachineState
{
    None = 0,
    Walk,  // 行走 — 驱动寻路移动
    Stay,  // 停留 — 计时等待
}
```

### 3.1 WalkBehavior

```
OnEnter:  设置目标点寻路 + 播放移动动画
OnRun:    检查是否到达目标
          - 还在移动中 → 继续 ManualUpdate
          - 已到达但目标未更新 → 重新寻路（容错）
          - 已到达 → 触发 onWalkComplete 回调
OnExit:   清空 onWalkComplete 回调
```

### 3.2 StayBehavior

```
OnEnter:  播放 idle 动画
OnRun:    检查 stateDuration >= stayTriggerTime
          - 未到时间 → 等待
          - 已到时间 → 触发 onStayComplete 回调
OnExit:   清空 onStayComplete 回调
```

---

## 4. ShowNpcSystem 架构

ShowNpcSystem 通过 `partial class` 拆分为 4 个文件：

| 文件 | 职责 |
|------|------|
| `ShowNpcSystem.cs` | 单例、生命周期（OnEnterGameAsync 初始化、OnUpdate 驱动 UpdateStateMachine） |
| `ShowNpcSystem_Mgr.cs` | 状态机管理：InitMgr、AddNpcData、RemoveNpcData、ChangeNpcState、CreateNpc |
| `ShowNpcSystem_Behavior.cs` | WalkBehavior 和 StayBehavior 的实现 |
| `ShowNpcSystem_Chain.cs` | 高层行为链：MoveToAsync、StayAsync、RunCarNpcChainAsync 等 |
| `ShowNpcSystem_StateData.cs` | 数据类定义 |

### 4.1 数据流

```
ShowNpcSystem
  ├── stateMachine: StateMachine              // 状态机引擎（单例）
  │     └── mStateBehaviors: Dict<int, IStateMachineBehavior>
  │           ├── Walk → WalkBehavior
  │           └── Stay → StayBehavior
  └── dataMap: Map<ulong, StateMachineData>   // 所有活跃 NPC 的数据
        ├── uuid_1 → StateMachineData
        ├── uuid_2 → StateMachineData
        └── ...
```

### 4.2 每帧驱动

```csharp
// ShowNpcSystem.OnUpdate() 每帧调用
public void UpdateStateMachine()
{
    foreach (var data in dataMap.Values.ToList())
    {
        stateMachine.Update(data, Time.deltaTime); // 累加 duration + 执行 OnRun
    }
}
```

### 4.3 异步行为链

通过 `UniTaskCompletionSource` + Action 回调，将状态机驱动的离散状态封装为可 await 的异步操作：

```csharp
// MoveToAsync: 设置目标 → 切换 Walk 状态 → 等待 onWalkComplete 回调
public async UniTask MoveToAsync(ulong npcUuid, StateWalkData targetWalkData)
{
    var tcs = new UniTaskCompletionSource();
    data.npcData.onWalkComplete += () => tcs.TrySetResult();
    SetNpcMoveData(npcUuid, targetWalkData);
    ChangeNpcState(npcUuid, (int)NpcStateMachineState.Walk);
    await tcs.Task;
}

// StayAsync: 设置停留时长 → 切换 Stay 状态 → 等待 onStayComplete 回调
public async UniTask StayAsync(ulong npcUuid, float duration)
{
    var tcs = new UniTaskCompletionSource();
    data.npcData.stayTriggerTime = duration;
    data.npcData.onStayComplete += () => tcs.TrySetResult();
    ChangeNpcState(npcUuid, (int)NpcStateMachineState.Stay);
    await tcs.Task;
}
```

### 4.4 完整行为链示例

```csharp
// 小推车 NPC 行为链：走到pos1 → 停2秒 → 走到pos2 → 停1秒 → 销毁
public async UniTask RunCarNpcChainAsync(AvatarSpineController controller,
    StateWalkData pos1, StateWalkData pos2, Action actStay, Action actEnd)
{
    var stateData = AddNpcData();
    stateData.npcData.Controller = controller;

    try
    {
        await MoveToAsync(stateData.uuid, pos1);
        await StayAsync(stateData.uuid, 2.0f);
        actStay?.Invoke();
        await MoveToAsync(stateData.uuid, pos2);
        await StayAsync(stateData.uuid, 1.0f);
        actEnd?.Invoke();
    }
    finally
    {
        RemoveNpcData(stateData.uuid);
        Object.Destroy(controller.gameObject);
    }
}
```

---

## 5. 对比：NpcController vs StateMachine

项目中存在两种 NPC 状态管理方式：

| 维度 | NpcController | ShowNpcSystem + StateMachine |
|------|---------------|------------------------------|
| 实现方式 | 手动 switch-case 枚举 | IStateMachineBehavior 接口 + ChangeState |
| 状态定义 | `NpcState` 枚举（5 个状态） | `NpcStateMachineState` 枚举（2 个状态） |
| 驱动方式 | MonoBehaviour.Update 内 switch | System.OnUpdate → StateMachine.Update |
| 数据管理 | 字段直接存于 Controller | 集中存于 StateMachineData |
| 复用性 | 状态逻辑耦合在 Controller 中 | 每个状态独立为 Behavior 类，可独立测试 |
| 异步支持 | 无 | UniTask + 回调封装的 MoveToAsync/StayAsync |
| 适用场景 | 简单固定的行为序列 | 需要灵活组合、可复用的行为 |

---

## 6. 如何基于 StateMachine 新建系统

参考 ShowNpcSystem 的模式，按以下步骤：

1. **定义状态枚举** — 确定系统的所有状态（如 `Walk`、`Stay`、`Interact` 等）
2. **扩展 StateMachineData** — 在 `StateMachineData` 或子类中添加系统特有的数据字段
3. **实现 IStateMachineBehavior** — 每个状态一个类，实现 `OnEnter/OnRun/OnExit`
4. **创建 System（partial class）**：
   - `_Mgr.cs` — Init 注册 behavior 映射，管理 dataMap 的增删
   - `_Behavior.cs` — 所有 Behavior 类实现
   - `_Chain.cs` — 高层异步行为链（可选）
5. **在 LogicApp 中注册 System**，在 `OnUpdate` 中调用 `stateMachine.Update`
6. **通过 `ChangeState(data, newState)` 驱动状态切换**

---

## 7. 关键文件索引

| 文件路径 | 说明 |
|----------|------|
| `Assets/Scripts/Hot/Logic/Characters/StateMachine.cs` | 状态机引擎 |
| `Assets/Scripts/Hot/Logic/System/ShowNpcSystem/ShowNpcSystem.cs` | ShowNpcSystem 主体 |
| `Assets/Scripts/Hot/Logic/System/ShowNpcSystem/ShowNpcSystem_StateData.cs` | 状态数据定义 |
| `Assets/Scripts/Hot/Logic/System/ShowNpcSystem/ShowNpcSystem_Mgr.cs` | 状态机管理 |
| `Assets/Scripts/Hot/Logic/System/ShowNpcSystem/ShowNpcSystem_Behavior.cs` | 行为实现 |
| `Assets/Scripts/Hot/Logic/System/ShowNpcSystem/ShowNpcSystem_Chain.cs` | 异步行为链 |
| `Assets/Scripts/Hot/Logic/Characters/NpcController.cs` | 旧版手写状态机（对比参考） |
