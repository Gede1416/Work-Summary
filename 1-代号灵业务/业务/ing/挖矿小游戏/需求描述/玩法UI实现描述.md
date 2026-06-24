# 玩法
1. 操作流程 ReqDigCell -> OnSyncMiniGameData -> UI刷新
2. 数据初始化: MiningGameData.opened_cell_list List
3. 显示挖矿界面: 限制行数量 maxRow
4. 格子状态：挖完，未挖，选中，玩家
5. 状态定义：
    ```cs
    enum CellState{
        Player = 1,//MiningGameData.cur_index
        Empty = 2,//未挖 MiningCellData == null
        Selected = 3,//选中 客户端逻辑
        Digged = 4,//挖完 MiningCellData.index
    }
    ```
4. 可挖矿范围：index + 1，index - 1，index + maxRow，index - maxRow

# 模糊元素
1. 规则 次数 界面 奖励框列表还是固定
2. 次数 界面 剩余次数
3. 挖矿界面是否需要显示 item
4. 可挖矿范围
5. 选中后？直接挖矿 | 显示提示