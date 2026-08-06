"use client";

import { api } from "@/src/utils/api";
import { Card } from "@/src/components/ui/card";
import {
  AdminCard,
  LiveDot,
  StatCell,
  errMsg,
  formatUptime,
  gatewayQStatus,
  POLL_MS,
  type GatewayStats,
} from "@/src/features/oxelia51/components/admin/shared";

/** 单张指标卡：标签 / 数值 / 次要说明 三级层级 */
function MetricCard({
  label,
  value,
  sub,
  warn = false,
}: {
  label: string;
  value: string;
  sub?: string;
  warn?: boolean;
}) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className="text-2xl font-semibold tabular-nums"
        style={{ color: warn ? "var(--ox-danger)" : "var(--ox-text-h)" }}
      >
        {value}
      </span>
      {sub && <span className="text-muted-foreground text-xs">{sub}</span>}
    </Card>
  );
}

/** 总览：平台核心指标（4 卡一排）+ 代理网关实时摘要 */
export function OverviewTab() {
  const overviewQ = api.oxelia51Admin.platformOverview.useQuery();
  const gatewayStatsQ = api.oxelia51Admin.gatewayStats.useQuery(undefined, {
    refetchInterval: POLL_MS,
  });

  const overview = overviewQ.data;
  const gateway = gatewayStatsQ.data as GatewayStats | undefined;
  const gw = gateway?.stats;

  return (
    <div className="flex flex-col gap-4">
      {overviewQ.error ? (
        <AdminCard title="平台指标">
          <p className="text-sm" style={{ color: "var(--ox-warn)" }}>
            {errMsg(overviewQ.error)}
          </p>
        </AdminCard>
      ) : (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <MetricCard
            label="注册用户数"
            value={overview ? overview.userCount.toLocaleString() : "…"}
            sub="平台累计"
          />
          <MetricCard
            label="项目数"
            value={overview ? overview.projectCount.toLocaleString() : "…"}
            sub="全部组织"
          />
          <MetricCard
            label="待处理反馈"
            value={
              overview ? overview.pendingFeedbackCount.toLocaleString() : "…"
            }
            sub="状态为「新反馈」"
            warn={(overview?.pendingFeedbackCount ?? 0) > 0}
          />
          <MetricCard
            label="近 24h 告警"
            value={
              overview ? overview.alertsLast24hCount.toLocaleString() : "…"
            }
            sub="跨项目告警记录"
            warn={(overview?.alertsLast24hCount ?? 0) > 0}
          />
        </div>
      )}

      <AdminCard
        title={`代理网关摘要（近 ${gw?.windowSeconds ?? 5} 分钟）`}
        action={<LiveDot />}
      >
        {gatewayStatsQ.error ? (
          <p className="text-sm" style={{ color: "var(--ox-warn)" }}>
            {errMsg(gatewayStatsQ.error)}
          </p>
        ) : !gw ? (
          <p className="text-muted-foreground text-sm">加载中…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
              <StatCell label="网关状态" value={gatewayQStatus(gateway)} />
            </div>
            <p className="text-muted-foreground text-xs">
              运行时长：{formatUptime(gw.uptimeSeconds)} · 总请求数：
              {gw.totalRequests.toLocaleString()}
            </p>
          </>
        )}
      </AdminCard>
    </div>
  );
}
