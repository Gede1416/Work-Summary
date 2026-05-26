# LoopListView2 使用文档

## 概述

`LoopListView2` 是项目使用的无限循环滚动列表组件，来自 `SuperScrollView` 插件（路径：`Assets/Libs/SuperScrollView/Scripts/ListView/LoopListView2.cs`）。通过对象池复用 Item，支持大量数据的高性能滚动。

命名空间：`SuperScrollView`

---

## 1. 获取组件引用

### 方式一：Designer 自动绑定（推荐）

在 `.Designer.cs` 中通过 `[SerializeField]` 声明，由 PrefabBinder 工具自动生成绑定代码：

```csharp
[SerializeField] private LoopListView2 scrollContent;
```

### 方式二：运行时查找

```csharp
_mailListView = this.GetComponentInChildren<LoopListView2>(true);
```

---

## 2. 初始化列表

### 基本初始化

`InitListView` **只能调用一次**。通常在 `Awake()` 或 `Start()` 中调用：

```csharp
// 参数1: itemTotalCount - 总Item数量
// 参数2: onGetItemByIndex - 创建/复用Item的回调
scrollContent.InitListView(itemCount, OnGetItemByIndex);
```

### 带参数初始化

使用 `LoopListViewInitParam` 定制滚动行为：

```csharp
var param = LoopListViewInitParam.CopyDefaultInitParam();
param.mDistanceForNew0 = 0;        // 视口下方预创建距离
param.mDistanceForNew1 = 0;        // 视口上方预创建距离
param.mDistanceForRecycle0 = 0.1f; // 视口下方回收距离
param.mDistanceForRecycle1 = 0.1f; // 视口上方回收距离
scrollContent.InitListView(itemCount, OnGetItemByIndex, param);
```

### LoopListViewInitParam 参数说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `mDistanceForRecycle0` | 300 | 超出视口下方多少距离后回收Item |
| `mDistanceForNew0` | 200 | 视口下方提前多少距离创建Item |
| `mDistanceForRecycle1` | 300 | 超出视口上方多少距离后回收Item |
| `mDistanceForNew1` | 200 | 视口上方提前多少距离创建Item |
| `mSmoothDumpRate` | 0.3 | 滚动惯性阻尼系数 |
| `mSnapFinishThreshold` | 0.01 | Snap吸附结束阈值 |
| `mSnapVecThreshold` | 145 | Snap吸附速度阈值 |
| `mItemDefaultWithPaddingSize` | 100 | Item默认尺寸（含padding） |

**注意**：`mDistanceForRecycle0` 必须大于 `mDistanceForNew0`，`mDistanceForRecycle1` 必须大于 `mDistanceForNew1`。

---

## 3. OnGetItemByIndex 回调（核心）

这是列表最重要的回调，决定如何创建和更新每个 Item。该回调在 Item 进入视口时被调用。

### 标准模式

```csharp
LoopListViewItem2 OnGetItemByIndex(LoopListView2 listView, int index)
{
    if (index < 0 || index >= dataList.Count)
        return null;

    // 1. 从对象池获取或创建Item
    LoopListViewItem2 item = listView.NewListViewItem("ItemPrefab");

    // 2. 获取Item上的业务脚本
    var itemScript = item.GetComponent<ItemController>();

    // 3. 首次创建时初始化（添加事件监听等一次性操作）
    if (!item.IsInitHandlerCalled)
    {
        item.IsInitHandlerCalled = true;
        itemScript.Init();
    }

    // 4. 填充数据
    itemScript.SetItemData(index, dataList[index]);

    return item;
}
```

### 多 Prefab 模式（根据数据类型选择不同Prefab）

```csharp
LoopListViewItem2 OnGetItemByIndex(LoopListView2 listView, int index)
{
    var data = dataList[index];

    LoopListViewItem2 item;
    switch (data.State)
    {
        case ItemState.Ready:
            item = listView.NewListViewItem("ItemPrefab_ready");
            break;
        case ItemState.Unlocked:
            item = listView.NewListViewItem("ItemPrefab_unlock");
            break;
        case ItemState.Ing:
            item = listView.NewListViewItem("ItemPrefab_ing");
            break;
        default:
            return null;
    }

    var itemScript = item.GetComponent<ItemController>();
    itemScript.SetItemData(index, data);
    return item;
}
```

### 消息列表模式（左右气泡 / 时间戳等不同类型）

