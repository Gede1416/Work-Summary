# 业务流程详解 — 以 MailSystem 为例

MailSystem 是一个典型的中等复杂度业务系统，完整展现了项目的架构模式和开发规范。

---

## 一、整体数据流

```
服务器协议 ──→ MailSystem (System层) ──→ Event ──→ UI Controller ──→ View刷新
                  │                                    ↑
                  └──── 读取/写入 ────→ Model (G.userData.mailContainer)
```

**核心原则**：System 不持有 UI 引用，通过事件驱动 UI 刷新。

---

## 二、文件组织（4层7个文件）

```
Hot/Logic/
├── Event/EventMail.cs              # 事件定义（2个事件类）
├── System/MailSystem/
│   ├── MailSystem.cs               # 核心逻辑（生命周期、本地操作）
│   └── MailSystem_Net.cs           # 网络层（协议注册、请求发送）
├── Model/UserData/ClientMailData.cs # 数据模型（ClientMailContainer + ClientMailData）
└── UI/Mail/
    ├── MailUIController.cs          # 主界面（列表 + 批量操作）
    ├── MailItem.cs                  # 列表项
    └── MailDetailController.cs      # 邮件详情
```

---

## 三、逐层解析

### 第1层：Event — 事件定义 (`EventMail.cs`)

```csharp
// 定义两个事件类，用于解耦 System 和 UI
public class OnMailDataChanged   // 邮件数据变更 → UI刷新列表
{
    public List<ulong> UuidList;    // 变更的邮件uuid列表
}

public class OnMailUnreadChanged  // 未读数量变更 → 主界面红点
{
    public int UnreadCount;
}
```

**设计规范**：
- 事件按功能分文件（EventMail、EventShop、EventHero...）
- 事件名以 `On` 开头
- 事件主要用于触发 UI 刷新

---

### 第2层：Model — 数据模型 (`ClientMailData.cs`)

```csharp
// 客户端邮件容器：字典存储 + 排序/统计/过期
public class ClientMailContainer
{
    public readonly Dictionary<ulong, ClientMailData> MailDict = new();
    public List<ClientMailData> GetSortedList()  // 按时间倒序
    public int GetUnreadCount()
    public List<ulong> RemoveExpired(long nowMs)
    public void ResetFromProtoList(...)
}

// 单封邮件数据：协议数据 + 本地扩展字段
public class ClientMailData
{
    public MailData Proto { get; private set; }  // 服务器协议数据
    public int ValidDays { get; private set; }   // 本地扩展：有效天数
    public bool HasReward  // 是否有附件
    public void ApplyState(bool isRead, bool isReward)
}
```

**设计要点**：
- Model 挂载在 `G.userData` 下全局访问，不通过架构注册
- proto 数据与客户端扩展字段一起封装

---

### 第3层：System — 业务逻辑

#### 3a. 生命周期注册 (`MailSystem.cs`)

```csharp
public partial class MailSystem : IBaseSystem
{
    // OnEnterGameAsync — 注册网络协议监听
    public override async UniTask OnEnterGameAsync()
    {
        DoRegisterNetworkEvent();  // 注册协议回调
    }

    // OnRoleAfterLogin — 登录完成，数据齐全，初始化红点+刷新
    public override void OnRoleAfterLogin()
    {
        EnsureRedPointNodes();       // 创建红点节点
        RefreshUnreadAndNotify(true); // 计算未读数并发送事件
    }

    // OnUpdate — 每帧检查过期邮件
    public override void OnUpdate(E_SystemState systemState)
    {
        if (systemState != E_SystemState.AfterLoginGame) return;
        TickRemoveExpired();  // 10秒检查一次
    }

    // OnBeforeExitGame — 取消网络协议注册
    public override void OnBeforeExitGame()
    {
        DoUnRegisterNetworkEvent();
    }
}
```

**生命周期对照表**：

| 生命周期方法 | 调用时机 | 典型操作 |
|---|---|---|
| `OnEnterGameAsync()` | 进入游戏，热更加载后 | 注册协议监听、事件监听 |
| `OnRoleBeforeLogin()` | 通过账号验证但未收到玩家数据 | 暂不操作 |
| `OnRoleAfterLogin()` | 登录完成，本地数据齐全 | 初始化红点、刷新缓存 |
| `OnUpdate(state)` | 每帧 | 定时检查、Tick 逻辑 |
| `OnRoleAfterLogout()` | 退出 game 服 | 清理缓存状态 |
| `OnBeforeExitGame()` | 退出到热更界面 | 取消协议注册 |
| `OnAfterExitGame()` | 退出后 | 释放资源 |

#### 3b. 网络层 (`MailSystem_Net.cs`)

