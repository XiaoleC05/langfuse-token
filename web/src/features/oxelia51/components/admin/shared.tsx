"use client";

import { type ReactNode } from "react";
import { Card } from "@/src/components/ui/card";
import { api } from "@/src/utils/api";

/**
 * Oxelia51 管理台共享类型与展示组件。
 * 由各 Tab（总览/反馈/用户/系统状态/安全/工具/告警）复用，
 * 数据全部经 tRPC oxelia51Admin router 服务端代理获取。
 */

export type ServerStats = {
  cpu_percent?: number;
  memory_used_mb?: number;
  memory_total_mb?: number;
  disk_used_percent?: number;
  disk_total_gb?: number;
  uptime_seconds?: number;
  go_goroutines?: number;
};

export type PowerRecord = {
  kbalance?: number | null;
  zbalance?: number | null;
  record_time?: string;
};

export type GatewayStats = {
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

export type WhitelistItem = {
  id: number;
  ip: string;
  label: string;
  created_at?: string;
};

export type UserItem = {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string;
  memberships: Array<{ org: string; role: string }>;
};

export type FeedbackItem = {
  id: number;
  email: string;
  category: string;
  message: string;
  projectId: string | null;
  status: string;
  createdAt: string;
};

export type AlertLogItem = {
  id: number;
  projectId: string;
  alertType: string;
  severity: string;
  message: string;
  status: string;
  createdAt: string;
};

/** 轮询间隔（系统状态类卡片） */
export const POLL_MS = 5000;

/** 平台超级管理员账户：唯一可执行写操作的管理员（与服务端 adminRouter 的 PLATFORM_SUPER_ADMIN_EMAIL 同值） */
export const PLATFORM_ADMIN_EMAIL = "postmaster@oxelia51.com";

/** 当前登录用户是否为超级管理员（非超级管理员的管理员只读，操作按钮应隐藏） */
export function useIsSuperAdmin(): boolean {
  const whoami = api.oxelia51Admin.whoami.useQuery(undefined, {
    staleTime: Infinity,
  });
  return Boolean(whoami.data?.isSuperAdmin);
}

export const FEEDBACK_CATEGORY_LABEL: Record<string, string> = {
  feature: "功能建议",
  bug: "Bug 反馈",
  other: "其他",
};

export const FEEDBACK_CATEGORY_VARIANT: Record<
  string,
  "secondary" | "error" | "outline"
> = {
  feature: "secondary",
  bug: "error",
  other: "outline",
};

export const FEEDBACK_STATUS_LABEL: Record<string, string> = {
  new: "新反馈",
  processing: "处理中",
  done: "已完成",
};

export const FEEDBACK_STATUS_VARIANT: Record<
  string,
  "secondary" | "error" | "outline"
> = {
  new: "error",
  processing: "secondary",
  done: "outline",
};

export function formatUptime(seconds?: number) {
  if (!seconds) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d > 0 ? `${d} 天 ${h} 小时` : `${h} 小时 ${m} 分`;
}

export function LiveDot() {
  return (
    <span
      className="flex items-center gap-1.5 text-xs"
      style={{ color: "var(--ox-ok)" }}
    >
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

export function errMsg(e: { message?: string } | null | undefined) {
  return e?.message ?? "";
}

export function gatewayQStatus(g: GatewayStats | undefined): string {
  if (!g) return "状态未知";
  if (g.status === "ok") return "正常";
  if (g.status === "degraded") return "降级";
  return "异常";
}

/** 管理台卡片：标题行（可选右侧操作区）+ 内容 */
export function AdminCard({
  title,
  action,
  children,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`flex flex-col gap-3 p-4 ${className ?? ""}`}>
      <div className="flex items-center justify-between">
        <span className="font-heading text-sm font-semibold">{title}</span>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function StatCell({
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
        className="text-xl font-semibold tabular-nums"
        style={{ color: warn ? "var(--ox-danger)" : undefined }}
      >
        {value}
      </span>
    </div>
  );
}

export function PowerCell({
  label,
  value,
}: {
  label: string;
  value?: number | null;
}) {
  const low = value != null && value < 10;
  return (
    <div className="flex flex-col gap-0.5 rounded-md border p-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className="text-2xl font-semibold tabular-nums"
        style={{ color: low ? "var(--ox-warn)" : "var(--ox-text-h)" }}
      >
        {value != null ? value.toFixed(2) : "—"}
        <span className="text-muted-foreground ml-1 text-sm font-normal">
          度
        </span>
      </span>
      {low && (
        <span className="text-xs" style={{ color: "var(--ox-warn)" }}>
          余量偏低，请及时充值
        </span>
      )}
    </div>
  );
}