```csharp
LoopListViewItem2 OnGetItemByIndex(LoopListView2 listView, int index)
{
    var (kind, data) = messages[index];

    LoopListViewItem2 item;
    if (kind == MessageKind.TimeTip)
    {
        item = listView.NewListViewItem("PrefabTime");
    }
    else if (kind == MessageKind.ChatContent)
    {
        if (data.FromUuid == G.userData.GameUuid)
            item = listView.NewListViewItem("PrefabRight");  // 自己的消息
        else
            item = listView.NewListViewItem("PrefabLeft");   // 他人的消息
    }
    // ...后续处理
}
```

---

## 4. 刷新列表数据

### 核心刷新流程

```csharp
// 1. 更新Item总数
scrollContent.SetListItemCount(dataList.Count);
// 2. 强制刷新所有可见Item
scrollContent.RefreshAllShownItem();
```

### SetListItemCount 参数

```csharp
// resetPos: true = 重置到开头, false = 保持当前位置
scrollContent.SetListItemCount(count, resetPos: false);
```

### 不刷新数量仅刷新内容

数据变更但数量不变时，可以直接调用：

```csharp
scrollContent.RefreshAllShownItem();
```

### 刷新单个 Item

```csharp
scrollContent.RefreshItemByItemIndex(itemIndex);
```

### 遍历所有可见 Item

```csharp
scrollContent.DoActionForEachShownItem((item, param) =>
{
    var script = item.GetComponent<MyItem>();
    script.RefreshSomePart();
}, null);
```

---

## 5. 滚动控制

### 滚动到指定位置

```csharp
// 立即滚动到第 index 个 Item，offset 为偏移量
// offset 范围：-viewPortSize ~ +viewPortSize
scrollContent.MovePanelToItemIndex(index, offset);

// 带动画滚动（duration 秒内平滑移动）
scrollContent.MovePanelToItemIndex(index, offset, duration: 0.3f);

// 强制立即滚动并触发 Snap
scrollContent.MovePanelToItemIndexImmediately(index, offset);
```

### 按偏移量滚动

```csharp
scrollContent.MovePanelByOffset(deltaOffset);
```

### 获取当前可见区域信息

```csharp
// 获取第一个可见Item的Index和偏移
ItemPosStruct pos = scrollContent.GetFirstShownItemIndexAndOffset();
// pos.mItemIndex - 第一个可见Item的索引
// pos.mItemOffset - 第一个可见Item的偏移量

// 获取浮点Index（如 3.25 表示第3个Item的25%在视口外）
float floatIndex = scrollContent.GetFirstShownFloatItemIndexInViewPort();
```

---

## 6. 查找可见 Item

```csharp
// 按数据Index查找
LoopListViewItem2 item = scrollContent.GetShownItemByItemIndex(index);

// 按ItemId查找（自定义ID）
LoopListViewItem2 item = scrollContent.GetShownItemByItemId(itemId);

// 按可见列表中的位置查找（0 ~ ShownItemCount-1）
LoopListViewItem2 item = scrollContent.GetShownItemByIndex(i);

// 可见Item数量
int count = scrollContent.ShownItemCount;
// 直接访问可见Item列表
foreach (var shownItem in scrollContent.ItemList) { ... }
```

---

## 7. Item 尺寸动态变化

当 Item 的内容在运行时改变导致尺寸变化时，需要通知列表重新布局：

```csharp
scrollContent.OnItemSizeChanged(itemIndex);
```

配合 `LayoutRebuilder` 强制重建布局（聊天等文本可变场景）：

```csharp
LayoutRebuilder.ForceRebuildLayoutImmediate(item.CachedRectTransform);
```

---

## 8. Snap 吸附功能

```csharp
// 启用Snap吸附
scrollContent.ItemSnapEnable = true;

// Snap结束回调
scrollContent.mOnSnapItemFinished = (listView, item) => { ... };

// 最近吸附项变化回调
scrollContent.mOnSnapNearestChanged = (listView, item) => { ... };

// 立即完成当前Snap
scrollContent.FinishSnapImmediately();
```

---

## 9. 滚动条控制

```csharp
// 是否支持滚动条
scrollContent.SupportScrollBar = true;

// 监听 ScrollRect 的 onValueChanged（如聊天未读消息跟踪）
scrollContent.ScrollRect.onValueChanged.AddListener(ratio =>
{
    // ratio 为归一化滚动位置 (0~1)
});
```

---

## 10. 拖拽事件

```csharp
scrollContent.mOnBeginDragAction = () => { /* 开始拖拽 */ };
scrollContent.mOnDragingAction = () => { /* 拖拽中 */ };
scrollContent.mOnEndDragAction = () => { /* 拖拽结束 */ };
```

---

## 11. LoopListViewItem2 常用属性

