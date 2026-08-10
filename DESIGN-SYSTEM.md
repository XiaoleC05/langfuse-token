# Oxelia51 前端 UI/UX 统一规范（入口）

本仓库（网站端 `web/`）的 UI/UX 统一规范与产品主仓（Oxelia51 桌面端）共享同一套标准。

- **规范全文（唯一标准）**：`Oxelia51/docs/design-system.md`
- **主题 tokens**：`web/src/features/theming/oxelia51-theme.css`（Cozy/Cosmos 双主题，两仓同步）
- **shadcn 变量映射**：`web/src/styles/oxelia51-vars.css`
- **字体变量**：`web/src/styles/globals.css`（`--font-sans` 等）

要点：不改 `--ox-*` 配色、不删任何功能；桌面端与网站的差异对齐见规范 §6。
