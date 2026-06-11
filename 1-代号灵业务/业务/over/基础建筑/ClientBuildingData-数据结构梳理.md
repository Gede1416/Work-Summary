# ClientBuildingData 数据结构梳理

## 概述

`ClientBuildingData` 是建筑系统在客户端的运行时数据模型。它独立于配置表，存储的是**服务器下发的、属于当前玩家**的建筑状态。与之配套的 `ClientBuildingContainer` 作为顶层容器挂在 `G.userData` 下。

---

## 类图

```
G.userData
 └── buildingContainer : ClientBuildingContainer
      ├── BuildingDataDict : Dictionary<BuildingType, ClientBuildingData>
      │    └── [BuildingType] → ClientBuildingData
      │         ├── ProtoData : NetProto.BuildingData
      │         │    ├── BuildingId   (uint)
      │         │    └── BuildingType (uint)
      │         ├── _cfg : CfgGen.building (缓存)
      │         ├── GetCfg() → CfgGen.building
      │         └── UpdateByProto(NetProto.BuildingData)
      ├── LevelUpHeroUUid : ulong
      └── ClearedRuinIdList : List<uint>
```

---

## 1. ClientBuildingContainer

```csharp
// ClientBuildingData.cs (同一个文件)
public class ClientBuildingContainer
{
    // 所有建筑的运行时数据，按 BuildingType 索引
    public readonly Dictionary<CfgEnum.BuildingType, ClientBuildingData> BuildingDataDict = new();

    // 当前正在建筑内升级的英雄 UUID（0 = 无英雄在升级）
    public ulong LevelUpHeroUUid = 0;

    // 已清除的遗迹 ID 列表（与协议 BuildingDataContainer.cleared_ruin_id_list 对应）
    public List<uint> ClearedRuinIdList = new();
}
```

### 挂载位置

```csharp
// UserData.cs:23
public class UserData : IUserData
{
    public ClientBuildingContainer buildingContainer = new();
    // ...
}
```

访问路径：`G.userData.buildingContainer`

---

## 2. ClientBuildingData

```csharp
// ClientBuildingData.cs (同一个文件)
public class ClientBuildingData
{
    public NetProto.BuildingData ProtoData;    // 服务器下发的原始数据

    CfgGen.building _cfg;                      // 配置表缓存

    // 获取对应的配置表行（懒加载 + 缓存失效自动刷新）
    public CfgGen.building GetCfg()
    {
        if (_cfg == null || _cfg.ID != ProtoData.BuildingId)
        {
            _cfg = Cfg.Ins.building.get(ProtoData.BuildingId);
        }
        return _cfg;
    }

    // 用服务器增量数据更新自身
    public void UpdateByProto(NetProto.BuildingData protoData)
    {
        this.ProtoData = protoData;
    }
}
```

---

## 3. NetProto.BuildingData（服务端协议数据）

protobuf 生成类，属于 `NetProto` 命名空间。Key 值由客户端代码中的使用点推断：

| 字段 | 类型 | 说明 |
|------|------|------|
| `BuildingId` | `uint` | 当前建筑 ID（对应 `CfgGen.building.ID`），**是连接运行时数据和配置表的桥梁** |
| `BuildingType` | `uint` | 建筑类型枚举（可强转为 `CfgEnum.BuildingType`） |

> 注：`NetProto.BuildingData` 在 pre-compiled DLL 中，此处仅列出客户端实际使用的字段。服务端可能还有其他字段。

---

## 4. 生命周期

### 4.1 创建（全量初始化）

**触发**：登录进游戏 / 断线重连  
**协议**：`MscInitBuildingInfo`

```csharp
// BuildingSystem_Net_Base.cs
private void OnInitBuildingInfo(CSMsg msg)
{
    // 1. 丢弃旧数据，重建容器
    G.userData.buildingContainer = new ClientBuildingContainer();

    var info = msg.Body.MscInitBuildingInfo.UserBuildingData;

    // 2. 初始化遗迹清除列表
    InitRuinUnlockList(info.ClearedRuinIdList);

    // 3. 遍历建筑列表，逐个写入
    for (int i = 0; i < info.BuildingList.Count; i++)
    {
        var protoData = info.BuildingList[i];
        AddBuildingDataByProto(protoData);
        G.userData.buildingContainer.LevelUpHeroUUid = info.LevelUpHeroUuid;
    }
}
```

