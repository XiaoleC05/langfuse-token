import type { NextApiRequest, NextApiResponse } from "next";
import { getServerAuthSession } from "@/src/server/auth";
import { env } from "@/src/env.mjs";

/**
 * Oxelia51 后台管理代理路由。
 * Langfuse 登录态即管理员身份：本路由在服务端持有 Go 后端运维凭证，
 * 换取 JWT 后转发到 Go 后端 admin API，凭证不下发到浏览器。
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
    throw new Error("运维凭证未配置（OXELIA51_ADMIN_ACCOUNT/PASSWORD）");
  }
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account, password }),
  });
  const data = (await res.json()) as { token?: string; expires_in?: number };
  if (!res.ok || !data.token) {
    throw new Error(`运维登录失败（HTTP ${res.status}）`);
  }
  const ttl = (data.expires_in ?? 3600) * 1000;
  cachedToken = { token: data.token, expiresAt: Date.now() + ttl - 60_000 };
  return cachedToken.token;
}

type ActionDef = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: (req: NextApiRequest) => string;
  auth: boolean;
};

const dorm = () => env.OXELIA51_DORM_NUMBER ?? "320";

const ACTIONS: Record<string, ActionDef> = {
  health: { method: "GET", path: () => "/api/health", auth: false },
  uptime: { method: "GET", path: () => "/api/uptime", auth: false },
  "server-stats": {
    method: "GET",
    path: () => "/api/admin/server-stats",
    auth: true,
  },
  "whitelist-list": {
    method: "GET",
    path: () => "/api/admin/ip-whitelist",
    auth: true,
  },
  "whitelist-create": {
    method: "POST",
    path: () => "/api/admin/ip-whitelist",
    auth: true,
  },
  "whitelist-update": {
    method: "PATCH",
    path: (req) => `/api/admin/ip-whitelist/${String(req.query.id ?? "")}`,
    auth: true,
  },
  "whitelist-delete": {
    method: "DELETE",
    path: (req) => `/api/admin/ip-whitelist/${String(req.query.id ?? "")}`,
    auth: true,
  },
  "dorm-power": {
    method: "GET",
    path: () =>
      `/api/tools/dormguard/proxy/api/power/records/${dorm()}/latest`,
    auth: true,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // 1. Langfuse 登录态校验
  const session = await getServerAuthSession({ req, res });
  if (!session?.user?.email) {
    return res.status(401).json({ error: "请先登录平台账户" });
  }
  // 2. 可选管理员邮箱白名单
  const allowlist = (env.OXELIA51_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (allowlist.length > 0 && !allowlist.includes(session.user.email)) {
    return res.status(403).json({ error: "当前账户无后台管理权限" });
  }

  const action = String(req.query.action ?? "");
  const def = ACTIONS[action];
  if (!def) {
    return res.status(404).json({ error: `未知操作: ${action}` });
  }
  if (req.method !== def.method) {
    return res.status(405).json({ error: "方法不允许" });
  }

  try {
    const headers: Record<string, string> = {};
    if (def.auth) headers.Authorization = `Bearer ${await getGoToken()}`;
    let body: string | undefined;
    if (def.method !== "GET") {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(req.body ?? {});
    }
    const upstream = await fetch(`${API_BASE}${def.path(req)}`, {
      method: def.method,
      headers,
      body,
    });
    const text = await upstream.text();
    res.status(upstream.status);
    try {
      return res.json(JSON.parse(text));
    } catch {
      return res.send(text);
    }
  } catch (error) {
    return res.status(502).json({
      error: error instanceof Error ? error.message : "上游请求失败",
    });
  }
}
