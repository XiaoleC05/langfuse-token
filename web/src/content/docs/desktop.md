---
title: 桌面应用
section: 入门
order: 2
---

> 桌面应用已发布（v0.1.0），支持 Windows / macOS / Linux 三平台。下载请前往[下载页](/download)或 GitHub Releases。

## 安装与系统要求

按平台提供以下下载方式：

| 平台 | 下载方式 | 适用场景 |
| --- | --- | --- |
| Windows | 安装包 (.exe) | 日常使用，开始菜单/桌面快捷方式 |
| Windows | 便携版 (.zip) | 免安装，U 盘 / 绿色使用 |
| macOS | .dmg（Apple Silicon） | 新款 M 系列 Mac |
| macOS | .dmg（Intel） | 老款 Intel Mac |
| Linux | .AppImage | 通用发行版，免安装 |
| Linux | .deb / .rpm | Debian/Ubuntu / Fedora/RHEL 包管理 |

## 配置本地代理

应用启动后会内置一个**本地代理**（默认端口 `17800`，监听 `127.0.0.1`）。把模型工具的 API 地址指向它，以 Claude Code 为例：

```bash
# 注意：BASE_URL 必须含 /api/proxy 前缀，否则请求 404、不落账
export ANTHROPIC_BASE_URL="http://localhost:17800/api/proxy/anthropic"
export OPENAI_BASE_URL="http://localhost:17800/api/proxy/openai"
```

之后每一次模型调用都会自动落账，无需其他操作。

## 数据与隐私

- 全部数据保存在本地，不经过任何云端
- API Key 只转发、不落库
- **多设备同步**（🚧 开发中）：计划支持登录账户后把本地账本同步到云端、多设备共用。当前数据全部保存在本地。
