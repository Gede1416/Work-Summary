# Superpowers 插件功能与使用指南

## 概述

Superpowers 是由 Jesse Vincent（obra）开发的一套 Claude Code 技能库，为 AI 编码代理提供了一套完整的软件开发方法论。核心理念是：**在写代码之前先想清楚要做什么**，通过结构化的技能体系引导 Agent 按正确的流程工作。

- **版本**：5.1.0
- **仓库**：https://github.com/obra/superpowers
- **安装方式**：`/plugin install superpowers@claude-plugins-official` 或 `npx skills add https://github.com/obra/superpowers -g -y`
- **技能数量**：14 个

---

## 技能体系全景

Superpowers 的 14 个技能覆盖了软件开发的完整生命周期，按工作阶段可分为四个层次：

```
┌─────────────────────────────────────────────────────────────┐
│                      前置设计层                              │
│  brainstorming  →  writing-plans                           │
│  (需求设计)         (制定计划)                               │
├─────────────────────────────────────────────────────────────┤
│                      执行实现层                              │
│  subagent-driven-development  /  executing-plans            │
│  (子代理驱动开发)                  (内联实施)                  │
│  dispatching-parallel-agents                                │
│  (并行子代理调度)                                            │
├─────────────────────────────────────────────────────────────┤
│                      质量保障层                              │
│  test-driven-development  verification-before-completion     │
│  (测试驱动开发)            (完成前验证)                       │
│  systematic-debugging      requesting-code-review            │
│  (系统化调试)              (请求代码审查)                     │
│  receiving-code-review                                       │
│  (接收代码审查)                                              │
├─────────────────────────────────────────────────────────────┤
│                   基础设施与元技能                            │
│  using-superpowers       using-git-worktrees                 │
│  (技能引导/元技能)        (Git Worktree隔离)                  │
│  writing-skills          finishing-a-development-branch      │
│  (编写技能)              (完成开发分支)                       │
└─────────────────────────────────────────────────────────────┘
```

### 标准工作流

```
user需求 → brainstorming(需求设计) → writing-plans(制定计划)
                                               ↓
                               subagent-driven-development(子代理执行)
                                               ↓
                               requesting-code-review(代码审查)
                                               ↓
                               verification-before-completion(完成验证)
                                               ↓
                               finishing-a-development-branch(分支清理)
```

---

## 一、前置设计层

### 1. brainstorming（需求设计）

**触发条件**：任何创造性工作开始之前——创建功能、构建组件、添加功能或修改行为。

**硬性规则**：
- **铁门禁**：在用户看到并批准设计方案之前，不得编写任何实现代码、脚手架或进行任何编码工作
- 每次只问一个问题，优先使用选择题
- 必须先探索项目上下文（文件、文档、最近提交）
- 必须提出 2-3 种方案并给出权衡分析和推荐

**执行流程**：
1. 探索项目上下文
2. 提供可视化 Companion（若适用，需独立消息）
3. 逐个提出澄清问题
4. 提出 2-3 种方案供选择
5. 分章节展示设计，逐章获取批准
6. 撰写设计文档 `docs/superpowers/specs/YYYY-MM-DD-<主题>-design.md`
7. 设计自查（检查占位符、矛盾、歧义、范围）
8. 用户审阅并批准
9. 唯一允许的下一步：**writing-plans**

**反模式**：即使最简单的项目也需要至少几行设计说明和批准——不允许跳过。

---

### 2. writing-plans（制定实施计划）

**触发条件**：已有设计文档或明确需求，准备开始实施之前。

**核心原则**：
- 计划文档必须假设实施者**对代码库零了解、品味不佳**——必须详尽到确切的代码、文件路径、测试命令和预期输出
- **微步粒度**：每个步骤 2-5 分钟可完成（"写失败测试" 是一步，"运行确认失败" 是下一步）

**计划文档格式要求**：
- 必须以特定头部格式开头，包含 `REQUIRED SUB-SKILL:` 行
- 每个步骤必须包含实际内容，**绝对禁止**占位符（TBD、TODO、later、fill in details）
- 不允许 "类似步骤 N"——必须重复完整代码
- 不允许引用未在任何步骤中定义的类型/函数/方法

