"use client";

import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { FilingInfo } from "@/src/components/FilingInfo";
import { env } from "@/src/env.mjs";
import { Trash2, RefreshCw } from "lucide-react";

/**
 * Oxelia51 后台管理 v2。
 * 统一登录：Langfuse 登录态直接进入；数据经 /api/oxelia-admin/* 服务端代理获取。
 */

type ServerStats = {
  cpu_percent?: number;
  memory_used_mb?: number;
  memory_total_mb?: number;
  disk_used_percent?: number;
  disk_total_gb?: number;
  uptime_seconds?: number;
  go_goroutines?: number;
};

type PowerRecord = {
  kbalance?: number | null;
  zbalance?: number | null;
  record_time?: string;
};

type WhitelistItem = {
  id: number;
  ip: string;
  label: string;
  created_at?: string;
};

const POLL_MS = 5000;

function usePolling<T>(action: string, enabled: boolean) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/oxelia-admin/${action}`);
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setError(d.error ?? `HTTP ${res.status}`);
        return;
      }
      setError("");
      setData((await res.json()) as T);
    } catch {
      setError("网络错误");
    }
  }, [action]);

  useEffect(() => {
    if (!enabled) return;
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [enabled, load]);

  return { data, error, reload: load };
}

function formatUptime(seconds?: number) {
  if (!seconds) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d > 0 ? `${d} 天 ${h} 小时` : `${h} 小时 ${m} 分`;
}

function LiveDot() {
  return (
    <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--ox-ok)" }}>
      <span className="relative flex h-2 w-2">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
          style={{ backgroundColor: "var(--ox-ok)" }}
        />
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: "var(--ox-ok)" }}
        />
      </span>
      实时
    </span>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const authed = status === "authenticated" && Boolean(session?.user);

  const stats = usePolling<ServerStats>("server-stats", authed);
  const power = usePolling<PowerRecord>("dorm-power", authed);
  const whitelist = usePolling<{ items?: WhitelistItem[]; clientIP?: string }>(
    "whitelist-list",
    authed,
  );

  const [newIp, setNewIp] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [opError, setOpError] = useState("");

  const whitelistAction = async (
    action: string,
    method: string,
    payload?: object,
    query = "",
  ) => {
    setOpError("");
    const res = await fetch(`/api/oxelia-admin/${action}${query}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setOpError(d.error ?? `操作失败（HTTP ${res.status}）`);
      return false;
    }
    await whitelist.reload();
    return true;
  };

  const addIp = async () => {
    if (!newIp.trim()) return;
    const ok = await whitelistAction("whitelist-create", "POST", {
      ip: newIp.trim(),
      label: newLabel.trim(),
    });
    if (ok) {
      setNewIp("");
      setNewLabel("");
    }
  };

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
          <Link href="/" className="text-muted-foreground hover:text-foreground ml-auto text-xs">
            ← 返回平台
          </Link>
        </header>

        <main className="mx-auto flex max-w-4xl flex-col gap-4 p-6 pb-20">
          {status === "loading" ? (
            <p className="text-muted-foreground text-sm">加载中…</p>
          ) : !authed ? (
            <Card className="flex flex-col gap-3 p-6">
              <h2 className="font-heading text-lg font-semibold">需要登录</h2>
              <p className="text-muted-foreground text-sm">
                后台管理与平台账户统一认证，请先登录您的 Oxelia51 账户。
              </p>
              <Button asChild className="self-start">
                <Link href="/auth/sign-in">前往登录</Link>
              </Button>
            </Card>
          ) : (
            <>
              {/* 服务器状态 */}
              <Card className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-semibold">服务器状态（阿里云）</span>
                  <LiveDot />
                </div>
                {stats.error ? (
                  <p className="text-sm" style={{ color: "var(--ox-warn)" }}>{stats.error}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCell label="CPU" value={stats.data?.cpu_percent != null ? `${stats.data.cpu_percent.toFixed(1)}%` : "—"} />
                    <StatCell
                      label="内存"
                      value={stats.data?.memory_used_mb != null ? `${(stats.data.memory_used_mb / 1024).toFixed(1)} / ${((stats.data.memory_total_mb ?? 0) / 1024).toFixed(1)} GB` : "—"}
                    />
                    <StatCell
                      label="磁盘"
                      value={stats.data?.disk_used_percent != null ? `${stats.data.disk_used_percent.toFixed(1)}%（${stats.data.disk_total_gb} GB）` : "—"}
                    />
                    <StatCell label="运行时长" value={formatUptime(stats.data?.uptime_seconds)} />
                  </div>
                )}
              </Card>

              {/* DormGuard 电费 */}
              <Card className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-semibold">宿舍电费（DormGuard）</span>
                  <LiveDot />
                </div>
                {power.error ? (
                  <p className="text-sm" style={{ color: "var(--ox-warn)" }}>{power.error}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <PowerCell label="空调余量" value={power.data?.kbalance} />
                    <PowerCell label="照明余量" value={power.data?.zbalance} />
                  </div>
                )}
                {power.data?.record_time && (
                  <p className="text-muted-foreground text-xs">
                    数据时间：{new Date(power.data.record_time).toLocaleString("zh-CN")}
                  </p>
                )}
              </Card>

              {/* IP 白名单 */}
              <Card className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-semibold">IP 白名单</span>
                  <Button variant="ghost" size="sm" onClick={() => void whitelist.reload()}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  白名单控制高危运维接口（命令执行）的访问来源
                  {whitelist.data?.clientIP ? `，当前出口 IP：${whitelist.data.clientIP}` : ""}
                </p>
                <div className="flex gap-2">
                  <Input placeholder="IP 地址" value={newIp} onChange={(e) => setNewIp(e.target.value)} className="w-48" />
                  <Input placeholder="备注（可选）" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="flex-1" />
                  <Button onClick={() => void addIp()}>添加</Button>
                </div>
                {opError && (
                  <p className="text-sm" style={{ color: "var(--ox-danger)" }}>{opError}</p>
                )}
                {whitelist.error ? (
                  <p className="text-sm" style={{ color: "var(--ox-warn)" }}>{whitelist.error}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP</TableHead>
                        <TableHead>备注</TableHead>
                        <TableHead>添加时间</TableHead>
                        <TableHead className="w-16" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(whitelist.data?.items ?? []).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono">{item.ip}</TableCell>
                          <TableCell>{item.label || "—"}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString("zh-CN") : "—"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                void whitelistAction("whitelist-delete", "DELETE", undefined, `?id=${item.id}`)
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" style={{ color: "var(--ox-danger)" }} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(whitelist.data?.items ?? []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-muted-foreground text-center text-sm">
                            暂无白名单条目
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </>
          )}
        </main>

        <footer className="fixed inset-x-0 bottom-0 border-t bg-background py-1.5">
          <FilingInfo variant="full" />
        </footer>
      </div>
    </>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function PowerCell({ label, value }: { label: string; value?: number | null }) {
  const low = value != null && value < 10;
  return (
    <div className="flex flex-col gap-0.5 rounded-md border p-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className="text-2xl font-semibold tabular-nums"
        style={{ color: low ? "var(--ox-warn)" : "var(--ox-text-h)" }}
      >
        {value != null ? value.toFixed(2) : "—"}
        <span className="text-muted-foreground ml-1 text-sm font-normal">度</span>
      </span>
      {low && (
        <span className="text-xs" style={{ color: "var(--ox-warn)" }}>
          余量偏低，请及时充值
        </span>
      )}
    </div>
  );
}

AdminPage.skipAppLayout = true;
