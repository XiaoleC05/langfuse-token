import { z } from "zod";
import os from "node:os";
import { statfs } from "node:fs/promises";
import {
  authenticatedProcedure,
  createTRPCRouter,
} from "@/src/server/api/trpc";
import { env } from "@/src/env.mjs";
import { prisma } from "@langfuse/shared/src/db";
import { TRPCError } from "@trpc/server";
import {
  clientIpFromHeaders,
  getGoToken,
  goFetch,
} from "@/src/features/oxelia51/server/goClient";

/**
 * Oxelia51 后台管理 tRPC router。
 * Langfuse 登录态即管理员身份：服务端持有 Go 后端运维凭证换 JWT 转发，
 * 凭证不下发到浏览器。管理员由 OXELIA51_ADMIN_EMAILS 邮箱名单判定
 * （空名单 = 任何登录用户，仅建议内网使用）。
 */

function isAdminEmail(email: string | null | undefined): boolean {
  const allowlist = (env.OXELIA51_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (allowlist.length === 0) return true;
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

const whitelistIdSchema = z.object({ id: z.string().regex(/^\d+$/, "无效的 id") });

export const oxelia51AdminRouter = createTRPCRouter({
  /** 前端据此决定后台管理入口可见性（任何登录用户可调） */
  whoami: authenticatedProcedure.query(({ ctx }) => {
    return {
      email: ctx.session.user.email,
      isAdmin: isAdminEmail(ctx.session.user.email),
    };
  }),

  health: adminProcedure.query(() => goFetch("/api/health", "GET", undefined, false)),
  uptime: adminProcedure.query(() => goFetch("/api/uptime", "GET", undefined, false)),
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
      uptimeSeconds: Math.round(os.uptime()),
    };
  }),
  dormPower: adminProcedure.query(() =>
    goFetch(
      `/api/tools/dormguard/proxy/api/power/records/${env.OXELIA51_DORM_NUMBER ?? "320"}/latest`,
      "GET",
    ),
  ),

  /** 手动触发一次电费抓取（DormGuard /api/system/crawl） */
  dormPowerRefresh: adminProcedure.mutation(() =>
    goFetch("/api/tools/dormguard/proxy/api/system/crawl", "POST"),
  ),

  whitelistList: adminProcedure.query(({ ctx }) =>
    goFetch("/api/admin/ip-whitelist", "GET", undefined, true, clientIpFromHeaders(ctx.headers)),
  ),
  whitelistCreate: adminProcedure
    .input(z.object({ ip: z.string().min(3), label: z.string().default("") }))
    .mutation(({ ctx, input }) =>
      goFetch("/api/admin/ip-whitelist", "POST", input, true, clientIpFromHeaders(ctx.headers)),
    ),
  whitelistUpdate: adminProcedure
    .input(whitelistIdSchema.extend({ ip: z.string().min(3), label: z.string().default("") }))
    .mutation(({ ctx, input }) =>
      goFetch(`/api/admin/ip-whitelist/${input.id}`, "PATCH", {
        ip: input.ip,
        label: input.label,
      }, true, clientIpFromHeaders(ctx.headers)),
    ),
  whitelistDelete: adminProcedure
    .input(whitelistIdSchema)
    .mutation(({ ctx, input }) =>
      goFetch(`/api/admin/ip-whitelist/${input.id}`, "DELETE", undefined, true, clientIpFromHeaders(ctx.headers)),
    ),

  /** 平台用户列表：直查 Langfuse 用户表（不走 Go 后端） */
  usersList: adminProcedure.query(async () => {
    const users = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string | null;
        email: string | null;
        created_at: Date;
        memberships: unknown;
      }>
    >`
      SELECT u.id, u.name, u.email, u.created_at,
             COALESCE(
               json_agg(json_build_object('org', o.name, 'role', om.role))
                 FILTER (WHERE om.user_id IS NOT NULL),
               '[]'
             ) AS memberships
      FROM users u
      LEFT JOIN organization_memberships om ON om.user_id = u.id
      LEFT JOIN organizations o ON o.id = om.org_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT 200
    `;
    return { items: users };
  }),

  /** 用户反馈列表（oxelia51.feedback，按时间倒序，只读） */
  listFeedback: adminProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(200).default(50) })
        .optional(),
    )
    .query(async ({ input }) => {
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
});
