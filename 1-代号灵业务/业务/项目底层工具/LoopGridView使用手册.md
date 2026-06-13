# LoopGridView 使用手册

SuperScrollView 提供的网格滚动列表组件，适用于以网格形式展示的大量数据。

---

## 1. 命名空间与引用

```csharp
using SuperScrollView;
```

## 2. PrefabBinder 绑定字段

在 Designer.cs 中声明：

```csharp
[SerializeField] private LoopGridView gridV;
```

## 3. 初始化

```csharp
// 初始化网格，参数1=数据总数，参数2=item创建回调
gridV.InitGridView(itemCount, OnGetItemByRowColumn);
```

## 4. 更新数据

```csharp
// 设置数据数量（会触发重建）
gridV.SetListItemCount(newCount, false);
// 刷新所有可见item（不改变数量时）
gridV.RefreshAllShownItem();
```

- `SetListItemCount(0, false)` 清空列表
- `RefreshAllShownItem()` 仅刷新当前可见的item，数据量不变时使用

## 5. Item 创建回调

回调签名：

```csharp
LoopGridViewItem OnGetItemByRowColumn(LoopGridView gridView, int index, int row, int column)
```

完整实现模板：

```csharp
LoopGridViewItem OnGetItemByRowColumn(LoopGridView gridView, int index, int row, int column)
{
    if (index < 0) return null;

    // 从对象池获取/创建item
    LoopGridViewItem item = gridView.NewListViewItem("ItemPrefab");
    var itemScript = item.GetComponent<YourItemController>();

    // 仅首次创建时初始化（注册事件等一次性操作）
    if (item.IsInitHandlerCalled == false)
    {
        item.IsInitHandlerCalled = true;
        itemScript.Init();
    }

    // 每次刷新都更新数据
    itemScript.SetData(yourDataList[index]);

    return item;
}
```

**关键点：**
- `IsInitHandlerCalled` 判断item是否从对象池取出（false = 新创建），用于注册事件等一次性操作
- 数据更新写在 `IsInitHandlerCalled` 判断外面，确保每次刷新都生效

## 6. Item 预置体注册

在 prefab 的 LoopGridView 组件中，将 item prefab 拖入 **Item Prefab List**，并设置其 Prefab Name（即代码中 `NewListViewItem("PrefabName")` 的参数字符串）。

**常见配置项：**

| 属性 | 说明 |
|------|------|
| Item Width / Height | item 单元格尺寸 |
| Padding (Left/Right/Top/Bottom) | 内边距 |
| Horizontal / Vertical Space | 行列间距 |
| Fixed Row/Column Count | 固定行/列数 |

## 7. 常见错误

### ItemSize is invalid
> `m_ItemWidth` 或 `m_ItemHeight` 为 0。

**解决：** 在 Inspector 中设置 LoopGridView 的 Item Width 和 Item Height。

## 8. 项目中的实际使用示例

### 示例1：固定数量的网格（百炼炉配方）

```csharp
// OrderPageUIController.cs
private void Start()
{
    this.CurChosenTier = 0;
    this.ItemsConfig = OrderSystem.Ins.GetOrderItemConfigsByTier(this.CurChosenTier + 1);
    this.gridOrder.InitGridView(this.ItemsConfig.Count, OnGetItemByRowColumn);
}

// 切换筛选时刷新
public void OnChosenTierChange(int tier)
{
    this.ItemsConfig = OrderSystem.Ins.GetOrderItemConfigsByTier(tier + 1);
    this.gridOrder.SetListItemCount(this.ItemsConfig.Count);
    this.gridOrder.RefreshAllShownItem();
}
```

### 示例2：带对象池初始化的网格（商品选择弹窗）

```csharp
// ChooseProductUIController.cs
private void InitView()
{
    gridV.InitGridView(0, OnGetItemByRowColumn);
}

private LoopGridViewItem OnGetItemByRowColumn(LoopGridView gridView, int index, int row, int column)
{
    if (index < 0 || index >= _filteredItems.Count) return null;

    LoopGridViewItem item = gridView.NewListViewItem(ITEM_PREFAB_NAME);
    var itemScript = item.GetComponent<ChooseProductItemController>();
    if (itemScript != null)
    {
        itemScript.SetData(_filteredItems[index], index, index == _selectedIndex, OnItemSelected);
    }
    return item;
}

// 刷新列表
private void RefreshFilteredList()
{
    gridV.SetListItemCount(_filteredItems.Count, false);
    gridV.RefreshAllShownItem();
}

// 选中变化时仅刷新可见item
private void OnItemSelected(int index)
{
    _selectedIndex = index;
    gridV.RefreshAllShownItem();
}
```

### 示例3：带IsInitHandlerCalled的网格（复活界面）

```csharp
LoopGridViewItem OnGetItemByRowColumn(LoopGridView gridView, int index, int row, int column)
{
    if (index < 0) return null;

    LoopGridViewItem item = gridView.NewListViewItem("ItemPrefab");
    var itemScript = item.GetComponent<RebirthFuHuoGridItem>();

    if (item.IsInitHandlerCalled == false)
    {
        item.IsInitHandlerCalled = true;
        itemScript.Init(); // 事件注册等一次性操作
    }

    itemScript.SetItemData(index); // 每次刷新的数据更新
    return item;
}
```

## 9. 与 LoopListView2 的区别

| | LoopGridView | LoopListView2 |
|------|------|------|
| 布局 | 网格（行列） | 列表（单行/单列） |
| 回调 | `(gridView, index, row, column)` | `(listView, index)` |
| 返回类型 | `LoopGridViewItem` | `LoopListViewItem2` |
| 初始化 | `InitGridView` | `InitListView` |
| Item大小 | Inspector 设置 Item Width/Height | item prefab 自身尺寸 |

## 10. 常用 API 速查

```csharp
// 初始化
gridV.InitGridView(itemCount, callback);

// 更新数量
gridV.SetListItemCount(count, false);   // false=不立即刷新
gridV.RefreshAllShownItem();            // 刷新可见item

// 滚动
gridV.MovePanelToItem(index, offset);   // 滚动到指定item
gridV.MovePanelToItemByRowColumn(row, column, offset);

// 获取item
gridV.GetShownItem(index);              // 获取已显示的item（null=未显示/已回收）

// 清空
gridV.SetListItemCount(0, false);
```
