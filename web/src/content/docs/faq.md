---
title: FAQ
section: 帮助
order: 7
---

## 基础

**Q：Oxelia51 和 Langfuse 是什么关系？**
A：Oxelia51 的云平台基于 Langfuse（MIT）fork 并深度定制，融合了 Helicone 的代理记账理念，形成自己的产品。桌面应用为全新本地应用。

**Q：一定要注册才能用吗？**
A：不需要。桌面应用全功能本地使用；文档、下载、社区匿名开放。登录仅在跨设备同步、云平台、管理员时出现。

**Q：数据安全吗？**
A：桌面应用数据全部本地；云平台数据加密存储。API Key 只转发、不落库。

## 使用

**Q：改一行环境变量具体改哪里？**
A：在模型工具的配置文件里设置 `ANTHROPIC_BASE_URL` 或 `OPENAI_BASE_URL` 指向代理地址即可，见[云平台使用](/docs/cloud)。

**Q：会不会影响我的模型调用？**
A：代理只做转发与落账，不改写请求内容，正常调用不受影响。

**Q：支持哪些模型？**
A：Anthropic、OpenAI，以及 DeepSeek、Moonshot、智谱等国内模型；内置 20+ 定价表自动核算成本。

## 部署

**Q：可以自己部署吗？**
A：可以。一条 `docker compose up -d` 即可部署云平台，数据不离开你的服务器。部署说明见 [GitHub 仓库](https://github.com/XiaoleC05/Oxelia51)。

**Q：桌面应用和自托管有什么区别？**
A：桌面应用是面向个人、零部署的本地应用；自托管是自己部署云平台。两者数据模型一致，通过账户同步互通。

## 开发中

**Q：跨设备同步什么时候有？**
A：已支持。桌面端登录账户后即可把本地账本同步到云端，多设备共用。

**Q：桌面应用什么时候发布？**
A：已发布 v0.1.0，支持 Windows / macOS / Linux。在下载页或 GitHub Releases 获取。

## 反馈

**Q：怎么反馈问题或提需求？**
A：站内反馈、邮箱 receive@oxelia51.com，或 GitHub Issues / Discussions。