| 属性 | 说明 |
|------|------|
| `ItemIndex` | Item 在数据列表中的索引 |
| `ItemId` | 用户自定义ID，可用于标记/查找 |
| `IsInitHandlerCalled` | 是否已完成首次初始化（用于区分新创建/从池中复用） |
| `ItemPrefabName` | Item 使用的 Prefab 名称 |
| `CachedRectTransform` | Item 的 RectTransform 缓存 |
| `ParentListView` | 所属的 LoopListView2 引用 |
| `Padding` | Item 的间距 |
| `UserObjectData` / `UserIntData1` / `UserIntData2` / `UserStringData1` / `UserStringData2` | 自定义数据存储字段 |

---

## 12. 完整示例

以下是一个最简完整流程（参考 `MailUIController`）：

```csharp
using SuperScrollView;

public partial class MyListController : UIDialog
{
    private LoopListView2 _listView;
    private List<MyData> _dataCache = new();
    private bool _listInited;
    private const string ItemPrefabName = "MyItem";

    void Awake()
    {
        _listView = GetComponentInChildren<LoopListView2>(true);
        if (!_listInited)
        {
            _listView.InitListView(0, OnGetItemByIndex);
            _listInited = true;
        }
    }

    public override void RefreshView()
    {
        _dataCache = BuildDataList();
        _listView.SetListItemCount(_dataCache.Count);
        _listView.RefreshAllShownItem();
    }

    private LoopListViewItem2 OnGetItemByIndex(LoopListView2 listView, int index)
    {
        if (index < 0 || index >= _dataCache.Count) return null;

        var item = listView.NewListViewItem(ItemPrefabName);
        var script = item.GetComponent<MyItem>();
        script.SetData(_dataCache[index]);
        return item;
    }
}
```

---

## 13. 注意事项

1. **InitListView 只能调用一次**，重复调用会报错。通常在 `Awake()` 或 `Start()` 中调用。
2. **数据源要持久化**：`OnGetItemByIndex` 会在滚动过程中反复调用，数据源必须始终保持有效（不能是临时变量）。
3. **`IsInitHandlerCalled`** 用于区分 "从对象池新创建" 和 "从对象池复用"，首次初始化（如添加事件监听）应放在 `if (!item.IsInitHandlerCalled)` 内。
4. **SetListItemCount 的 `resetPos` 参数**：默认为 `true` 会重置滚动位置；设为 `false` 可保持当前滚动位置。
5. **Item 默认尺寸**通过 `LoopListViewInitParam.mItemDefaultWithPaddingSize` 设置，如果不正确会导致滚动条异常。
6. **多个 Prefab** 需要在 Inspector 的 `ItemPrefabDataList` 中预先配置好，`NewListViewItem` 通过 Prefab 名称查找。

---

## 14. 项目中使用 LoopListView2 的模块（61个文件）

| 模块 | 文件路径 |
|------|----------|
| 邮件 | `UI/Mail/MailUIController.cs` |
| 聊天 | `UI/Chat/ChatMainController_Messages.cs` |
| 任务 | `UI/Task/TaskUIController.cs` |
| 商城 | `UI/Shop/ShopContentNormal.cs`, `ShopContentSubscribe.cs` |
| 抽卡 | `UI/Main/DrawCard/DrawCardEntrance/DrawCardKcController.cs` |
| 关卡 | `UI/Stage/StageTeamEditorController.cs`, `StageResultController.cs`, `StageIdleRewardController.cs`, `StageQuickIdleRewardController.cs` |
| 建造 | `UI/Building/Build/BuildUI.cs`, `RoomUnlockConditionUI.cs` |
| 英雄渡劫 | `UI/Building/HeroLevelUp/HeroBreakPageController.cs` |
| 建筑解锁 | `UI/Building/LevelUp/BuildingUnlockController.cs` |
| 派遣 | `UI/Building/Dispatch/DispatchPageUIController.cs` |
| 订单采购 | `UI/Building/Order/PurchasePageUIController.cs` |
| 装备 | `UI/Building/Equipment/SalesPageController.cs`, `SalesPageSalvageModeController.cs`, `SalvageConfirmDialogController.cs`, `HeroEquipmentTradeDialogController.cs`, `EquipmentHeroPageController.cs` |
| 恢复生产 | `UI/Building/Recover/HuifuShengchanController.cs` |
| 镇魂碑 | `UI/Building/DifficultySelect/ZhenHunBeiUIController.cs` |
| 下拉菜单 | `LogicUtil/UIUtil/Common/DropDown/DropDownUI.cs` |
| 测试/示例 | `UI/Test/ScrollExample/ScrollVExampleController.cs` |
