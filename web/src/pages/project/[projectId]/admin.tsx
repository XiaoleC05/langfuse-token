"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Page from "@/src/components/layouts/page";
import { api } from "@/src/utils/api";
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
import { Badge } from "@/src/components/ui/badge";
import { Trash2, RefreshCw } from "lucide-react";

/**
 * Oxelia51 后台管理 v2。
 * 统一登录：Langfuse 登录态直接进入；数据经 tRPC（oxelia51Admin router）
 * 服务端代理获取，仅管理员（邮箱名单）可见。
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

type GatewayStats = {
  status?: string;
  uptimeSec?: number;
  stats?: {
    uptimeSeconds: number;
    totalRequests: number;
    successRate: number;
    qps: number;
    avgLatencyMs: number;
    windowSeconds: number;
    byProvider: Array<{
      provider: string;
      requests: number;
      failures: number;
      avgLatencyMs: number;
    }>;
  };
};

type WhitelistItem = {
  id: number;
  ip: string;
  label: string;
  created_at?: string;
};

type UserItem = {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string;
  memberships: Array<{ org: string; role: string }>;
};

type FeedbackItem = {
  id: number;
  email: string;
  category: string;
  message: string;
  projectId: string | null;
  status: string;
  createdAt: string;
};

const FEEDBACK_CATEGORY_LABEL: Record<string, string> = {
  feature: "功能建议",
  bug: "Bug 反馈",
  other: "其他",
};

const FEEDBACK_CATEGORY_VARIANT: Record<
  string,
  "secondary" | "error" | "outline"
> = {
  feature: "secondary",
  bug: "error",
  other: "outline",
};

const POLL_MS = 5000;

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

function errMsg(e: { message?: string } | null | undefined) {
  return e?.message ?? "";
}

function gatewayQStatus(g: GatewayStats | undefined): string {
  if (!g) return "状态未知";
  if (g.status === "ok") return "正常";
  if (g.status === "degraded") return "降级";
  return "异常";
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const authed = status === "authenticated" && Boolean(session?.user);

  const whoami = api.oxelia51Admin.whoami.useQuery(undefined, {
    enabled: authed,
    staleTime: Infinity,
  });
  const allowed = authed && whoami.data?.isAdmin === true;

  const statsQ = api.oxelia51Admin.serverStats.useQuery(undefined, {
    enabled: allowed,
    refetchInterval: POLL_MS,
  });
  const localStatsQ = api.oxelia51Admin.localStats.useQuery(undefined, {
    enabled: allowed,
    refetchInterval: POLL_MS,
  });
  const gatewayStatsQ = api.oxelia51Admin.gatewayStats.useQuery(undefined, {
    enabled: allowed,
    refetchInterval: POLL_MS,
  });
  const powerQ = api.oxelia51Admin.dormPower.useQuery(undefined, {
    enabled: allowed,
  });
  const whitelistQ = api.oxelia51Admin.whitelistList.useQuery(undefined, {
    enabled: allowed,
  });
  const usersQ = api.oxelia51Admin.usersList.useQuery(undefined, {
    enabled: allowed,
  });
  const feedbackQ = api.oxelia51Admin.listFeedback.useQuery(
    { limit: 50 },
    { enabled: allowed },
  );

  const stats = statsQ.data as ServerStats | undefined;
  const gateway = gatewayStatsQ.data as GatewayStats | undefined;
  const gw = gateway?.stats;
  const power = powerQ.data as PowerRecord | undefined;
  const whitelist = whitelistQ.data as
    | { items?: WhitelistItem[]; clientIP?: string }
    | undefined;
  const users = usersQ.data?.items as UserItem[] | undefined;
  const feedback = feedbackQ.data?.items as FeedbackItem[] | undefined;

  const utils = api.useUtils();
  const [opError, setOpError] = useState("");
  const invalidateWhitelist = () =>
    utils.oxelia51Admin.whitelistList.invalidate();

  const createMut = api.oxelia51Admin.whitelistCreate.useMutation({
    onSuccess: () => {
      setNewIp("");
      setNewLabel("");
      void invalidateWhitelist();
    },
    onError: (e) => setOpError(e.message),
  });
  const deleteMut = api.oxelia51Admin.whitelistDelete.useMutation({
    onSuccess: () => void invalidateWhitelist(),
    onError: (e) => setOpError(e.message),
  });

  const [powerMsg, setPowerMsg] = useState("");
  const [powerMsgOk, setPowerMsgOk] = useState(false);
  const refreshPowerMut = api.oxelia51Admin.dormPowerRefresh.useMutation({
    onSuccess: async (data) => {
      const ok =
        typeof data === "object" && data !== null && "success" in data
          ? Boolean((data as { success: unknown }).success)
          : false;
      setPowerMsgOk(ok);
      setPowerMsg(
        ok
          ? "抓取完成，数据已更新"
          : "抓取失败或无启用的规则，显示的是上一次数据",
      );
      // 给爬虫落库一点时间再刷新
      await new Promise((r) => setTimeout(r, 1500));
      void powerQ.refetch();
    },
    onError: (e) => {
      setPowerMsgOk(false);
      setPowerMsg(`抓取请求失败：${e.message}`);
    },
  });

  const [newIp, setNewIp] = useState("");
  const [newLabel, setNewLabel] = useState("");

  return (
    <Page
      scrollable
      headerProps={{
        title: "后台管理",
        help: {
          description:
            "服务器状态、宿舍电费、IP 白名单与平台用户管理（仅管理员可见）。",
        },
      }}
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 p-4 pb-8 lg:grid-cols-2">
          {status === "loading" || (authed && whoami.isLoading) ? (
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
          ) : !whoami.data?.isAdmin ? (
            <Card className="flex flex-col gap-3 p-6">
              <h2 className="font-heading text-lg font-semibold">无访问权限</h2>
              <p className="text-muted-foreground text-sm">
                后台管理仅对管理员开放。当前账户（{session?.user?.email}
                ）没有管理权限，如需开通请联系平台管理员。
              </p>
              <Button asChild variant="ghost" className="self-start">
                <Link href="/">返回平台</Link>
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
                {statsQ.error ? (
                  <p className="text-sm" style={{ color: "var(--ox-warn)" }}>{errMsg(statsQ.error)}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCell label="CPU" value={stats?.cpu_percent != null ? `${stats.cpu_percent.toFixed(1)}%` : "—"} />
                    <StatCell
                      label="内存"
                      value={stats?.memory_used_mb != null ? `${(stats.memory_used_mb / 1024).toFixed(1)} / ${((stats.memory_total_mb ?? 0) / 1024).toFixed(1)} GB` : "—"}
                    />
                    <StatCell
                      label="磁盘"
                      value={stats?.disk_used_percent != null ? `${stats.disk_used_percent.toFixed(1)}%（${stats.disk_total_gb} GB）` : "—"}
                      warn={(stats?.disk_used_percent ?? 0) > 85}
                    />
                    <StatCell label="运行时长" value={formatUptime(stats?.uptime_seconds)} />
                  </div>
                )}
              </Card>

              {/* 服务器状态（腾讯云，langfuse-web 所在主机） */}
              <Card className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-semibold">服务器状态（腾讯云）</span>
                  <LiveDot />
                </div>
                {localStatsQ.error ? (
                  <p className="text-sm" style={{ color: "var(--ox-warn)" }}>{errMsg(localStatsQ.error)}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCell label="CPU 负载" value={localStatsQ.data?.cpuPercent != null ? `${localStatsQ.data.cpuPercent.toFixed(1)}%` : "—"} />
                    <StatCell
                      label="内存"
                      value={localStatsQ.data?.memoryUsedMB != null ? `${(localStatsQ.data.memoryUsedMB / 1024).toFixed(1)} / ${((localStatsQ.data.memoryTotalMB ?? 0) / 1024).toFixed(1)} GB` : "—"}
                    />
                    <StatCell
                      label="磁盘"
                      value={localStatsQ.data?.diskUsedPercent != null ? `${localStatsQ.data.diskUsedPercent.toFixed(1)}%（${localStatsQ.data.diskTotalGB} GB）` : "—"}
                      warn={(localStatsQ.data?.diskUsedPercent ?? 0) > 85}
                    />
                    <StatCell label="运行时长" value={formatUptime(localStatsQ.data?.uptimeSeconds)} />
                  </div>
                )}
              </Card>

              {/* 代理网关状态 */}
              <Card className="flex flex-col gap-3 p-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-semibold">
                    代理网关状态（近 {gw?.windowSeconds ?? 5} 分钟）
                  </span>
                  <span
                    className="text-xs"
                    style={{
                      color: gateway?.status === "ok" ? "var(--ox-ok)" : "var(--ox-warn)",
                    }}
                  >
                    {gatewayQStatus(gateway)}
                  </span>
                </div>
                {gatewayStatsQ.error ? (
                  <p className="text-sm" style={{ color: "var(--ox-warn)" }}>
                    {errMsg(gatewayStatsQ.error)}
                  </p>
                ) : !gw ? (
                  <p className="text-muted-foreground text-sm">加载中…</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <StatCell
                        label="QPS"
                        value={gw.qps > 0 ? gw.qps.toFixed(2) : "0.00"}
                      />
                      <StatCell
                        label="平均延迟"
                        value={`${gw.avgLatencyMs.toFixed(0)} ms`}
                      />
                      <StatCell
                        label="成功率"
                        value={`${gw.successRate.toFixed(1)}%`}
                        warn={gw.successRate < 90 && gw.totalRequests > 0}
                      />
                      <StatCell
                        label="总请求数"
                        value={gw.totalRequests.toLocaleString()}
                      />
                    </div>
                    <p className="text-muted-foreground text-xs">
                      运行时长：{formatUptime(gw.uptimeSeconds)}
                    </p>
                    {gw.byProvider.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>供应商</TableHead>
                            <TableHead className="text-right">请求数</TableHead>
                            <TableHead className="text-right">失败</TableHead>
                            <TableHead className="text-right">平均延迟</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {gw.byProvider.slice(0, 10).map((p) => (
                            <TableRow key={p.provider}>
                              <TableCell className="font-mono text-xs">
                                {p.provider}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {p.requests.toLocaleString()}
                              </TableCell>
                              <TableCell
                                className="text-right tabular-nums"
                                style={{
                                  color:
                                    p.failures > 0 ? "var(--ox-warn)" : undefined,
                                }}
                              >
                                {p.failures}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {p.avgLatencyMs.toFixed(0)} ms
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </>
                )}
              </Card>

              {/* DormGuard 电费 */}
              <Card className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-semibold">宿舍电费（DormGuard）</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={refreshPowerMut.isPending}
                    onClick={() => {
                      setPowerMsg("");
                      refreshPowerMut.mutate();
                    }}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshPowerMut.isPending ? "animate-spin" : ""}`} />
                    {refreshPowerMut.isPending ? "拉取中…" : "拉取"}
                  </Button>
                </div>
                {powerMsg && (
                  <p className="text-sm" style={{ color: powerMsgOk ? "var(--ox-ok)" : "var(--ox-warn)" }}>
                    {powerMsg}
                  </p>
                )}
                {powerQ.error ? (
                  <p className="text-sm" style={{ color: "var(--ox-warn)" }}>{errMsg(powerQ.error)}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <PowerCell label="空调余量" value={power?.kbalance} />
                    <PowerCell label="照明余量" value={power?.zbalance} />
                  </div>
                )}
                {power?.record_time && (
                  <p className="text-muted-foreground text-xs">
                    数据时间：{new Date(power.record_time).toLocaleString("zh-CN")}
                  </p>
                )}
              </Card>

              {/* IP 白名单 */}
              <Card className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-semibold">IP 白名单</span>
                  <Button variant="ghost" size="sm" onClick={() => void whitelistQ.refetch()}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  白名单控制高危运维接口（命令执行）的访问来源
                  {whitelist?.clientIP ? `，当前出口 IP：${whitelist.clientIP}` : ""}
                </p>
                <div className="flex gap-2">
                  <Input placeholder="IP 地址" value={newIp} onChange={(e) => setNewIp(e.target.value)} className="w-48" />
                  <Input placeholder="备注（可选）" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="flex-1" />
                  <Button
                    onClick={() => {
                      setOpError("");
                      createMut.mutate({ ip: newIp.trim(), label: newLabel.trim() });
                    }}
                    disabled={!newIp.trim() || createMut.isPending}
                  >
                    添加
                  </Button>
                  {whitelist?.clientIP && (
                    <Button
                      variant="outline"
                      title={`将当前出口 IP ${whitelist.clientIP} 加入白名单`}
                      disabled={createMut.isPending}
                      onClick={() => {
                        setOpError("");
                        // IP 已在白名单：给出明确提示而非禁用按钮（禁用会显示禁止指针）
                        if (
                          (whitelist.items ?? []).some(
                            (i) => i.ip === whitelist.clientIP,
                          )
                        ) {
                          setOpError(
                            `当前出口 IP ${whitelist.clientIP} 已在白名单中`,
                          );
                          return;
                        }
                        createMut.mutate({
                          ip: whitelist.clientIP!,
                          label: "本机（一键添加）",
                        });
                      }}
                    >
                      一键添加本机 IP
                    </Button>
                  )}
                </div>
                {opError && (
                  <p className="text-sm" style={{ color: "var(--ox-danger)" }}>{opError}</p>
                )}
                {whitelistQ.error ? (
                  <p className="text-sm" style={{ color: "var(--ox-warn)" }}>{errMsg(whitelistQ.error)}</p>
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
                      {(whitelist?.items ?? []).map((item) => (
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
                              onClick={() => {
                                setOpError("");
                                deleteMut.mutate({ id: String(item.id) });
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" style={{ color: "var(--ox-danger)" }} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(whitelist?.items ?? []).length === 0 && (
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

              {/* 平台用户管理 */}
              <Card className="flex flex-col gap-3 p-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-semibold">
                    平台用户（{users?.length ?? "…"}）
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => void usersQ.refetch()}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {usersQ.error ? (
                  <p className="text-sm" style={{ color: "var(--ox-warn)" }}>{errMsg(usersQ.error)}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>邮箱</TableHead>
                        <TableHead>姓名</TableHead>
                        <TableHead>组织 / 角色</TableHead>
                        <TableHead>注册时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(users ?? []).map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.email ?? "—"}</TableCell>
                          <TableCell>{u.name || "—"}</TableCell>
                          <TableCell className="text-xs">
                            {(u.memberships ?? []).length === 0
                              ? "—"
                              : (u.memberships ?? [])
                                  .map((m) => `${m.org}（${m.role}）`)
                                  .join("、")}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {u.created_at
                              ? new Date(u.created_at).toLocaleDateString("zh-CN")
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>

              {/* 用户反馈 */}
              <Card className="flex flex-col gap-3 p-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-semibold">
                    用户反馈（{feedback?.length ?? "…"}）
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => void feedbackQ.refetch()}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {feedbackQ.error ? (
                  <p className="text-sm" style={{ color: "var(--ox-warn)" }}>{errMsg(feedbackQ.error)}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">分类</TableHead>
                        <TableHead>邮箱</TableHead>
                        <TableHead>内容</TableHead>
                        <TableHead className="w-36">时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(feedback ?? []).map((f) => (
                        <TableRow key={f.id}>
                          <TableCell>
                            <Badge
                              variant={
                                FEEDBACK_CATEGORY_VARIANT[f.category] ?? "outline"
                              }
                            >
                              {FEEDBACK_CATEGORY_LABEL[f.category] ?? f.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{f.email}</TableCell>
                          <TableCell className="max-w-md">
                            <span className="line-clamp-2 whitespace-pre-wrap text-xs">
                              {f.message}
                            </span>
                            {f.projectId && (
                              <span className="text-muted-foreground block text-xs">
                                项目：{f.projectId}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {f.createdAt
                              ? new Date(f.createdAt).toLocaleString("zh-CN")
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(feedback ?? []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-muted-foreground text-center text-sm">
                            暂无反馈
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </>
          )}
      </div>
    </Page>
  );
}

function StatCell({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  /** 达到阈值时高亮（如磁盘 >85%） */
  warn?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className="text-lg font-semibold tabular-nums"
        style={{ color: warn ? "var(--ox-danger)" : undefined }}
      >
        {value}
      </span>
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

