# 挖矿系统 (MiniGame / 古墓探险) 架构

## 分层架构

```
策划案
  ↓
Proto 协议层 (NetProto)          ← Req / Rsp / Push 消息定义
  ↓
Data Container 层                ← 包装 Proto，getter + Reset
  ↓
System 层 (MiniGameSystem)       ← partial class，按职责拆分文件
  ↓
UI Controller 层                 ← UIDialog / UIView，绑定 prefab
  ↓
UI Item 层 (MonoBehaviour)       ← 列表项 / 网格子项
```

---

## 文件职责地图

### 1. Proto 协议
| 消息 | 方向 | 用途 |
|------|------|------|
| `MscInitMiniGameInfo` | S→C Push | 登录初始化，携带 UserMiniGameData.GameList |
| `MscSyncMiniGameData` | S→C Push | 增量同步，GameList 中增量字段 |
| `CSSelectMiningGroupReq/Rsp` | C→S | 选择/切换矿区 |
| `CSDigCellReq/Rsp` | C→S | 挖掘指定索引的格子 |
| `CSMiningAdReq/Rsp` | C→S | 观看广告获得挖掘次数 |
| `CSUseMiningPickReq/Rsp` | C→S | 使用矿镐道具获得次数 |
| `CSMiningRecoverReq/Rsp` | C→S | 请求恢复挖掘次数 |
| `CSMiningRankReq/Rsp` | C→S | 拉取探险大赛排行榜 |

关键 Proto 结构：`MiningGameData` (Group/DigRemCount/NextRecoverTime/AdCount/CurIndex/OpenedCellList)、`MiningCellData` (Index/Id)、`MiningRankItem` (Rank/UserUuid/Name/AvatarId/AvatarFrameId/Score)

### 2. Data Container（数据容器）
**文件：** `Assets/Scripts/Hot/Logic/Model/UserData/ClientMiningData.cs`

| 类 | 属性 | 方法 |
|----|------|------|
| `ClientMiningContainer` | Group / DigRemCount / NextRecoverTime / AdCount / CurIndex / ProtoData | UpdateFromProto() / Reset() / GetCellDataList() |
| `ClientMiningRankContainer` | RankList / MyRank | UpdateFromRsp() / Reset() |

存储位置：`G.userData.miningContainer` / `G.userData.miningRankContainer`

### 3. System 层 (MiniGameSystem partial class)
| 文件 | 职责 |
|------|------|
| `MiniGameSystem.cs` | 单例、生命周期、Update 定时器（30s 排行刷新、恢复倒计时） |
| `MiniGameSystem_Req.cs` | 6 个 ReqXxx 网络请求方法 |
| `MiniGameSystem_Res.cs` | Push 注册/反注册、InitMiniGameInfo/SyncMiniGameData 解析、dispatch → 容器 → SendEvent |
| `MiniGameSystem_Util.cs` | 配置读取、网格逻辑、挖掘次数计算、排行奖励 |
| `MiniGameSystem_Test.cs` | **仅测试数据**：TestMiningStage 枚举、CycleTestStage()、GetTestCellData() |

### 4. UI Controller 层
| 文件 | 基类 | 职责 |
|------|------|------|
| `MiningExploreController.cs` | UIDialog | 主挖矿网格界面，8×8 格子渲染、选中/挖掘状态 |
| `MineCountController.cs` | UIDialog | 挖掘次数展示、恢复倒计时、次数来源列表 |
| `MiningRuleController.cs` | UIView | 规则说明（空壳） |
| `RankRewardUI.cs` | UIDialog | 排名奖励列表（LoopListView） |
| `StrengthenCompetitionRankDialog.cs` | UIDialog | 探险大赛排行榜（LoopListView + 我的排名） |

### 5. UI Item 层
| 文件 | 基类 | 职责 |
|------|------|------|
| `MiningExploreItem.cs` | MonoBehaviour | 矿区格子，4 种状态，点击 → 选中 或 发 ReqDigCell |
| `MineCountItem.cs` | MonoBehaviour | 次数获取来源条目（广告/矿镐），MineCountData 数据类驱动 |
| `MiningRankItem.cs` | UIView | 排行榜条目：名次/头像/昵称/分数 |
| `RankRewardItem.cs` | UIView | 排名奖励条目：区间 + 内嵌奖励列表 |

---

## 核心数据流

### 服务端推送 → UI 刷新

