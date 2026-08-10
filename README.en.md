<p align="center"><a href="README.md">中文</a> · <b>English</b></p>

# Oxelia51 Web

**One-line config change. Complete token visibility.**

This repository is the **web frontend** of Oxelia51: a deep customization forked from Langfuse (MIT), including the Next.js frontend, worker, and shared packages. The product home repo, deployment, and full documentation live in **[XiaoleC05/Oxelia51](https://github.com/XiaoleC05/Oxelia51)**.

- Live site: <https://oxelia51.com>
- Product docs: <https://oxelia51.com/docs>
- Desktop app download: <https://oxelia51.com/download>
- Design doc: [v4 Product Design](docs/superpowers/specs/2026-08-08-oxelia51-v4-design.md) (local-first · desktop app · weak auth · provider/agent dimensions, P1–P4)

## Tech Stack

- Next.js (Pages Router) + React + tRPC
- Prisma + PostgreSQL 17 · ClickHouse · Redis
- Langfuse (MIT) customized base

## Development

```bash
pnpm install
pnpm --filter web run dev
```

## Notes

- Forked from [langfuse/langfuse](https://github.com/langfuse/langfuse), MIT license retained
- Telemetry is strictly opt-in and off by default; no data leaves for third parties
- All code compiles locally; deployment goes through CI → container images
- The desktop app (the primary local-first ledger tool) lives in `Oxelia51/desktop`; this repo provides the cloud-platform UI plus the landing page / docs site

## License

MIT License (fork source) — see [LICENSE](LICENSE) and [ee/LICENSE](ee/LICENSE)
