import { z } from "zod";
import os from "node:os";
import { randomBytes } from "node:crypto";
import { statfs } from "node:fs/promises";
import {
  authenticatedProcedure,
  createTRPCRouter,
} from "@/src/server/api/trpc";
import { env } from "@/src/env.mjs";
import { Prisma, prisma } from "@langfuse/shared/src/db";
import { sendFeedbackReplyEmail } from "@langfuse/shared/src/server";
import { TRPCError } from "@trpc/server";
import { updateUserPassword } from "@/src/features/auth-credentials/lib/credentialsServerUtils";
import { checkUserCanBeDeleted } from "@/src/server/api/routers/userAccount";
import {
  clientIpFromHeaders,
  getGoToken,
  goFetch,
} from "@/src/features/oxelia51/server/goClient";
import { OXELIA_SUPER_ADMIN_EMAIL } from "@/src/features/oxelia51/constants";

/**
 * Oxelia51 后台管理 tRPC router。
 * Langfuse 登录态即管理员身份：服务端持有 Go 后端运维凭证换 JWT 转发，
 * 凭证不下发到浏览器。
 * 权限两级：
 * - 管理员（adminProcedure）：OXELIA_SUPER_ADMIN_EMAIL 恒为管理员，
 *   外加 OXELIA51_ADMIN_EMAILS 邮箱名单（空名单 = 除超级管理员外无人是管理员）。
 * - 超级管理员（superAdminProcedure）：仅 OXELIA_SUPER_ADMIN_EMAIL，
 *   所有写操作（白名单增删、电费抓取、反馈流转）仅其可执行。
 */

function isSuperAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email) && email === OXELIA_SUPER_ADMIN_EMAIL;
}

function isAdminEmail(email: string | null | undefined): boolean {
  // 超级管理员永远拥有管理员权限（即使 env 名单漏配）
  if (isSuperAdminEmail(email)) return true;
  const allowlist = (env.OXELIA51_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  // 空名单视为未配置：拒绝所有人，而非放行所有人
  if (allowlist.length === 0) return false;
  return Boolean(email) && allowlist.includes(email as string);
}

/** 仅管理员的 procedure（在登录态之上再校验邮箱名单） */
const adminProcedure = authenticatedProcedure.use(({ ctx, next }) => {
  if (!isAdminEmail(ctx.session.user.email)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "当前账户无后台管理权限",
    });
  }
  return next();
});

/** 仅超级管理员的 procedure：所有写操作走此入口 */
const superAdminProcedure = authenticatedProcedure.use(({ ctx, next }) => {
  if (!isSuperAdminEmail(ctx.session.user.email)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "仅超级管理员可执行此操作",
    });
  }
  return next();
});

const whitelistIdSchema = z.object({ id: z.string().regex(/^\d+$/, "无效的 id") });