### 4.2 新增（单条写入）

```csharp
// BuildingSystem_Util.cs
public void AddBuildingDataByProto(NetProto.BuildingData protoData)
{
    ClientBuildingData data = new() { ProtoData = protoData };
    G.userData.buildingContainer.BuildingDataDict[
        (CfgEnum.BuildingType)protoData.BuildingType] = data;
}
```

### 4.3 更新（增量同步）

**触发**：建筑升级等变更  
**协议**：`MscSyncBuildingData`

```csharp
// BuildingSystem_Net_Base.cs
private void OnUpdateBuildingInfo(CSMsg msg)
{
    var building_list = msg.Body.MscSyncBuildingData.BuildingList;

    for (int i = 0; i < building_list.Count; i++)
    {
        var protoData = building_list[i];
        CfgEnum.BuildingType type = (CfgEnum.BuildingType)protoData.BuildingType;
        // 直接更新已有条目（假设字典中已存在）
        G.userData.buildingContainer.BuildingDataDict[type].UpdateByProto(protoData);
    }
}
```

**关键点**：`OnUpdateBuildingInfo` 假定对应的 `BuildingType` 已存在于字典中。增量同步不会创建新条目，只更新已有的。

### 4.4 销毁

全量初始化时直接 `new ClientBuildingContainer()` 重建整个容器，旧的被 GC 回收。没有显式的单个条目删除逻辑。

---

## 5. 核心设计：GetCfg() 的缓存机制

```csharp
public CfgGen.building GetCfg()
{
    if (_cfg == null || _cfg.ID != ProtoData.BuildingId)
    {
        _cfg = Cfg.Ins.building.get(ProtoData.BuildingId);
    }
    return _cfg;
}
```

**两层含义**：

1. **懒加载**：首次访问时才查配置表，避免构建时就全量加载
2. **自动失效**：当 `ProtoData.BuildingId` 变化（建筑升级后 `UpdateByProto` 写入了新的 ID），下次 `GetCfg()` 检测到 `_cfg.ID != ProtoData.BuildingId`，自动重新查询配置表

**缓存失效的场景举例**：

```
建筑 E_101 从 1 级 (buildingId=10101) 升级到 2 级 (buildingId=10102)：
  1. 服务器下发 MscSyncBuildingData, BuildingId = 10102
  2. UpdateByProto(protoData) → ProtoData.BuildingId 变为 10102
  3. 下次 GetCfg() → _cfg.ID (10101) != ProtoData.BuildingId (10102) → 重新查表
  4. 拿到 Level=2 的配置行
```

---

## 6. 配置表桥接

`ClientBuildingData` 通过 `ProtoData.BuildingId` 桥接到配置表：

```
ProtoData.BuildingId ──→ Cfg.Ins.building.get(id) ──→ CfgGen.building
                                                                ├── ID
                                                                ├── Level
                                                                ├── Type
                                                                ├── Name
                                                                ├── NextLevel
                                                                ├── CostIdList / CostCountList
                                                                ├── AttributeList / AttributeValueList
                                                                ├── MapEntityId
                                                                ├── Combat
                                                                ├── StageAttributeId
                                                                └── RequestTypeList / PreRequestParamList
```

---

## 7. LevelUpHeroUUid

存储当前正在建筑内进行**升级操作**的英雄 UUID。它不属于单个建筑类型，而是整个建筑容器的全局状态。

**写入**（三个来源）：

| 来源 | 场景 |
|------|------|
| `OnInitBuildingInfo` | 登录时从服务器恢复：`LevelUpHeroUUid = buildingInfo.LevelUpHeroUuid` |
| `HeroSystem_LvUp.cs` | 英雄开始升级：设为 `heroData.protoData.Uuid` |
| `HeroSystem_LvUp.cs` | 升级结束/中断：设为 `0` |

---

## 8. 完整使用链路

### 8.1 查询链路（读）

