# Langfuse 前端中文化术语表与翻译规范

本文件是 Langfuse Web 前端中文化的统一规范。所有翻译代理必须严格遵守。

## 总体规则

1. **翻译对象**:所有用户可见的英文文本,包括:
   - JSX 中的文本节点(`<Button>Save</Button>` → `<Button>保存</Button>`)
   - 字符串属性:`title`、`label`、`placeholder`、`description`、`aria-label`、`alt` 等
   - toast/notification 消息、对话框标题与内容、表单校验提示
   - 表格列头、下拉选项、空状态文案、错误提示(含 `TRPCError`/`Error` 中面向用户的消息)
   - 页面 `<title>`、`Head` 中的文本
2. **不翻译**:
   - 代码标识符:变量名、函数名、组件名、文件名、import 路径
   - 技术字段名/枚举值:如 `"TRACE"`、`"GENERATION"`、`role: "user"`、API 字段名、数据库值、URL、正则、环境变量名
   - HTML 标签属性中的非展示值:`className`、`id`、`data-testid`、`key`、`type`、`value`(当 value 是提交给后端的枚举值时)
   - 第三方产品名:Langfuse、PostHog、Slack、GitHub、Sentry、Datadog、ClickHouse、Postgres、Redis、Stripe、OpenAI、Anthropic、Google、AWS、Azure、Docker、Kubernetes
   - 协议/标准名:OpenTelemetry、OTel、API、SDK、LLM、URL、JSON、CSV、HTTP、SSE、MCP、RBAC、SSO、OIDC、SAML
   - 代码注释可翻译为中文(鼓励),JSDoc/TSDoc 也可翻译,但不要改变其含义
   - `console.log/error` 中的日志消息保留英文(开发者面向)
3. **格式保持**:
   - 保留插值:`"Hello {name}"` → `"你好 {name}"`,`${count} items` → `${count} 个项目`
   - 保留 JSX 嵌套结构:`<>Click <Link>here</Link></>` → `<>点击<Link>这里</Link></>`
   - 保留标点风格:中文界面使用中文标点(。,;:!?「」),但按钮/标签等短文案末尾不加句号
   - 中英文混排时,英文/数字与中文之间不加额外空格(遵循原字符串风格即可,不强制)
4. **风格**:简洁、书面、专业。按钮用动词短语(保存、删除、确认)。避免口语化。统一用「你」而非「您」。

## 核心术语表(必须统一)

| 英文 | 中文 |
|---|---|
| Trace / Traces | 追踪 |
| Observation | 观测 |
| Span | Span |
| Generation | 生成 |
| Event | 事件 |
| Session / Sessions | 会话 |
| Score / Scores | 评分 |
| Score Config | 评分配置 |
| Dataset / Datasets | 数据集 |
| Dataset Item | 数据集条目 |
| Dataset Run | 数据集运行 |
| Prompt / Prompts | 提示词 |
| Prompt Management | 提示词管理 |
| Playground | 试验场 |
| Evaluation / Evaluator | 评估 / 评估器 |
| Annotation | 标注 |
| Annotation Queue | 标注队列 |
| Dashboard | 仪表板 |
| Widget | 组件(仪表板语境)/小部件 |
| Project | 项目 |
| Organization | 组织 |
| Member | 成员 |
| Role | 角色 |
| API Key | API 密钥 |
| Public Key / Secret Key | 公钥 / 私钥 |
| Model | 模型 |
| Model Parameters | 模型参数 |
| Usage | 用量 |
| Token | Token(不译) |
| Cost | 成本 |
| Latency | 延迟 |
| Input / Output | 输入 / 输出 |
| Metadata | 元数据 |
| Tag | 标签 |
| Filter | 筛选 |
| Environment | 环境 |
| Release | 发布版本 |
| Version | 版本 |
| User | 用户 |
| Webhook | Webhook(不译) |
| Integration | 集成 |
| Settings | 设置 |
| Billing | 账单 |
| Usage | 用量 |
| Audit Log | 审计日志 |
| Background Migration | 后台迁移 |
| Media | 媒体 |
| Comment | 评论 |
| Bookmark / Star | 收藏 |
| Public | 公开 |
| Private | 私有 |
| Share | 分享 |
| Clone | 克隆 |
| Archive | 归档 |
| Delete | 删除 |
| Save | 保存 |
| Cancel | 取消 |
| Confirm | 确认 |
| Create | 创建 |
| Edit | 编辑 |
| Name | 名称 |
| Description | 描述 |
| Status | 状态 |
| Actions | 操作 |
| Search | 搜索 |
| Loading | 加载中 |
| No data | 暂无数据 |
| Retry | 重试 |
| Submit | 提交 |
| Apply | 应用 |
| Reset | 重置 |
| Clear | 清除 |
| Copy | 复制 |
| Download | 下载 |
| Upload | 上传 |
| Export | 导出 |
| Import | 导入 |
| Refresh | 刷新 |
| Back | 返回 |
| Next | 下一步 |
| Previous | 上一步 |
| Done | 完成 |
| Close | 关闭 |
| Open | 打开 |
| View | 查看 |
| Details | 详情 |
| Overview | 概览 |
| All | 全部 |
| None | 无 |
| Yes / No | 是 / 否 |
| Enabled / Disabled | 已启用 / 已禁用 |
| Active / Inactive | 活跃 / 未激活 |
| Created At / Updated At | 创建时间 / 更新时间 |
| Sign in / Sign out / Sign up | 登录 / 退出登录 / 注册 |
| Password | 密码 |
| Email | 邮箱 |
| LLM-as-a-Judge | LLM 评判(LLM-as-a-Judge) |
| Human Annotation | 人工标注 |
| Experiment | 实验 |
| Automation | 自动化 |
| Slack Integration | Slack 集成 |
| Blob Storage | 对象存储(Blob Storage) |
| Posthog Integration | PostHog 集成 |
| Mixpanel Integration | Mixpanel 集成 |
| Natural Language Filter | 自然语言筛选 |
| Command Menu | 命令菜单 |
| Notification | 通知 |
| Onboarding | 新手引导 |
| Documentation / Docs | 文档 |
| Upgrade | 升级 |
| Plan | 套餐(计费语境)/计划 |
| Entitlement | 权益 |
| Feature Flag | 功能开关 |
| Preview | 预览 |
| Timeline | 时间线 |
| Tree | 树状视图 |
| Table | 表格 |
| Chart | 图表 |
| Histogram | 直方图 |
| Date Range / Time Range | 日期范围 / 时间范围 |
| Lookback | 回溯 |
| Queue | 队列 |
| Retention | 保留期 |
| Self-host | 自托管 |
| Cloud | 云端(Langfuse Cloud 保留) |

## 常见句式

- "Are you sure...?" → "确定要……吗?"
- "This action cannot be undone." → "此操作无法撤销。"
- "Something went wrong" → "出错了"
- "Please try again" → "请重试"
- "No results found" → "未找到结果"
- "Select..." (placeholder) → "请选择…"
- "Search..." → "搜索…"
- "Optional" → "可选"
- "Required" → "必填"
- "Learn more" → "了解更多"
- "Get started" → "开始使用"
- "Coming soon" → "即将推出"
- "Last 7 days" → "最近 7 天"(时间范围以此类推)
- "X minutes ago" → "X 分钟前"
