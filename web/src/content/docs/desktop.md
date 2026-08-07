---
title: 桌面应用
section: 入门
order: 2
---

> 桌面应用正在开发中（🚧 规划中），以下为已确定的方向；发布后本页更新为实际使用说明。

## 安装与系统要求

计划提供以下下载方式（发布后本站与 GitHub 提供下载）：

| 平台 | 下载方式 | 适用场景 |
| --- | --- | --- |
| Windows | 安装包 (.exe) | 日常使用，开始菜单/桌面快捷方式 |
| Windows | 便携版 (.zip) | 免安装，U 盘 / 绿色使用 |
| macOS | .dmg（Apple Silicon） | 新款 M 系列 Mac |
| macOS | .dmg（Intel） | 老款 Intel Mac |
| Linux | .AppImage | 通用发行版，免安装 |
| Linux | .deb / .rpm | Debian/Ubuntu / Fedora/RHEL 包管理 |

## 配置本地代理

应用启动后会内置一个**本地代理**（默认端口 `17800`，可在设置中修改）。把模型工具的 API 地址指向它，例如 Claude Code：

```bash
export ANTHROPIC_BASE_URL="http://localhost:17800/anthropic"
```

之后每一次模型调用都会自动落账，无需其他操作。

## 数据与隐私

- 全部数据保存在本地，不经过任何云端
- API Key 只转发、不落库
- 账户仅用于可选的跨设备同步（🚧 开发中），默认不开启