**执行流程**：
1. 根据设计文档起草计划
2. 自查（设计覆盖度、占位符检查、类型一致性）
3. 保存到 `docs/superpowers/plans/YYYY-MM-DD-<功能>.md`
4. 展示两种执行选项：
   - **推荐**：Subagent-Driven Development（子代理驱动）
   - **备选**：Inline Execution（当前会话内联执行）

---

## 二、执行实现层

### 3. subagent-driven-development（子代理驱动开发）

**触发条件**：有执行计划且任务可独立并行时。

**核心原则**：**每个任务一个全新子代理 + 两阶段审查（规格合规 → 代码质量）= 高质量快速迭代**

**执行流程**：
1. 读取计划，提取所有任务，创建 TodoWrite
2. 对每个任务：
   - 启动 implementer 子代理（全新会话，不继承主会话上下文）
   - 子代理实现 → 自测 → commit → 自查
   - 启动 spec-compliance reviewer（规格合规审查）
   - 若有问题 → implementer 修复 → 重新审查（循环直到通过）
   - 启动 code-quality reviewer（代码质量审查）
   - 若有问题 → implementer 修复 → 重新审查（循环直到通过）
   - 标记任务完成
3. **连续执行**：不在任务之间停顿向用户报到，仅在 BLOCKED 或全部完成时停下
4. 所有任务完成后 → 最终代码审查 → 使用 finishing-a-development-branch

**子代理状态**：DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED

**绝不**：在主分支上开始、跳过审查、接受"差不多"、并行发派多个实现子代理、在任一审查有未解决问题时推进下一任务。

---

### 4. executing-plans（内联实施计划）

**触发条件**：当无法使用子代理时（如环境限制），作为 subagent-driven-development 的**备选方案**。

**核心区别**：在当前会话中按步骤内联执行（不使用子代理）。

**关键规则**：
- 必须先阅读并批判性审视计划，有问题先提出
- 按计划步骤严格执行
- 每个步骤必须验证
- **被阻塞时必须停下来求助**
- 完成后必须使用 finishing-a-development-branch

---

### 5. dispatching-parallel-agents（并行子代理调度）

**触发条件**：面对 2 个以上**彼此独立**的任务（无共享状态、无顺序依赖）。

**核心原则**：每个独立问题域一个代理，让它们并发工作。

**使用规则**：
- 每个代理获得一个**聚焦的、自包含的**提示，包含明确目标、约束和预期输出格式
- 代理**绝不**继承调度器的会话上下文或历史
- 代理返回后：审查每个摘要 → 检查冲突（是否编辑了相同代码）→ 运行完整测试套件 → 抽查

**不适用场景**：关联性故障、需要完整系统上下文、探索性调试、共享状态。

---

## 三、质量保障层

### 6. test-driven-development（测试驱动开发）

**触发条件**：实现任何功能或修复 Bug 之前。

**铁律**：**没有先写失败的测试，就不写生产代码**。

**Red-Green-Refactor 循环**：
1. **RED**：编写失败的测试
2. **验证 RED**：**必须**看到测试因正确原因失败（不可跳过！）
3. **GREEN**：编写刚好让测试通过的最少代码
4. **验证 GREEN**：确认测试通过
5. **REFACTOR**：清理代码，保持测试绿色

**关键规则**：
- 如果你先写了代码再写测试，**删除代码重新开始**
- 如果没看到测试失败，你就不知道它是否测了正确的东西
- 一次只测一个行为，清晰的命名，用真实代码（除非必须 mock）
- **例外**（需征得用户同意）：一次性原型、生成代码、配置文件

---

### 7. systematic-debugging（系统化调试）

**触发条件**：遇到任何 Bug、测试失败或异常行为时，**在提出修复方案之前**。

**铁律**：**未找到根本原因前绝不修复**。

**四阶段法**（必须按顺序执行，不可跳过）：

