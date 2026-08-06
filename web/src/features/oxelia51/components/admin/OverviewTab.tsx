"use client";

import { api } from "@/src/utils/api";
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

/** 总览：平台核心指标 + 代理网关实时摘要 */
export function OverviewTab() {
  const overviewQ = api.oxelia51Admin.platformOverview.useQuery();
  const gatewayStatsQ = api.oxelia51Admin.gatewayStats.useQuery(undefined, {
    refetchInterval: POLL_MS,
  });

  const overview = overviewQ.data;
  const gateway = gatewayStatsQ.data as GatewayStats | undefined;
  const gw = gateway?.stats;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <AdminCard
        title="平台指标"
        className="lg:col-span-2"
        action={
          overviewQ.error ? undefined : (
            <span className="text-muted-foreground text-xs">实时统计</span>
          )
        }
      >
        {overviewQ.error ? (
          <p className="text-sm" style={{ color: "var(--ox-warn)" }}>
            {errMsg(overviewQ.error)}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCell
              label="注册用户数"
              value={overview ? overview.userCount.toLocaleString() : "…"}
            />
            <StatCell
              label="项目数"
              value={overview ? overview.projectCount.toLocaleString() : "…"}
            />
            <StatCell
              label="待处理反馈"
              value={
                overview ? overview.pendingFeedbackCount.toLocaleString() : "…"
              }
              warn={(overview?.pendingFeedbackCount ?? 0) > 0}
            />
            <StatCell
              label="近 24h 告警"
              value={
                overview ? overview.alertsLast24hCount.toLocaleString() : "…"
              }
              warn={(overview?.alertsLast24hCount ?? 0) > 0}
            />
          </div>
        )}
      </AdminCard>

      <AdminCard
        title={`代理网关摘要（近 ${gw?.windowSeconds ?? 5} 分钟）`}
        className="lg:col-span-2"
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
              <StatCell label="网关状态" value={gatewayQStatus(gateway)} />
            </div>
            <p className="text-muted-foreground text-xs">
              运行时长：{formatUptime(gw.uptimeSeconds)}
            </p>
          </>
        )}
      </AdminCard>
    </div>
  );
}
