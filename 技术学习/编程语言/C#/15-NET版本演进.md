# .NET 版本演进

## 详细描述

.NET 从 Framework 到 Core 再到统一 .NET 5+，经历了一次重大的平台重构和性能飞跃。

**.NET Framework 4.x**（2002-2019）：仅 Windows，完整的 BCL 和运行时长期积累。ASP.NET MVC/WebForms、WPF、WinForms 等应用模型。

**.NET Core 1.0-3.1**（2016-2020）：跨平台重构。核心目标：小型化、模块化、高性能。ASP.NET Core（Kestrel 服务器）、EF Core。.NET Core 2.1 引入 `Span<T>`。

**.NET 5-6-7-8-9**（2020-2026）：统一平台。.NET 5 合并了 Framework 和 Core；.NET 6 LTS 引入 Minimal API、文件作用域命名空间；.NET 7 引入 `INumber<T>` 泛型数学；.NET 8 LTS 引入 Native AOT、Primary Constructors、集合表达式、`FrozenSet`/`FrozenDictionary`。.NET 9 进一步完善云原生和 AI 集成。

**关键差异**：.NET Framework 仅 Windows、机器级安装、`AppDomain` 隔离；.NET 5+ 跨平台、应用级部署、AssemblyLoadContext 隔离、Native AOT 编译。

**迁移建议**：从 .NET Framework 迁移到 .NET 5+ 时，首先检查 API 兼容性（.NET Portability Analyzer），将 WCF 替换为 gRPC/CoreWCF，WebForms 替换为 Blazor/Razor Pages，配置从 `web.config` 迁移到 `appsettings.json`。

## 推荐书籍

1. **《C# 12 in a Nutshell》** — Joseph Albahari，每个版本的 C# 特性都有标注和详解。
2. **《C# in Depth》（第4版）** — Jon Skeet，语言的版本演进历史和设计决策分析。
