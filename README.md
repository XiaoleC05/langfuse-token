<p align="center"><b>中文</b> · <a href="README.en.md">English</a></p>

# Oxelia51 Web

**只需要改一行环境变量，所有 Token 消耗一目了然。**

本仓库是 Oxelia51 的 **web 前端**：基于 Langfuse (MIT) fork + 深度定制，包含 Next.js 前端、worker 与共享包。产品主仓、部署与完整文档见 **[XiaoleC05/Oxelia51](https://github.com/XiaoleC05/Oxelia51)**。

- 在线体验：<https://oxelia51.com>
- 产品文档：<https://oxelia51.com/docs>
- 桌面应用下载：<https://oxelia51.com/download>
- 设计文档：[v4 产品设计](docs/superpowers/specs/2026-08-08-oxelia51-v4-design.md)（本地优先 · 桌面应用 · 弱认证 · 供应商/Agent 双维度，P1–P4）

## 技术栈

- Next.js（Pages Router）+ React + tRPC
- Prisma + PostgreSQL 17 · ClickHouse · Redis
- Langfuse (MIT) 定制基座

## 开发

```bash
pnpm install
pnpm --filter web run dev
```

## 说明

- 本仓库由 [langfuse/langfuse](https://github.com/langfuse/langfuse) fork 而来，保留 MIT 许可
- 遥测严格 opt-in，默认关闭，数据不流向第三方
- 代码编译一律在本地完成；部署走 CI → 容器镜像
- 桌面端（本地优先的主记账工具）在主仓 `Oxelia51/desktop`；本仓提供云平台界面与落地页/文档站

## 许可证

MIT License（fork 来源）— 详见 [LICENSE](LICENSE) 与 [ee/LICENSE](ee/LICENSE)
