# 账簿页面
# 预制体
- prefab/ui/building/xiaotuiche/Ledger_UI.prefab

# 页面元素
- 等级 text
- 收益列表(变色) scroll
    - 列表item元素
    - 产品名称 text
    - 收益 text
- 累计份数 text
- 累计收益 text
- 领取按钮 btn
- 关闭页面按钮 btn

# 项目结构
1. 主页面
2. item

# 数据获取CarSystem

------------------------------------------------------------

# 上架页面
# 预制体
- prefab/ui/building/xiaotuiche/Listing_UI.prefab

# 页面元素
- 列表
    1. 在售物品
    - 图标 CommonItem
    - 等级 text
    - 下架按钮 btn
    - 名称 text
    - 收益 text
    - 余量 text
    -余量条 progress
    2. 空槽位
    - 上架按钮 btn
    3. 未解锁
    - 解锁条件描述 text
- 售完时间 text
- 预计收益 text
- 一键上架按钮 btn 
- 百练炉跳转 btn

# 项目结构
1. 主页面
2. item

# 数据获取CarSystem
我要根据这些信息在 小推车建筑117增加一个页面 使用superPowers

----------------------

# 选择商品界面
- prefab/ui/building/xiaotuiche/Choose_product_ui.prefab

# 页面元素
- 全部按钮 btn
- 1-10阶按钮 btn
- 11-20阶按钮 btn
- 21-30阶按钮 btn
- 库存列表 scroll
    1. item
    - 图标 CommonItem
    - 等级 text
    - 选择按钮 btn
    - 收益 text
    - 余量 text
- 数量变化 - btn
- 数量变化条 slider
- 数量变化 + btn
- 数量变化上限 btn
- 数量显示文本 text
- 已选择物品 text
- 槽位容量 text
- 预计收益 text
- 上架按钮 btn

# 项目结构
- 脚本位置Assets\Scripts\Hot\Logic\UI\Building\Car
1. 主页面
2. item

# 数据获取CarSystem
我要根据这些信息在 添加一个新的弹窗 使用superPowers

----------------------

# 离线收益界面
- prefab/ui/building/xiaotuiche/Offline_income_ui.prefab

# 页面元素
- 离线时长 text
- 累计收益 text
- 售出统计列表 scroll
    1. item
    - 图标 以及售出数量 CommonItem
- 库存变化列表 scroll
    1. 还有存货 item
    - 槽位名称 text
    - 商品名称 text
    - 商品数量初始值 text
    - 商品数量剩余值 text
    1. 没有存货 item
    - 槽位名称 text
    - 商品名称 text
    - 商品数量初始值 text
    - 商品数量剩余值 text
- 领取收益按钮 btn

# 项目结构
- 脚本位置Assets\Scripts\Hot\Logic\UI\Building\Car
- 主页面
- item

# 数据获取CarSystem
我要根据这些信息 添加一个新的弹窗 使用superPowers