| 阶段 | 内容 |
|------|------|
| **Phase 1: 根因调查** | 仔细读错误信息 → 稳定复现 → 查最近变更 → 多组件系统注入诊断埋点 → 沿数据流逆向追踪 |
| **Phase 2: 模式分析** | 从同一代码库中找正常工作的对照 → 逐行比较 → 识别**所有**差异 → 理解依赖关系 |
| **Phase 3: 假设与测试** | 形成**单一**假设 → 做**最小**可能变更 → 一次只改一个变量 → 无效则形成新假设 |
| **Phase 4: 实施修复** | 先写失败测试（TDD）→ 实施单一修复 → 验证 → 失败则回到 Phase 1 |

**尝试次数控制**：
- < 3 次失败 → 回到 Phase 1
- ≥ 3 次失败 → **停止**，可能是架构问题，与用户讨论后再决定

---

### 8. verification-before-completion（完成前验证）

**触发条件**：在声明工作完成、修复成功或提交 PR 之前。

**铁律**：**没有新鲜验证证据，就不声称完成**。

**门控函数**：
1. IDENTIFY：确定验证命令
2. RUN：完整执行（新鲜、完整输出）
3. READ：阅读全部输出，检查退出码，数失败数
4. VERIFY：输出是否确认你的声明？
5. CLAIM：只有通过以上步骤才能声称完成

**预警信号词**："应该"、"可能"、"似乎"——这些是未验证的信号。

**禁止行为**：
- 在验证前表达满足感（"好了！"、"完成！"）
- 信任子代理报告而不独立验证
- "应该能用了"——运行验证再说

---

### 9. requesting-code-review（请求代码审查）

**触发条件**：子代理开发中每个任务完成后、完成主要功能后、合并到 main 之前。

**规则**：
- 派发一个代码审查子代理，使用精心构建的上下文（**绝不**传递主会话历史）
- 评审模板位于 `code-reviewer.md`
- 对反馈的处理优先级：Critical → 立即修 / Important → 修完再往下 / Minor → 记录后续处理
- 如果审查者错了，据理反驳

**绝不**：因为"简单"就跳过审查、忽略 Critical 问题、带未修复的 Important 问题继续。

---

### 10. receiving-code-review（接收代码审查）

**触发条件**：收到代码审查反馈，实施建议之前。

**核心原则**：先验证再实施。先问清楚再动手。技术正确性优先于社交舒适。

**禁止的回应**：
- "你说得对！"、"好主意！"、"太棒了！"、"我这就改"（在验证之前）
- 不得在未经确认的情况下表演性同意

**正确做法**：
- 重述技术要求
- 如果有任何不清楚的地方，**立即停止**——不要实施任何东西，先澄清
- 如果有技术错误，据理反驳
- 外部审查者的建议：检查在此代码库中的技术正确性、是否会破坏现有功能、审查者是否有完整上下文
- **YAGNI 检查**：如果审查者建议"正确实现"，先搜索代码库看是否真有人用

---

## 四、基础设施与元技能

### 11. using-superpowers（技能引导/元技能）

**触发条件**：每次对话开始时。

这是 Superpowers 的**元技能**，管理所有其他技能的加载和使用。

**核心规则**：
- 只要认为有 **1%** 的可能性某个技能适用，就必须调用该技能——不可协商
- 技能检查在澄清问题之前、在探索代码库之前、在任何操作之前
- 技能优先级：流程技能（brainstorming, debugging）→ 实现技能
- 子代理不加载此技能（SUBAGENT-STOP 门控）
- 用户指令（CLAUDE.md 等）始终具有最高优先级

---

### 12. using-git-worktrees（Git Worktree 隔离）

**触发条件**：开始需要隔离当前工作区的功能开发时，或执行实施计划之前。

**核心原则**：先检测已有隔离环境 → 优先使用原生工具 → 回退到 git → 绝不和现有环境打架。

**执行流程**：
- **Step 0**：检查是否已在隔离环境中
- **Step 1a**：优先使用原生 worktree 工具（如 EnterWorktree）
- **Step 1b**（备选）：无原生工具时才用 `git worktree add`
- 创建后自动检测并运行项目设置（npm install 等）
- **必须**验证测试基线（baseline tests 必须通过）

