# XKit 通用工具库

> 项目路径：`src/xkit/`

XKit 是项目的通用工具库，为整个游戏客户端提供基础能力支撑。包含 16 个子模块，覆盖网络通信、UI 框架、时间管理、数据结构、随机数、对象池、数据埋点、资源管理、数学计算、配置表解析等核心功能。

---

## 目录

1. [base_mgr — 基础组件管理层](#1-base_mgr--基础组件管理层)
2. [data_analytics — 数据埋点与上报](#2-data_analytics--数据埋点与上报)
3. [download — 资源下载配置管理](#3-download--资源下载配置管理)
4. [InteractiveProperties — 交互式属性绑定](#4-interactiveproperties--交互式属性绑定)
5. [Math — 数学计算工具集](#5-math--数学计算工具集)
6. [network — 网络通信层](#6-network--网络通信层)
7. [parse_excel — Excel 配置表解析](#7-parse_excel--excel-配置表解析)
8. [pool_util — 对象池](#8-pool_util--对象池)
9. [rand_util — 随机数工具](#9-rand_util--随机数工具)
10. [ReactiveProperty — 响应式属性系统](#10-reactiveproperty--响应式属性系统)
11. [structure — 数据结构](#11-structure--数据结构)
12. [time — 时间管理工具](#12-time--时间管理工具)
13. [trigger — 触发器事件系统](#13-trigger--触发器事件系统)
14. [tween — 缓动动画工具](#14-tween--缓动动画工具)
15. [ui — UI 框架](#15-ui--ui-框架)
16. [util — 综合工具集](#16-util--综合工具集)

---

## 1. base_mgr — 基础组件管理层

### BaseMgr（管理器基类）
- **路径**：`src/xkit/base_mgr/BaseMgr.ts`
- **功能**：定义了所有业务管理器的标准生命周期接口，通过继承实现统一管理。
- **核心接口**：
  - `OnRoleAwake()` — 管理器初始化时调用
  - `OnRoleDestroy()` — 管理器销毁时调用
  - `OnRoleBeforeLogin()` — 登录 game 服前触发，注册协议监听、触发器
  - `OnRoleAfterLogin()` — 登录完成、本地数据齐全后触发
  - `OnRoleAfterLogout()` — 退出 game 服时触发，取消注册事件
  - `OnRoleUpdate(_dtMillisecond)` — 每帧更新（仅登录 game 服后执行）
  - `OnExitGame()` — 退出到热更界面时触发
- **属性**：
  - `role: IRoleNetworkRegister` — 提供协议注册/取消注册接口

### ReactiveDecorators（响应式装饰器）
- **路径**：`src/xkit/base_mgr/ReactiveDecorators.ts`
- **功能**：提供 TypeScript 装饰器，实现属性变化的自动监听和界面更新。

### ScrollItemBase（滚动列表项基类）
- **路径**：`src/xkit/base_mgr/ScrollItemBase.ts`
- **功能**：UI 滚动列表（ScrollView）中 list item 的基类，提供 Item 的复用和刷新接口。

---

## 2. data_analytics — 数据埋点与上报

### DataAnalytics（数据埋点上报）
- **路径**：`src/xkit/data_analytics/DataAnalytics.ts`
- **功能**：游戏客户端事件埋点上报系统，用于运营数据统计。
- **核心方法**：
  - `ReportEvent(eventName, params)` — 上报事件
  - `ReportForceGuidance(guideId)` — 上报强制引导进度

### DataAnalyticsConst（埋点事件常量）
- **路径**：`src/xkit/data_analytics/DataAnalyticsConst.ts`
- **功能**：定义所有埋点事件的名称常量枚举，统一管理埋点事件标识。

---

## 3. download — 资源下载配置管理

### DownloadConfig（下载配置）
- **路径**：`src/xkit/download/DownloadConfig.ts`
- **功能**：管理游戏资源下载配置，包括下载队列、优先级、资源版本更新等。

---

## 4. InteractiveProperties — 交互式属性绑定

> 路径：`src/xkit/InteractiveProperties/`

通过 C# 与 TypeScript 双端实现，提供 UI 组件与数据模型之间的自动绑定，支持以下属性类型：

| 文件 | 功能 |
|------|------|
| `InteractiveBool.cs/ts` | 布尔值绑定（如开关状态） |
| `InteractiveString.cs/ts` | 字符串绑定（如文本内容） |
| `InteractiveNumber.cs/ts` | 数值绑定（如数值显示） |
| `InteractiveLong.cs/ts` | 大整数绑定（如 ID、数量） |

---

## 5. Math — 数学计算工具集

> 路径：`src/xkit/Math/`

### MathUtil（数学工具）
- **路径**：`src/xkit/Math/MathUtil.ts`
- **功能**：提供通用数学计算函数，包括向量计算、角度转换、插值等。

### Polygon（多边形计算）
- **路径**：`src/xkit/Math/Polygon.ts`
- **功能**：多边形相关计算，例如点与多边形的位置关系判断（包含/排除）。

### Rect（矩形计算）
- **路径**：`src/xkit/Math/Rect.ts`
- **功能**：矩形区域相关计算，如矩形相交检测、包含检测等。

---

## 6. network — 网络通信层

### Network（网络管理器）
- **路径**：`src/xkit/network/Network.ts`
- **功能**：游戏客户端网络通信核心，管理连接、消息收发、断线重连、心跳检测。
- **核心功能**：
  - **连接管理**：支持 Login 服和 Game 服两种连接类型
  - **消息收发**：`SendToServer()` 发送协议、`OnReceive()` 接收并分发协议回包
  - **协议回调**：支持序列号映射（`seqHandlerMap`）和协议名映射（`msgHandlerFuncs`）两种回调方式
  - **心跳检测**：定时发送 `mcs_ping`，超时未收到 `msc_pong` 则触发断线重连
  - **断线重连**：`TryReconnect()` 自动处理 Login 服务器和 Game 服务器的重连逻辑
  - **错误处理**：`HandleErrorCode()` 统一处理服务端返回的错误码，支持自定义错误回调
  - **时间同步**：接收回包时同步服务端时间（`TimeUtil.SyncServerTime`）

### NetMessageMonitor（网络消息监控）
- **路径**：`src/xkit/network/NetMessageMonitor.ts`
- **功能**：监控网络消息的收发情况，用于调试和性能统计。

### 相关 UI
- `ui/ConnectWaitingPanel.ts` — 连接等待面板
- `ui/ReconnectGamePanel.ts` — 重连 Game 服务器面板
- `ui/RequestWaitingPanel.ts` — 请求等待面板

---

## 7. parse_excel — Excel 配置表解析

### ParseExcelTool（Excel 解析工具）
- **路径**：`src/xkit/parse_excel/ParseExcelTool.ts`
- **功能**：将 Excel 配置表数据解析为 TypeScript 可用的数据结构，支持离线配置热更新。

---

## 8. pool_util — 对象池

### Pool（通用对象池）
- **路径**：`src/xkit/pool_util/Pool.ts`
- **功能**：通用对象池实现，通过复用对象减少 GC 压力和对象创建开销。支持对象的获取、归还、预热和清理。

### SharePool（共享池）
- **路径**：`src/xkit/pool_util/SharePool.ts`
- **功能**：全局共享的对象池，支持跨模块复用相同类型的对象。

---

## 9. rand_util — 随机数工具

### RandomUtil（随机数工具类）
- **路径**：`src/xkit/rand_util/RandomUtil.ts`
- **功能**：提供两套随机系统——默认随机（基于系统原生随机源）和固定种子随机（用于可复现的确定性随机）。
- **核心方法**：
  - `Range01()` — 返回 [0, 1) 范围的随机浮点数
  - `RangeFloat(nBegin, nEnd)` — 返回 [nBegin, nEnd) 范围的随机浮点数
  - `RangeInt(nBegin, nEnd)` — 返回 [nBegin, nEnd) 范围的随机整数（不包含 nEnd）
  - `RangeMulti(nBegin, nEnd, nNum)` — 从指定范围内随机抽取 n 个不重复的值（适用于数组索引随机选取）
- **静态方法**：
  - `RandomUtil.Default` — 默认随机实例（不可预测）
  - `RandomUtil.GetRandom(seed)` — 基于 BigInt 种子创建确定性随机实例

### IRandomSource（随机源接口）
- **路径**：`src/xkit/rand_util/IRandomSource.ts`
- **功能**：定义随机源的接口，提供 `DefaultRandomSource`（系统原生随机）和 `LCGSourceWithSafeNumber`（线性同余生成器，适用于固定种子）两种实现。

---

## 10. ReactiveProperty — 响应式属性系统

### ReactiveProperty（响应式属性）
- **路径**：`src/xkit/ReactiveProperty/ReactiveProperty.cs/ts`
- **功能**：C# 与 TypeScript 双端实现的响应式属性系统，属性值变化时自动通知所有订阅者。
- **支持类型**：
  - 响应式数值（int/float）
  - 响应式向量（Vector2/Vector3）
  - 响应式四元数（Quaternion）
  - 可扩展自定义类型

---

## 11. structure — 数据结构

> 路径：`src/xkit/structure/`

### Heap（堆/优先队列）
- **路径**：`src/xkit/structure/Heap.ts`
- **功能**：实现优先队列（二叉堆），支持自定义比较器。常用于任务调度、A* 寻路等需要按优先级处理元素的场景。

### UFS（并查集）
- **路径**：`src/xkit/structure/UFS/`
- **功能**：并查集数据结构，用于处理不相交集合的合并与查询，常用于地图连通性判断、联盟关系等。

### IndexSet（索引集合）
- **路径**：`src/xkit/structure/IndexSet.ts`
- **功能**：基于位运算的高效索引集合，支持快速添加、删除和判断包含关系，内存占用小。

### ListPool（列表池）
- **路径**：`src/xkit/structure/ListPool.ts`
- **功能**：列表对象池，复用临时列表以减少 GC 分配。

### Rect（矩形数据结构）
- **路径**：`src/xkit/structure/Rect.ts`
- **功能**：矩形数据结构的定义和基本操作。

---

## 12. time — 时间管理工具

> 路径：`src/xkit/time/`

### TimeUtil（时间工具类）
- **路径**：`src/xkit/time/time_util.ts`
- **功能**：游戏时间管理的核心工具，支持服务端时间同步、时区转换、时间格式化等。
- **核心功能**：
  - **时间同步**：`SyncServerTime()` / `ForceSyncServerTime()` — 与服务端进行时间同步，自动计算客户端与服务端的差值
  - **时区支持**：`SetTimezoneOffset()` / `_CovertToServerTimezone()` — 支持多时区时间显示
  - **日期获取**：`GetServerMilliSecond()` / `GetDateNumbers()` — 获取同步后的服务器时间和年月日时分秒
  - **日期判断**：`IsSameDayInServerTime()` / `IsSameDay()` / `IsSameWeek()` / `IsSameGameDay()` — 判断两个时间戳是否为同一天/周/游戏日
  - **刷新时间**：`GetGameDailyRefreshTime()` / `GetGameWeeklyRefreshTime()` — 计算每日/每周刷新时间
  - **格式化输出**：
    - `formatStopWatch(milliSecond, fmt)` — 秒表/倒计时格式化（支持天/时/分/秒/毫秒，自动进位/补零）
    - `format(milliSecond, fmt)` — 日期格式化（支持 yyyy-MM-dd hh:mm:ss.S）
    - `GetServerYMD()` / `GetServerYMDHMS()` / `GetServerHMS()` — 快速获取格式化日期字符串
  - **工具方法**：
    - `ConvertTo_HH_MM_SS_BySecond(s)` — 秒数转 00:00:00 格式
    - `ConvertTo_MM_SS_BySecond(s)` — 秒数转 00:00 格式
    - `sleep(ms)` — 异步等待
    - `CountTargetTimeTimes()` — 计算两个时间戳之间指定时段的出现次数

### CDUtil（CD 倒计时管理）
- **路径**：`src/xkit/time/cd_util.ts`
- **功能**：创建和管理倒计时（CD）任务，支持循环 CD、单次 CD，用于网络心跳、技能冷却等场景。
- **核心方法**：
  - `CreateCDItem(milliSecond, isLoop)` — 创建 CD 条目
  - `IsCDFinished()` — 判断 CD 是否结束
  - `GetCDLeftMilliSec()` — 获取剩余时间
  - `ResetCD()` — 重置 CD

### ScheduleUtil（定时任务调度）
- **路径**：`src/xkit/time/schedule_util.ts`
- **功能**：帧循环任务调度器，管理需要在每帧或指定间隔执行的回调函数。
- **核心方法**：
  - `AddSchedule(callback, target, intervalMs)` — 添加定时任务
  - `RemoveSchedule(callback, target)` — 移除定时任务
  - `Default` — 默认调度实例

---

## 13. trigger — 触发器事件系统

### TriggerMgr（触发器管理器）
- **路径**：`src/xkit/trigger/trigger_mgr.ts`
- **功能**：全局事件发布-订阅系统，实现模块间的解耦通信。
- **核心方法**：
  - `AddTrigger(type, callback, target)` — 注册事件监听
  - `RemoveTrigger(type, callback, target)` — 移除事件监听
  - `Trigger(type, ...args)` — 触发事件
- **E_TriggerType** — 预定义事件类型枚举，包括：
  - `OnSyncConfig` — 配置同步完成
  - `from_cs_on_scene_change_end` — 场景切换结束
  - `from_cs_on_net_disconnect` — 网络断开

---

## 14. tween — 缓动动画工具

### TweenUtil（缓动动画工具）
- **路径**：`src/xkit/tween/TweenUtil.cs/ts`
- **功能**：C# 与 TypeScript 双端实现的缓动动画系统，支持属性插值动画。
- **支持功能**：
  - 位置、旋转、缩放动画
  - 透明度渐变动画
  - 颜色插值动画
  - 自定义属性动画
  - 缓动曲线（EaseIn / EaseOut / EaseInOut 等）
  - 动画回调（完成、循环等）

---

## 15. ui — UI 框架

> 路径：`src/xkit/ui/`

基于 MVC 模式构建的完整 UI 框架，管理游戏内所有界面。

### 核心架构

| 概念 | 说明 |
|------|------|
| **View** | 视图层，负责 UI 展示和用户交互 |
| **Model** | 数据模型层，管理 UI 数据和状态 |
| **Controller** | 控制器层，处理 UI 逻辑和业务交互 |
| **ViewModel** | 视图模型层，连接 View 与 Model 的桥梁 |

### 核心模块

| 模块 | 文件 | 功能说明 |
|------|------|---------|
| **UIManager** | `UIManager.ts` | UI 管理器，负责 UI 的创建、销毁、层级管理、全局事件分发 |
| **UIViewBase** | `UIViewBase.ts` | 所有 UI 视图的基类，提供生命周期（OnShow/OnHide/OnDestroy） |
| **DialogManager** | `DialogManager.ts` | 对话框管理，管理弹窗队列和层级 |
| **ViewManager** | `ViewManager.ts` | 视图管理，管理页面栈和切换 |
| **PageJump** | `PageJump.ts` | 页面跳转系统，处理页面间导航 |
| **NTUtil** | `NTUtil.ts` | 通知提示工具（Toast/通知栏/跑马灯等） |
| **UICommonUtil** | `UICommonUtil.ts` | UI 通用工具函数集 |

---

## 16. util — 综合工具集

> 路径：`src/xkit/util/`

最庞大的工具模块，包含 30+ 工具函数和多个工具类。

### util（核心工具类）
- **路径**：`src/xkit/util/util.ts`（约 1510 行）
- **功能**：综合工具函数集合，涵盖以下功能领域：

#### 颜色与样式
| 方法 | 功能说明 |
|------|---------|
| `HexToColor(hexStr)` | 十六进制颜色字符串转 Unity Color |
| `GetRarityColor(rarity)` | 根据稀有度获取对应颜色 |
| `GetQualityColor(quality)` | 根据品质获取对应颜色 |

#### 数值格式化
| 方法 | 功能说明 |
|------|---------|
| `GetNumberString(num)` | 格式化数字显示（如 10000 → 1万） |
| `GetChineseNumberString(num)` | 中文数字格式化 |
| `FormatNumber(num)` | 数字千分位格式化 |
| `BytesToReadable(bytes)` | 字节数转可读字符串（如 1024 → 1KB） |

#### 字符串与文本
| 方法 | 功能说明 |
|------|---------|
| `ParseStr(template, ...args)` | 字符串模板替换 |
| `Translate(key)` | 多语言翻译 |
| `SubString(str, maxLen)` | 字符串截断 |
| `FilterEmoji(str)` | 过滤 Emoji 表情 |

#### 时间与日期
| 方法 | 功能说明 |
|------|---------|
| `GetNowTime()` | 获取当前时间戳 |
| `GetTodayZeroTime()` | 获取今天零点时间戳 |
| `GetDurationString(seconds)` | 时长转可读字符串 |
| `IsToday(timestamp)` | 判断是否为今天 |

#### 函数工具
| 方法 | 功能说明 |
|------|---------|
| `throttle(timeLimit, countLimit, func, condition)` | 函数节流，限制固定时间内调用次数 |
| `debounce(func, delay)` | 函数防抖 |

#### 组件与 Transform
| 方法 | 功能说明 |
|------|---------|
| `AddComponentIfNotExist(type, transform)` | 为 GameObject 添加组件（不存在时才添加） |
| `GetComponentInChildren(type, transform, includeInactive)` | 递归查找子物体组件 |
| `TraverseTransform(transform, callback)` | 遍历 Transform 层级树 |

#### 数据持久化
| 方法 | 功能说明 |
|------|---------|
| `SaveData(key, value)` | 保存数据到本地存储 |
| `LoadData(key)` | 从本地存储加载数据 |
| `DeleteData(key)` | 删除本地存储数据 |
| `ClearAllData()` | 清除所有本地数据 |

#### 游戏对象操作
| 方法 | 功能说明 |
|------|---------|
| `SetActive(gameObject, active)` | 安全设置 GameObject 激活状态 |
| `Destroy(gameObject)` | 安全销毁 GameObject |
| `Instantiate(prefab, parent)` | 实例化预制体 |
| `FindChild(transform, path)` | 按路径查找子物体 |
| `SetLayer(transform, layer, includeChildren)` | 设置对象层级 |

#### 屏幕适配
| 方法 | 功能说明 |
|------|---------|
| `GetScreenWidth()` | 获取屏幕宽度 |
| `GetScreenHeight()` | 获取屏幕高度 |
| `GetSafeArea()` | 获取异形屏安全区域 |
| `AdaptForNotch()` | 适配刘海屏 |

#### 特效与资源
| 方法 | 功能说明 |
|------|---------|
| `ReplaceEffectQuality(effect)` | 替换特效质量等级 |
| `LoadAsset(path)` | 加载资源 |
| `LoadAllAssets(path)` | 加载路径下所有资源 |

### util_ui（UI 工具类）
- **路径**：`src/xkit/util/util_ui.ts`
- **功能**：UI 相关工具函数，包括按钮样式设置、通用奖励弹出、战报显示等。
- **核心方法**：
  - `SetButtonStyle(style, bgImage, text)` — 设置按钮样式（支持 Normal/Gray/Disable/Red/Orange 等多种状态）
  - `ShowReward(rewardList)` — 通用奖励展示弹窗
  - `ShowBattleReport(data)` — 战报展示

### util_text（文本工具类）
- **路径**：`src/xkit/util/util_text.ts`
- **功能**：富文本处理，支持图文混排、超链接、颜色标签解析、表情符号替换等。

### util_encode（编码工具类）
- **路径**：`src/xkit/util/util_encode.ts`
- **功能**：数据序列化与编码工具，包括 JSON 序列化、Long/BigInt 处理、数据拷贝深克隆。

### util_asset（资源工具类）
- **路径**：`src/xkit/util/util_asset.ts`
- **功能**：资源加载与缓存管理，包括异步加载（`LoadAssetAsync`）、同步加载、资源引用计数管理、预加载。

### util_map（地图工具类）
- **路径**：`src/xkit/util/util_map.ts`
- **功能**：游戏世界地图相关工具函数，包括坐标转换、格子计算、寻路接口、视野范围计算。

### util_shadow（阴影/调试工具类）
- **路径**：`src/xkit/util/util_shadow.ts`
- **功能**：提供日志级别控制、调试模式判断、编辑器环境判断，用于开发调试。

### Platform（平台判断工具）
- **路径**：`src/xkit/util/Platform.ts`
- **功能**：运行时平台判断，检测当前运行环境（编辑器/真机/iOS/Android/WebGL）。

### UIUtility（UI 通用工具）
- **路径**：`src/xkit/util/UIUtility.ts`
- **功能**：UI 布局计算、坐标转换、屏幕坐标与世界坐标互转等。

### MLStringUtility（多语言字符串工具）
- **路径**：`src/xkit/util/MLStringUtility.ts`
- **功能**：多语言字符串（MLString）的解析、格式化、拼接处理。

### SpecialStrInfo（特殊字符串处理）
- **路径**：`src/xkit/util/SpecialStrInfo.ts`
- **功能**：解析和处理特殊字符串（如带颜色标签、图标标签、超链接的文本）。

### context（上下文管理）
- **路径**：`src/xkit/util/context.ts`
- **功能**：提供代码执行上下文管理，包括异步流程追踪和调试信息记录。

---

## 模块依赖关系

```
UI Framework (ui/)
    ├── 依赖 base_mgr/ReactiveDecorators
    ├── 依赖 structure/Heap（优先级队列）
    ├── 依赖 time/schedule_util（定时刷新）
    └── 依赖 util/*（综合工具）

Network (network/)
    ├── 依赖 time/cd_util（心跳 CD）
    ├── 依赖 time/schedule_util（帧循环更新）
    ├── 依赖 time/time_util（时间同步）
    ├── 依赖 trigger/trigger_mgr（事件通知）
    ├── 依赖 data_analytics（埋点上报）
    └── 依赖 util/*（编码、日志、平台判断）

其他模块
    ├── pool_util 被 structure/ListPool 和多个业务模块依赖
    ├── rand_util 被战斗、抽卡等系统依赖
    └── tween 被 UI 动画系统依赖