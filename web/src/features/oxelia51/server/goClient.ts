import { TRPCError } from "@trpc/server";
import { env } from "@/src/env.mjs";

/** Oxelia51 Go 后端服务端代理客户端（凭证不下发浏览器）。 */

const API_BASE = "https://oxelia51.com";

// Go JWT 服务端缓存（单实例，按 expires_in 提前 60s 续期）
let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getGoToken(): Promise<string> {
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

/** 提取浏览器真实出口 IP（nginx 设置的 X-Forwarded-For 第一段） */
export function clientIpFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): string {
  const raw = headers["x-forwarded-for"];
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (!first) return "";
  return first.split(",")[0].trim();
}

export async function goFetch(
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