**绝不**：已在 worktree 中时再创建一个、有原生工具时用 git、跳过 .gitignore 验证、跳过基线测试。

---

### 13. finishing-a-development-branch（完成开发分支）

**触发条件**：实现完成、所有测试通过、需要决定如何整合工作时。

**执行流程**：
1. **检测环境**：普通仓库 vs. worktree vs. detached HEAD
2. **呈现 4 个选项**（普通仓库）：
   - Option 1: 本地合并
   - Option 2: 推送并创建 PR
   - Option 3: 保持现状（暂不合并）
   - Option 4: 丢弃更改（需输入 "discard" 确认）
3. **执行选择**
4. **清理**：仅 Option 1 和 4 清理 worktree

**安全规则**：
- 测试不通过 → 停止并报告
- 清理 worktree 前检查来源（只在 `.worktrees/`、`worktrees/`、`~/.config/superpowers/worktrees/` 下的才清理）
- 删除后运行 `git worktree prune`

---

### 14. writing-skills（编写技能）

**触发条件**：创建新技能、编辑已有技能、部署前验证技能时。

**铁律**：**没有先写失败的测试就不写技能**——这是 TDD 应用于过程文档。

**Red-Green-Refactor**：
- **RED**：不加载技能时，用子代理跑压力测试，建立基线，记录代理的合理化借口
- **GREEN**：写恰好解决那些违规的最小技能，再用相同场景测试——代理应当遵守
- **REFACTOR**：找出新的合理化借口，添加显式反击，构建合理化表，反复测试直到稳固

**写作规范**（CSO / Claude Search Optimization）：
- `description` 字段只能描述触发条件（"Use when..."），**不能**总结工作流
- 如果 description 总结了工作流，Claude 可能按描述行事而不读完整技能内容
- 频繁加载的技能控制在 200 词以内，其他控制在 500 词以内

---

## 技能间的协作关系

```
using-superpowers (元技能·入口)
       │
       ├── brainstorming ──→ writing-plans
       │                            │
       │              ┌─────────────┴─────────────┐
       │              ↓                           ↓
       │   subagent-driven-development    executing-plans
       │              │                           │
       │   ┌──────────┼──────────┐                │
       │   ↓          ↓          ↓                │
       │  TDD    requesting-  verification        │
       │           code-review  -before-          │
       │              │        completion         │
       │              ↓                           │
       │   receiving-code-review                  │
       │                                          │
       └──────────────┬──────────────────────────┘
                      ↓
      finishing-a-development-branch

独立的辅助技能：
  - systematic-debugging     (任意阶段可触发)
  - dispatching-parallel-agents  (任意阶段可触发)
  - using-git-worktrees      (执行前触发)
  - writing-skills           (仅当编写技能时触发)
```

---

## 安装与更新

### 安装
```bash
# 方式一：官方市场（CLI版本）
/plugin install superpowers@claude-plugins-official

# 方式二：社区市场（获取最新版）
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace

# 方式三：通用技能安装（适用于不支持 /plugin 的环境，如 VSCode Extension）
npx skills add https://github.com/obra/superpowers -g -y
```

### 更新
```bash
/plugin update superpowers
# 或
npx skills update superpowers -g -y
```

### 验证安装
安装后重启 Claude Code，运行 `/help` 即可看到 `superpowers:brainstorming`、`superpowers:write-plan` 等命令。

---

## 核心理念总结

Superpowers 的设计哲学贯穿全部 14 个技能：

1. **先想后做** — brainstorming + writing-plans 确保方向正确
2. **测试先行** — TDD 铁律，没有失败测试就不写代码
3. **根因优先** — 调试必须找到根因再修，禁止试错式修复
4. **证据说话** — 没有新鲜验证证据就不声称完成
5. **隔离执行** — 子代理独立会话 + worktree 隔离，减少上下文污染
6. **连续迭代** — 子代理驱动开发中不停顿汇报，一气呵成
7. **技术诚实** — 审查反馈中技术正确性优先于社交舒适，该反驳就反驳
