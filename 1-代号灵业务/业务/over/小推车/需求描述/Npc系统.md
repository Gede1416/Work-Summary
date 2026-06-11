# 需求
- 添加一个Npc管理系统，用于管理Npc的创建、删除、行为控制

# 输入
- npc资源 读取表 show_npc{id,name,icon,bodyAnim } 
    1. id  510001~510009
    2. icon 图片资源
    3. npc Prefab  资源

- 初始化数据
    1. 生成间隔
    2. 生成数量
    3. 生成位置
    4. Npc行为

# 输出
- 定时生成Npc
- 随机npc资源
- 生成随机在屏幕边缘

# 步骤
- @Assets\Scripts\Hot\Logic\System\BuildingSystem\Manager\BuildingNpcManager.cs 进行逻辑处理
- @Assets\Scripts\Hot\Logic\System\BuildingSystem\BuildingSystem_Mgr.cs 保存对应管理器 包装操作
- @Assets\Scripts\Hot\Logic\System\MapSystem 位置转换
- @F:\Goethe\Notes\Work-Summary\1-代号灵业务\业务 部分系统基础描述
- 提问的方式去确认需求


# 功能整理
- 添加新的Npc批次
- 删除指定Npc批次
- 删除全部Npc批次
- 创建Npc