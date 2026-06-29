### 名词
1. 系统名：Tip

你现在是[1]系统的开发者。请根据以下策划案内容，按照现有的分层架构和代码规范，给出快速原型实现的计划：

### 策划案内容
我需要有一个来帮助我管理 提示的系统

功能提示小助手的显示逻辑根据提示类型（type）和触发条件分为以下几种情况：

一、提示类型与触发条件
类型	触发场景	跳转目标
Type 1	building 表中 request_type_list 包含 1，且前置建筑等级满足条件、目标建筑为 0 级（即可建造新建筑）	打开建造列表
Type 2	建筑类型 102 售卖的最新解锁商品库存为 0	跳转到 102 建筑，页签 2（page_jump->1001）
Type 3	建筑类型 109 售卖的最新解锁商品库存为 0	跳转到 109 建筑，页签 2（page_jump->1004）
Type 4	建筑类型 110 售卖的最新解锁商品库存为 0	跳转到 110 建筑，页签 2（page_jump->1003）
Type 5	建筑类型 111 售卖的最新解锁商品库存为 0	跳转到 111 建筑，页签 2（page_jump->1002）
Type 6	英雄前往锻造类建筑（103/107/108）触发"前往交易"时	选中对应英雄
Type 7	英雄到达锻造类建筑交互点，触发"可交易"气泡框时	定位对应英雄，并在交易气泡上显示引导手指

### 现有架构约定
- 系统代码目录：Assets/Scripts/Hot/Logic/System/[1]System/
- UI 代码目录：Assets/Scripts/Hot/Logic/UI/[1]/
- 数据容器目录：Assets/Scripts/Hot/Logic/Model/[1]/
- 事件定义：Assets/Scripts/Hot/Logic/Event/[1]
- Debug 按钮：Assets/Scripts/Hot/Logic/UI/DebugDialog/DebugDialogController.cs

### 编码规范
- 使用#re 按照功能类型分区
- System 使用 partial class 按职责拆分文件（_Req / _Res / _Util / _Test / _职责缩写）
    - _Util进行配置数据获取读表，配置数值，数据计算，状态判断，固定的配置都放在最上面
    - _Req / _Res 进行请求和响应，使用
- UI Controller 继承 UIDialog，用 Designer.cs 绑定 prefab（自动生成）
- 按钮注册前必须 ClearBinds()，再 OnClick +=
- 数据容器：缓存配置表，网络数据，并提供数据的 Get 方法， 属性get方法
- 服务端 Push → 更新容器 → SendEvent(OnXxxChanged) → UI 事件监听刷新
- UI 创建：async UniTask<XxxController>.Create(AsyncContext context)
- UI Item：MonoBehaviour，SetData(data) → RefreshView() 模式
- 测试数据放在 _Test.cs，不混入正式逻辑
- Debug 按钮注册在 DebugDialogController.Start() 的 btnDatas.Add()

### 测试
- 生成多份测试数据容器，提供打开使用测试数据打开功能的接口

### 请输出
1. 协议梳理：协议数据 代码段 或者 文件
2. 配置表: 表名称，需要的表数据
3. 数据容器：提供哪些数据get接口
4. 是否需要其他系统的参与

### 说出你不清楚的事情，来明确需求