```csharp
public partial class MailSystem : IBaseSystem
{
    // 1. 注册协议回调（与 OnEnterGameAsync 配对）
    private void DoRegisterNetworkEvent()
    {
        Network.Ins.RegisterMsgHandle("MscInitMailInfo", OnInitMailInfo, this);
        Network.Ins.RegisterMsgHandle("MscSyncMailData", OnSyncMailData, this);
    }

    // 2. 处理服务器推送
    private void OnInitMailInfo(CSMsg msg)  // 全量初始化
    {
        // 覆盖本地数据 → 发送 OnMailDataChanged → 刷新未读计数
    }

    private void OnSyncMailData(CSMsg msg)  // 增量同步（增/改/删）
    {
        // 按 UpdateType 处理 → 发送 OnMailDataChanged → 刷新未读计数
    }

    // 3. 发送请求（由 UI 层调用）
    public void ReqReadMail(List<ulong> uuidList, bool getReward, Action onSuccess)
    public void ReqDeleteMail(List<ulong> uuidList, Action onSuccess)
}
```

**网络层模式**：
- `RegisterMsgHandle` 在 `OnEnterGameAsync` 注册，`UnRegisterMsgHandleByTarget` 在 `OnBeforeExitGame` 取消
- 请求方法命名：`ReqXxx`；回调处理：`OnXxx`
- 先乐观更新本地数据，再发送事件刷新 UI

---

### 第4层：UI — 界面层

#### 4a. 主界面 (`MailUIController.cs`)

```csharp
public partial class MailUIController : UIDialog
{
    void Awake()
    {
        // 按钮绑定
        btnBack.GetComponent<UIButton>().OnClick += (_) => { this.Close(); };

        // ★ 核心：注册事件监听，自动刷新
        this.RegisterEvent<OnMailDataChanged>((_) => { RefreshView(); })
            .UnRegisterWhenGameObjectDestroyed(this);
    }

    // ★ 标准刷新入口
    public override void RefreshView()
    {
        _cachedList = BuildFilteredMailList();       // 从 System 取数据
        int unread = MailSystem.Ins.GetUnreadCount();
        txtUnread.text = $"未读邮件:{unread}";
        _mailListView.SetListItemCount(_cachedList.Count);
        _mailListView.RefreshAllShownItem();
    }

    // 用户操作 → 调用 System 的 Req 方法
    private void OnClickDeleteRead()
    {
        MailSystem.Ins.ReqDeleteMail(del);  // System 处理网络请求
    }
}
```

#### 4b. 列表项 (`MailItem.cs`)

```csharp
public partial class MailItem : MonoBehaviour
{
    public void SetData(ClientMailData data)  // 由列表回调传入数据
    {
        _data = data;
        RefreshView();
    }

    public void RefreshView()  // 根据 _data 更新 UI 状态
    {
        txtMailTitle.text = ...;
        unread.SetActive(!p.IsRead);
        // 根据已读/附件/领奖状态切换底图和图标
    }
}
```

---

## 四、完整业务流程走通

以"玩家打开邮件列表 → 一键领取"为例：

```
1. UI层：打开 MailUIController
   ├── Awake() 注册 OnMailDataChanged 事件
   └── RefreshView() 调用 MailSystem.Ins.GetMailListSorted()

2. 玩家点击"全部领取"
   └── MailUIController.OnClickGetAll()
       └── MailSystem.Ins.ReqReadMail(uuids, getReward: true)

3. System层：MailSystem.ReqReadMail()
   ├── 乐观更新：本地标记 IsRead=true, IsReward=true
   ├── 发送 OnMailDataChanged 事件
   ├── 发送网络请求 → 服务器
   └── 服务器回包 → 回调中展示奖励弹窗

4. UI层响应事件：
   ├── MailUIController 收到 OnMailDataChanged → RefreshView()
   ├── MailItem.RefreshView() 更新底图状态
   └── 红点节点收到 OnMailUnreadChanged → 更新未读数
```

---

## 五、开发规范速查

| 规则 | 说明 |
|------|------|
| System 不持有 UI 引用 | 通过 `this.SendEvent(new XxxEvent{...})` 通知 UI |
| 事件只用于触发 UI 刷新 | 不要在刷新方法里发送事件（会循环） |
| 事件发送时机 | 服务器回包、按钮点击（玩家操作） |
| System 分 partial 文件 | `XxxSystem.cs`(核心) + `XxxSystem_Net.cs`(网络) + `XxxSystem_API.cs`(对外接口) |
| 网络注册/取消成对 | `OnEnterGameAsync` 注册，`OnBeforeExitGame` 取消 |
| 数据全局访问 | Model 挂在 `G.userData` 下，不通过架构注册 |
| UI 继承 UIDialog | 实现 `RefreshView()` 作为标准刷新入口 |
| 列表用 LoopListView2 | `InitListView` + `SetListItemCount` + `RefreshAllShownItem` |