export const oxelia51AdminRouter = createTRPCRouter({
  /** 前端据此决定后台管理入口可见性、操作按钮显隐（任何登录用户可调） */
  whoami: authenticatedProcedure.query(({ ctx }) => {
    return {
      email: ctx.session.user.email,
      isAdmin: isAdminEmail(ctx.session.user.email),
      isSuperAdmin: isSuperAdminEmail(ctx.session.user.email),
    };
  }),

  serverStats: adminProcedure.query(() =>
    goFetch("/api/admin/server-stats", "GET"),
  ),

  /** 代理网关状态（QPS/延迟/成功率/供应商分布） */
  gatewayStats: adminProcedure.query(() =>
    goFetch("/api/admin/gateway-stats", "GET"),
  ),

  /** 腾讯云服务器状态：langfuse-web 容器所在主机（本进程读取） */
  localStats: adminProcedure.query(async () => {
    const load = (os.loadavg()[0] / os.cpus().length) * 100;
    const totalMem = os.totalmem();
    const usedMem = totalMem - os.freemem();
    let diskUsedPercent: number | null = null;
    let diskTotalGB: number | null = null;
    try {
      const st = await statfs("/");
      const total = st.blocks * st.bsize;
      const free = st.bavail * st.bsize;
      diskTotalGB = Math.round(total / 1e9);
      diskUsedPercent = ((total - free) / total) * 100;
    } catch {
      // statfs 不可用时留空
    }
    return {
      cpuPercent: load,
      memoryUsedMB: Math.round(usedMem / 1048576),
      memoryTotalMB: Math.round(totalMem / 1048576),
      diskUsedPercent,
      diskTotalGB,
      // 容器内 os.uptime() 返回宿主机时长；另给进程时长（容器重启归零，部署后符合直觉）
      uptimeSeconds: Math.round(os.uptime()),
      processUptimeSeconds: Math.round(process.uptime()),
    };
  }),
  dormPower: adminProcedure.query(() =>
    goFetch(
      `/api/tools/dormguard/proxy/api/power/records/${env.OXELIA51_DORM_NUMBER ?? "320"}/latest`,
      "GET",
    ),
  ),

  /** 手动触发一次电费抓取（DormGuard /api/system/crawl）——写操作，仅超级管理员 */
  dormPowerRefresh: superAdminProcedure.mutation(() =>
    goFetch("/api/tools/dormguard/proxy/api/system/crawl", "POST"),
  ),

  whitelistList: adminProcedure.query(({ ctx }) =>
    goFetch("/api/admin/ip-whitelist", "GET", undefined, true, clientIpFromHeaders(ctx.headers)),
  ),
  whitelistCreate: superAdminProcedure
    .input(
      z.object({
        // 只允许 IPv4/IPv6 或 CIDR，避免把任意字符串写入白名单
        ip: z.string().regex(
          /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}(\/\d{1,2})?|[0-9a-fA-F:]+(\/\d{1,3})?)$/,
          "请输入合法 IP 或 CIDR（如 1.2.3.4 或 1.2.3.0/24）",
        ),
        label: z.string().max(50).default(""),
      }),
    )
    .mutation(({ ctx, input }) =>
      goFetch("/api/admin/ip-whitelist", "POST", input, true, clientIpFromHeaders(ctx.headers)),
    ),
  whitelistDelete: superAdminProcedure
    .input(whitelistIdSchema)
    .mutation(({ ctx, input }) =>
      goFetch(`/api/admin/ip-whitelist/${input.id}`, "DELETE", undefined, true, clientIpFromHeaders(ctx.headers)),
    ),

  /** 平台用户列表：直查 Langfuse 用户表（不走 Go 后端），支持邮箱/姓名模糊搜索 + OFFSET 分页 */
  usersList: adminProcedure
    .input(
      z
        .object({
          search: z.string().trim().max(100).optional(),
          limit: z.number().int().min(1).max(100).default(20),
          offset: z.number().int().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      // 转义 LIKE 通配符，防止搜索词里的 %/_/\ 被当作模式字符
      const search = input?.search ?? "";
      const like = `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      const [users, totalRows] = await Promise.all([
        prisma.$queryRaw<
          Array<{
            id: string;
            name: string | null;
            email: string | null;
            created_at: Date;
            updated_at: Date;
            memberships: unknown;
          }>
        >`
          SELECT u.id, u.name, u.email, u.created_at, u.updated_at,
                 COALESCE(
                   json_agg(
                     json_build_object(
                       'org', o.name,
                       'role', om.role,
                       'projects', COALESCE(pm.projects, '[]'::json)
                     )
                   )
                     FILTER (WHERE om.user_id IS NOT NULL),
                   '[]'
                 ) AS memberships
          FROM users u
          LEFT JOIN organization_memberships om ON om.user_id = u.id
          LEFT JOIN organizations o ON o.id = om.org_id
          LEFT JOIN LATERAL (
            SELECT json_agg(json_build_object('project', p.name, 'role', pm2.role)) AS projects
            FROM project_memberships pm2
            JOIN projects p ON p.id = pm2.project_id
            WHERE pm2.org_membership_id = om.id
          ) pm ON true
          WHERE (${search} = '' OR u.email ILIKE ${like} OR u.name ILIKE ${like})
          GROUP BY u.id
          ORDER BY u.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
        prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) AS count FROM users u
          WHERE (${search} = '' OR u.email ILIKE ${like} OR u.name ILIKE ${like})
        `,
      ]);
      return { items: users, total: Number(totalRows[0]?.count ?? 0) };
    }),

  /**
   * 重置用户密码：生成 12 位随机临时密码并写库（复用 credentials 的 bcrypt 哈希）。
   * 临时密码仅在本次响应返回，不落明文日志、不入库明文。——写操作，仅超级管理员
   */
  adminResetUserPassword: superAdminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, email: true },
      });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "用户不存在" });
      }
      // 9 字节 → base64url 编码恰为 12 字符，满足 isValidPassword（≥8 位）
      const tempPassword = randomBytes(9).toString("base64url");
      await updateUserPassword(user.id, tempPassword);
      return { email: user.email, tempPassword };
    }),

  /**
   * 删除用户：复用账户自删（userAccount.delete）的「组织最后所有者」校验 +
   * schema 外键级联删除（会员关系/会话/账户等）。——写操作，仅超级管理员
   * 保护：不能删除自己、不能删除 OXELIA_SUPER_ADMIN_EMAIL。
   */
  adminDeleteUser: superAdminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "不能删除当前登录的管理员账户",
        });
      }
      const target = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, email: true },
      });
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "用户不存在" });
      }
      if (target.email === OXELIA_SUPER_ADMIN_EMAIL) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "不能删除超级管理员账户",
        });
      }
      await prisma.$transaction(
        async (tx) => {
          const { canDelete, blockingOrganizations } =
            await checkUserCanBeDeleted(target.id, tx);
          if (!canDelete) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: `该用户是组织「${blockingOrganizations.map((o) => o.name).join("、")}」的唯一所有者，请先移交所有者或删除对应组织`,
            });
          }
          await tx.user.delete({ where: { id: target.id } });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return { success: true, email: target.email };
    }),

  /** 用户反馈列表（oxelia51.feedback，按时间倒序；status 可选筛选） */
  listFeedback: adminProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(200).default(50),
          status: z.enum(["new", "processing", "done"]).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      // 空字符串表示不过滤（Prisma 标签模板不便传 undefined）
      const status = input?.status ?? "";
      const rows = await prisma.$queryRaw<
        Array<{
          id: unknown;
          email: string;
          category: string;
          message: string;
          project_id: string | null;
          status: string;
          created_at: Date;
        }>
      >`
        SELECT id, email, category, message, project_id, status, created_at
        FROM oxelia51.feedback
        WHERE (${status} = '' OR status = ${status})
        ORDER BY created_at DESC
        LIMIT ${input?.limit ?? 50}
      `;
      return {
        items: rows.map((r) => ({
          id: Number(r.id),
          email: r.email,
          category: r.category,
          message: r.message,
          projectId: r.project_id,
          status: r.status,
          createdAt: r.created_at,
        })),
      };
    }),

  /** 反馈状态流转：new → processing → done ——写操作，仅超级管理员 */
  updateFeedbackStatus: superAdminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["new", "processing", "done"]),
      }),
    )
    .mutation(async ({ input }) => {
      await prisma.$executeRaw`
        UPDATE oxelia51.feedback SET status = ${input.status} WHERE id = ${input.id}
      `;
      return { success: true };
    }),

  /**
   * 回复用户反馈：向反馈者邮箱发送回复邮件（Oxelia51 品牌模板，引用原反馈摘要），
   * 并将该反馈状态置为 done。——写操作，仅超级管理员
   */
  replyFeedback: superAdminProcedure
    .input(
      z.object({
        feedbackId: z.number().int().positive(),
        message: z
          .string()
          .trim()
          .min(1, "回复内容不能为空")
          .max(2000, "回复内容不能超过 2000 字"),
      }),
    )
    .mutation(async ({ input }) => {
      const rows = await prisma.$queryRaw<
        Array<{ id: unknown; email: string; message: string }>
      >`
        SELECT id, email, message FROM oxelia51.feedback WHERE id = ${input.feedbackId} LIMIT 1
      `;
      const feedback = rows[0];
      if (!feedback) {
        throw new TRPCError({ code: "NOT_FOUND", message: "反馈不存在" });
      }
      // 发送失败仅在服务端记日志（sender 内部兜底），此处不阻断状态流转
      await sendFeedbackReplyEmail({
        env: {
          EMAIL_FROM_ADDRESS: env.EMAIL_FROM_ADDRESS,
          SMTP_CONNECTION_URL: env.SMTP_CONNECTION_URL,
        },
        to: feedback.email,
        replyMessage: input.message,
        feedbackMessage: feedback.message,
      });
      await prisma.$executeRaw`
        UPDATE oxelia51.feedback SET status = 'done' WHERE id = ${input.feedbackId}
      `;
      return { success: true };
    }),

  /** 平台总览指标：注册用户/项目/待处理反馈/近 24h 告警（直查 PG，只读聚合） */
  platformOverview: adminProcedure.query(async () => {
    const [users, projects, pendingFeedback, alerts24h] = await Promise.all([
      prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) AS count FROM users`,
      prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) AS count FROM projects`,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count FROM oxelia51.feedback WHERE status = 'new'
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count FROM oxelia51.alert_logs
        WHERE created_at > now() - interval '24 hours'
      `,
    ]);
    return {
      userCount: Number(users[0]?.count ?? 0),
      projectCount: Number(projects[0]?.count ?? 0),
      pendingFeedbackCount: Number(pendingFeedback[0]?.count ?? 0),
      alertsLast24hCount: Number(alerts24h[0]?.count ?? 0),
    };
  }),

  /** 跨项目最近告警记录（oxelia51.alert_logs，由外部分析引擎写入，只读） */
  listAlertLogs: adminProcedure.query(async () => {
    const rows = await prisma.$queryRaw<
      Array<{
        id: unknown;
        project_id: string;
        alert_type: string;
        severity: string;
        message: string | null;
        status: string;
        created_at: Date;
      }>
    >`
      SELECT id, project_id, alert_type, severity, message, status, created_at
      FROM oxelia51.alert_logs
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return {
      items: rows.map((r) => ({
        id: Number(r.id),
        projectId: r.project_id,
        alertType: r.alert_type,
        severity: r.severity,
        message: r.message ?? "",
        status: r.status,
        createdAt: r.created_at,
      })),
    };
  }),

  /**
   * 平台级近 14 天用量趋势：直查 oxelia51.daily_stats 汇总全部项目（只读）。
   * generate_series 补齐无数据日期（0 值），保证图表 X 轴连续；
   * 日期服务端格式化为 YYYY-MM-DD 字符串，避免 timestamp 跨时区偏移；
   * bigint / numeric 聚合值统一转 Number。
   */
  platformDailyTrend: adminProcedure.query(async () => {
    const rows = await prisma.$queryRaw<
      Array<{ day: string; tokens: unknown; cost_usd: unknown }>
    >`
      SELECT to_char(d.date, 'YYYY-MM-DD') AS day,
             COALESCE(sum(s.total_tokens), 0) AS tokens,
             COALESCE(sum(s.cost_usd), 0) AS cost_usd
      FROM generate_series(CURRENT_DATE - 13, CURRENT_DATE, interval '1 day') AS d(date)
      LEFT JOIN oxelia51.daily_stats s ON s.date = d.date
      GROUP BY d.date
      ORDER BY d.date ASC
    `;
    return rows.map((r) => ({
      day: r.day,
      tokens: Number(r.tokens ?? 0),
      costUsd: Number(r.cost_usd ?? 0),
    }));
  }),
});