```
Server Push (MscSyncMiniGameData / MscInitMiniGameInfo)
  → MiniGameSystem.Res 中注册的回调
    → TryApplyMiningGameData(miniGameData)
      → G.userData.miningContainer.UpdateFromProto(miningData)
      → this.SendEvent(new OnMiningDataChanged())        // Event/EventActivity.cs
        → UI Controller: RegisterEvent<OnMiningDataChanged>(_ => RefreshView())
          → MiniGameSystem.Ins.GetMiningCellData()        // 容器数据 or fallback 测试数据
          → MiniGameSystem.Ins.GetPlayerIndex()
          → MiniGameSystem.Ins.CanDigIndex()
          → RefreshItem() → 逐个 MiningExploreItem.Refresh(state)
```

### 用户操作 → 请求

```
点击格子: MiningExploreItem.OnClick()
  → Selected 状态 → MiniGameSystem.Ins.ReqDigCell(index) → 服务端 → Push → 刷新
  → Empty 状态   → TryToSelect(index) → CanDigIndex() 检查 → selectIndex = index → RefreshView

点击次数补充: MineCountData.OnClick()
  → 广告 → MiniGameSystem.Ins.ReqMiningAd()
  → 矿镐 → MiniGameSystem.Ins.ReqUseMiningPick(itemId, count)

Update 循环:
  → 每 30s → ReqMiningRank() → OnMiningRankRsp → rankContainer.UpdateFromRsp()
  → 恢复倒计时到达 → ReqMiningRecover()
```

---

## 关键代码模式

### System 单例
```csharp
public partial class MiniGameSystem : IBaseSystem
{
    private static MiniGameSystem _instance;
    public static MiniGameSystem Ins
    {
        get { _instance ??= new MiniGameSystem(); return _instance; }
    }
    public static MiniGameSystem NewInstance()
    {
        if (_instance != null) _instance.Dispose();
        return _instance = new MiniGameSystem();
    }
}
```

### UI Controller 模板
```csharp
public partial class XxxController : UIDialog
{
    void Awake()
    {
        RegisterButton();
        this.RegisterEvent<OnXxxChanged>(_ => { RefreshView(); })
            .UnRegisterWhenGameObjectDestroyed(this);
    }

    private void RegisterButton()
    {
        this.btnClose.ClearBinds();
        this.btnClose.OnClick += (_) => Close();
        // ... 其他按钮同理：ClearBinds → OnClick +=
    }

    public override void RefreshView() { /* 从 System 取数据，刷新子 Item */ }

    public static async UniTask<XxxController> Create(AsyncContext context)
    {
        var ret = await CreateInternal<XxxController>(context, assetPath);
        if (ret == null) return null;
        ret.RefreshView();
        return ret;
    }
}
```

### UI Item 模板
```csharp
public partial class XxxItem : MonoBehaviour
{
    private XxxData _data;
    public void SetData(XxxData data) { _data = data; RefreshView(); }
    public void RefreshView() { /* 根据 _data 刷新显示 */ }
}
```

### Data Container 模板
```csharp
public class ClientXxxContainer
{
    public XxxProtoData ProtoData { get; private set; }
    public int SomeProp => ProtoData?.SomeProp ?? 0;
    public void Reset() { ProtoData = null; }
    public void UpdateFromProto(XxxProtoData data) { ProtoData = data; }
}
```

### 事件定义
```csharp
// Event/EventActivity.cs
public class OnXxxChanged { }
```

### Debug 按钮注册
```csharp
// DebugDialogController.cs Start() 中
btnDatas.Add(new BtnData()
{
    name = "功能名_行为描述",
    onClick = () => { /* ... */ }
});
```

---

## 测试基础设施

| 场景 | 玩家位置 | 说明 |
|------|---------|------|
| `Initial` | -1 | 未开始，第一行全可挖 |
| `FirstRowPartial` | 1 | 第一行左侧挖了 3 格 |
| `FirstRowRight` | 4 | 第一行右侧挖了 4 格 |
| `SecondRowMid` | 10 | 向下挖到第二行 |
| `LShape` | 18 | L 型路径到第三行（默认） |
| `TopRightEdge` | 7 | 右上角边缘，只有左/下可挖 |
| `DeepMiddle` | 36 | 纵向深挖到第五行 |

切换方式：
- `MiniGameSystem.TestStage = TestMiningStage.Xxx` 直接设置
- `MiniGameSystem.CycleTestStage()` 循环切换并返回场景名
- Debug 按钮：`挖矿测试_切换场景并打开` / `挖矿测试_仅切换场景`

`GetPlayerIndex()` 在无真实数据时自动 fallback 到 `GetTestPlayerIndex(TestStage)`
