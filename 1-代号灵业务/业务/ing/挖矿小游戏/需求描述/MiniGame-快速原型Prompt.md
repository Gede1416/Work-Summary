# UI系统快速原型 Prompt 模板

## 使用方法

收到策划案后，将策划案内容填入 `[策划案内容]` 占位处，将下方完整 Prompt 发给 Claude。参考：[MiniGame-挖矿系统架构](./MiniGame-挖矿系统架构.md)

---

### 名词
1. 系统名：

你现在是[1]系统的开发者。请根据以下策划案内容，按照现有的分层架构和代码规范，给出快速原型实现的计划：

### 策划案内容
[在此粘贴策划案内容]

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