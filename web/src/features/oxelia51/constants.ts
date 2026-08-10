/**
 * oxelia51 fork 的「文档」入口。
 *
 * v4 起指向站内文档站 `/docs`（快速开始/桌面应用/云平台/使用指南/统计/告警/账户/FAQ）。
 * 全站约 228 处 docs 链接统一走此常量，改一行即全切。
 */
export const OXELIA_DOCS_URL = "/docs";

/**
 * 平台超级管理员邮箱：唯一可执行写操作的管理员。
 * 单一来源——服务端 adminRouter 与前端 admin/shared.tsx 都从这里取，
 * 改这一处即同步两端，避免两侧常量漂移导致管理门禁失效。
 */
export const OXELIA_SUPER_ADMIN_EMAIL = "postmaster@oxelia51.com";
