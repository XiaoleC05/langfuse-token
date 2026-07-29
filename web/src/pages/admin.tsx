"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { FilingInfo } from "@/src/components/FilingInfo";
import { env } from "@/src/env.mjs";

/**
 * Oxelia51 后台管理 v1：Go 后端运维状态页。
 * 独立于 Langfuse 布局（skipAppLayout），通过 Go 后端 API 获取数据。
 * 注意：/api/admin/* 有 IP 白名单限制，未放行的网络会返回 403。
 */

type HealthData = { status?: string; [k: string]: unknown };
type UptimeData = { uptime?: string; [k: string]: unknown };
type StatsData = Record<string, unknown>;

const TOKEN_KEY = "oxelia51-admin-token";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [health, setHealth] = useState<HealthData | null>(null);
  const [uptime, setUptime] = useState<UptimeData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY);
    if (saved) setToken(saved);
  }, []);

  const login = async () => {
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, password }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setLoginError(data.error ?? "登录失败，请检查账号密码");
        return;
      }
      sessionStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
    } catch {
      setLoginError("网络错误，无法连接后端");
    } finally {
      setLoggingIn(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void fetch("/api/health")
      .then((r) => r.json())
      .then((d: HealthData) => setHealth(d))
      .catch(() => setHealth(null));
    void fetch("/api/uptime")
      .then((r) => r.json())
      .then((d: UptimeData) => setUptime(d))
      .catch(() => setUptime(null));
    void fetch("/api/admin/server-stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (r.status === 403) {
          setStatsError("当前网络不在 IP 白名单内，无法读取服务器统计");
          return;
        }
        if (!r.ok) {
          setStatsError(`读取失败（HTTP ${r.status}）`);
          return;
        }
        setStats((await r.json()) as StatsData);
      })
      .catch(() => setStatsError("网络错误"));
  }, [token]);

  const basePath = env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <>
      <Head>
        <title>后台管理 | Oxelia51</title>
      </Head>
      <div className="min-h-dvh bg-background text-foreground">
        <header className="flex items-center gap-3 border-b px-6 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${basePath}/icon-64.png`} alt="Oxelia51" className="h-6 w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${basePath}/logo-64.png`} alt="Oxelia51" className="hidden h-6 w-auto dark:block" />
          <span className="text-sm font-semibold">后台管理</span>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground ml-auto text-xs"
          >
            ← 返回平台
          </Link>
        </header>

        <main className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
          {!token ? (
            <Card className="flex flex-col gap-3 p-6">
              <h2 className="text-lg font-semibold">管理员登录</h2>
              <p className="text-muted-foreground text-sm">
                使用 Go 后端管理员账号登录（非 Langfuse 账号）。
              </p>
              <Input
                placeholder="账号（邮箱或 account_id）"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
              />
              <Input
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void login()}
              />
              {loginError && (
                <p className="text-sm" style={{ color: "var(--ox-danger)" }}>
                  {loginError}
                </p>
              )}
              <Button onClick={() => void login()} disabled={loggingIn}>
                {loggingIn ? "登录中…" : "登录"}
              </Button>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card className="flex flex-col gap-1 p-4">
                  <span className="text-muted-foreground text-xs">服务健康</span>
                  <span
                    className="text-xl font-semibold"
                    style={{ color: "var(--ox-ok)" }}
                  >
                    {health ? "运行正常" : "获取中…"}
                  </span>
                </Card>
                <Card className="flex flex-col gap-1 p-4">
                  <span className="text-muted-foreground text-xs">运行时长</span>
                  <span className="text-xl font-semibold tabular-nums">
                    {uptime?.uptime ?? "获取中…"}
                  </span>
                </Card>
              </div>

              <Card className="flex flex-col gap-2 p-4">
                <span className="text-sm font-medium">服务器统计</span>
                {statsError ? (
                  <p className="text-sm" style={{ color: "var(--ox-warn)" }}>
                    {statsError}
                  </p>
                ) : stats ? (
                  <pre className="bg-muted max-h-80 overflow-auto rounded-md p-3 text-xs">
                    {JSON.stringify(stats, null, 2)}
                  </pre>
                ) : (
                  <p className="text-muted-foreground text-sm">获取中…</p>
                )}
              </Card>

              <Button
                variant="ghost"
                className="self-end"
                onClick={() => {
                  sessionStorage.removeItem(TOKEN_KEY);
                  setToken(null);
                  setStats(null);
                }}
              >
                退出管理员登录
              </Button>
            </>
          )}
        </main>

        <footer className="fixed inset-x-0 bottom-0 border-t bg-background py-1.5">
          <FilingInfo />
        </footer>
      </div>
    </>
  );
}

AdminPage.skipAppLayout = true;