```
调用方
  │
  ├── BuildingSystem.Ins.GetBuildingDataByType(type)
  │       └── G.userData.buildingContainer.BuildingDataDict[type]
  │               └── 返回 ClientBuildingData
  │
  ├── BuildingSystem.Ins.GetBuildingConfigByType(type)
  │       └── GetBuildingDataByType(type).GetCfg()
  │               └── ProtoData.BuildingId → Cfg.Ins.building.get(id)
  │
  ├── BuildingBasePanelController.GetBuildingData()
  │       └── 内部调用 BuildingSystem.Ins.GetBuildingDataByType(_buildingType)
  │               └── 缓存在 _buildingData 字段
  │
  └── 遍历所有建筑数据（战力计算）
          └── foreach (var data in G.userData.buildingContainer.BuildingDataDict.Values)
                  └── data.GetCfg().Combat
```

### 8.2 更新链路（写）

```
服务器协议
  │
  ├── MscInitBuildingInfo（全量）
  │       └── OnInitBuildingInfo
  │               ├── new ClientBuildingContainer()
  │               └── AddBuildingDataByProto(protoData) × N
  │                       └── new ClientBuildingData { ProtoData = protoData }
  │                       └── BuildingDataDict[type] = data
  │
  └── MscSyncBuildingData（增量）
          └── OnUpdateBuildingInfo
                  └── BuildingDataDict[type].UpdateByProto(protoData)
                          └── this.ProtoData = protoData
                          └── (_cfg 缓存将在下次 GetCfg() 时自动失效)
```

### 8.3 外部写入 LevelUpHeroUUid

```
HeroSystem_LvUp
  │
  ├── 开始升级 → buildingContainer.LevelUpHeroUUid = heroData.Uuid
  └── 升级结束 → buildingContainer.LevelUpHeroUUid = 0
```

---

## 9. 使用场景汇总

| 场景 | 代码模式 | 文件 |
|------|----------|------|
| 按类型查运行时数据 | `BuildingSystem.Ins.GetBuildingDataByType(type)` | `BuildingSystem_Util.cs` |
| 按类型查当前配置 | `BuildingSystem.Ins.GetBuildingConfigByType(type)` | `BuildingSystem_Util.cs` |
| UI 面板获取配置 | `baseBuildingPanel.GetBuildingConfig()` | `BuildingBasePanelController_Util.cs` |
| 遍历所有建筑算战力 | `foreach (var data in BuildingDataDict.Values) { data.GetCfg().Combat }` | `MainUIController.cs`, `SharedData_User.cs` |
| 服务器全量初始化 | `new ClientBuildingContainer()` + `AddBuildingDataByProto()` | `BuildingSystem_Net_Base.cs` |
| 服务器增量更新 | `dict[type].UpdateByProto(protoData)` | `BuildingSystem_Net_Base.cs` |
| 英雄升级标记 | `buildingContainer.LevelUpHeroUUid = uuid` / `= 0` | `HeroSystem_LvUp.cs` |

---

## 10. 相关文件索引

| 文件 | 内容 |
|------|------|
| `Assets/.../Logic/Model/UserData/ClientBuildingData.cs` | 数据结构定义（`ClientBuildingContainer` + `ClientBuildingData`） |
| `Assets/.../Logic/Model/UserData/UserData.cs:23` | 容器挂载点 `G.userData.buildingContainer` |
| `Assets/.../Logic/System/BuildingSystem/BuildingSystem_Net_Base.cs` | 协议处理，数据的创建与更新 |
| `Assets/.../Logic/System/BuildingSystem/BuildingSystem_Util.cs` | 查询方法（`GetBuildingDataByType` 等） |
| `Assets/.../Logic/UI/Building/BasePanel/BuildingBasePanelController_Util.cs` | UI 层对 `ClientBuildingData` 的访问封装 |
| `Assets/.../Logic/System/HeroSystem/HeroSystem_LvUp.cs` | `LevelUpHeroUUid` 的读写 |
| `Assets/.../Logic/UI/Main/MainUIController.cs:412` | 遍历 `BuildingDataDict` 计算战力 |
| `Assets/.../Logic/Model/UserData/SharedData_User.cs:208` | 遍历 `BuildingDataDict` 计算用户总战力 |
