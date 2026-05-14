# Lua 版本演进与 LuaJIT

## 详细描述

Lua 的版本演进非常稳定，5.x 系列持续了 20 年。理解各版本的差异和 LuaJIT 的独特优势对于选择正确的 Lua 发行版至关重要。

**Lua 5.1**（2006）：最广泛部署的版本。`module()` 系统、增量 GC 的雏形。LuaJIT 2.0 基于 5.1 API，因此 5.1 仍是事实上的"兼容基准"。

**Lua 5.2**（2011）：`_ENV` 取代 `setfenv`，引入 `goto` 语句；`__pairs`/`__ipairs` 等元方法。移除了 `module()`，模块系统回归简洁的 return table 模式。

**Lua 5.3**（2015）：引入整数子类型（64 位有符号整数），支持位运算（`&`、`|`、`~`、`<<`、`>>`、`//`、`math.type` 等）。这是 Lua 历史上最大的类型系统变化。

**Lua 5.4**（2020）：引入 `const` 属性（`local <const> x = 10`）、改进的 GC（分代模式）、`warn()` 函数、`to-be-closed` 变量、`__name` 和 `__close` 元方法。移除了 `bit32` 库（用原生位运算替代）。

**LuaJIT** 是 Mike Pall 编写的高性能 Lua 实现，核心优势：
- **追踪 JIT 编译器**：运行时检测热点循环并编译为机器码，速度达到 C 代码的 10-100×
- **FFI（Foreign Function Interface）**：可直接声明并调用 C 函数、访问 C 结构体，无需编写 C 绑定胶水代码
- **兼容性**：LuaJIT 2.0 兼容 Lua 5.1 API，LuaJIT 2.1（开发中）部分兼容 5.2

**版本选择建议**：新项目使用 Lua 5.4（最新稳定）；需要极致性能使用 LuaJIT 2.0/2.1；与 OpenResty/Redis/Neovim 配合使用它们内嵌的版本；游戏项目通常选择 LuaJIT。

## 推荐书籍

1. **《Programming in Lua》（第4版）** — Roberto Ierusalimschy，以 Lua 5.3 为基准。
2. **LuaJIT 官方文档**（luajit.org），FFI、JIT 优化提示和 `-jv` 诊断输出的详细参考。
3. **《Lua 5.4 Reference Manual》**（lua.org），新增特性的精确定义。
