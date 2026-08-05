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

/**
 * Oxelia51 后台管理 tRPC router。
 * Langfuse 登录态即管理员身份：服务端持有 Go 后端运维凭证换 JWT 转发，
 * 凭证不下发到浏览器。管理员由 OXELIA51_ADMIN_EMAILS 邮箱名单判定
 * （空名单 = 任何登录用户，仅建议内网使用）。
 */

const API_BASE = "https://oxelia51.com";

// Go JWT 服务端缓存（单实例，按 expires_in 提前 60s 续期）
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getGoToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }
  const account = env.OXELIA51_ADMIN_ACCOUNT;
  const password = env.OXELIA51_ADMIN_PASSWORD;
  if (!account || !password) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "运维凭证未配置（OXELIA51_ADMIN_ACCOUNT/PASSWORD）",
    });
  }
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account, password }),
  });
  const data = (await res.json()) as { token?: string; expires_in?: number };
  if (!res.ok || !data.token) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: `运维登录失败（HTTP ${res.status}）`,
    });
  }
  const ttl = (data.expires_in ?? 3600) * 1000;
  cachedToken = { token: data.token, expiresAt: Date.now() + ttl - 60_000 };
  return cachedToken.token;
}

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

/** 提取浏览器真实出口 IP（nginx 设置的 X-Forwarded-For 第一段） */
function clientIpFromHeaders(headers: Record<string, string | string[] | undefined>): string {
  const raw = headers["x-forwarded-for"];
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (!first) return "";
  return first.split(",")[0].trim();
}

async function goFetch(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: unknown,
  auth = true,
  clientIp?: string,
): Promise<unknown> {
  const headers: Record<string, string> = {};
  if (auth) headers.Authorization = `Bearer ${await getGoToken()}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  // 转发浏览器真实出口 IP，Go 后端据此返回/校验 clientIP
  // （Langfuse 部署在腾讯云，直接连接时 Go 后端看到的是腾讯云 IP）
  if (clientIp) headers["X-Oxelia51-Client-IP"] = clientIp;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error: unknown }).error)
        : `HTTP ${res.status}`;
    throw new TRPCError({ code: "BAD_GATEWAY", message: msg });
  }
  return data;
}

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
});
