---
title: 云平台使用
section: 使用
order: 3
---

云平台是 Oxelia51 的在线版本：不用本地部署，注册即可使用全部功能。数据存储在云端服务器。

## 注册与登录

- **使用云平台需要注册登录**（数据要落云端）；但浏览文档、下载、社区不需要登录
- 注册与登录入口在[登录页](/auth/sign-in)与[注册页](/auth/sign-up)
- 账户同样用于：跨设备同步（🚧 开发中）、管理员管理

## 创建项目

1. 登录后进入[首页](/)，点击「创建项目」
2. 填写项目名称
3. 创建后进入项目，获得该项目的**代理地址**与**项目密钥**

## 项目密钥

- 代理请求使用**项目密钥**鉴权，密钥在项目设置中生成与管理
- 密钥是识别请求归属项目的依据，用于统计归因

## 配置代理（改一行环境变量）

把模型工具的 API 地址改为代理地址。以 Claude Code 为例（Anthropic 客户端通用）：

```bash
# Anthropic 模型（Claude Code 等）
export ANTHROPIC_BASE_URL="https://oxelia51.com/api/proxy/anthropic"

# OpenAI 兼容模型（Cursor、ChatGPT 等）
export OPENAI_BASE_URL="https://oxelia51.com/api/proxy/openai"
```

之后所有模型调用的 Token 自动记录到该项目，并在仪表盘展示。

## 支持的模型与供应商

当前支持通过代理接入的主流模型，包括：

- **Anthropic**：Claude 系列
- **OpenAI**：GPT 系列
- **国内模型**：DeepSeek、Moonshot（Kimi）、智谱 GLM 等

内置 20+ 模型定价表，成本按实际用量自动换算。
