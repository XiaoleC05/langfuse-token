"use client";

import { api } from "@/src/utils/api";
import { WorkspaceLayout } from "@/src/features/oxelia51/components/workspace/WorkspaceLayout";
import { formatCost, formatTokens, useCurrency } from "@/src/features/oxelia51/currency";

/** 个人工作台总览：跨项目今日/周/月 token、本月成本、时间趋势、模型/项目排行。 */

function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--ox-border)" }}
    >
      <div className="text-xs text-(--ox-text-muted)">{label}</div>
      <div
        className="mt-1 text-xl font-semibold tabular-nums"
        style={{ color: accent ? "var(--ox-accent)" : "var(--ox-text-h)" }}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-[11px] text-(--ox-text-muted)">{hint}</div>}
    </div>
  );
}

function TokenTrendChart({
  data,
}: {
  data: { bucket: string; tokens: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-(--ox-text-muted)">
        暂无数据
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.tokens), 1);
  const W = 720;
  const H = 140;
  const pad = 4;
  const step = W / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 160 }}>
      {data.map((d, i) => {
        const h = (d.tokens / max) * (H - 12);
        const x = i * step + pad;
        const w = Math.max(step - pad * 2, 1);
        return (
          <rect
            key={d.bucket}
            x={x}
            y={H - h}
            width={w}
            height={h}
            rx={2}
            fill={i === data.length - 1 ? "var(--ox-accent)" : "var(--ox-border-light)"}
          >
            <title>{`${d.bucket}: ${formatTokens(d.tokens)}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}

export default function OverviewPage() {
  const overview = api.workspace.overview.useQuery();
  const trend = api.workspace.tokenTrend.useQuery({ granularity: "day" });
  const byModel = api.workspace.byModel.useQuery({ days: 30 });
  const byProject = api.workspace.byProject.useQuery();
  const rateQuery = api.workspace.exchangeRate.useQuery();
  const { currency } = useCurrency();
  const rate = rateQuery.data?.rateCnyPerUsd ?? 7.2;
  const cost = (usd?: number) => formatCost(usd ?? 0, currency, rate);
  const tokens = (n?: number) => formatTokens(n ?? 0);

  // 聚合 trend 为按 bucket 总 token
  const trendByBucket = new Map<string, number>();
  for (const r of trend.data ?? []) {
    trendByBucket.set(r.bucket, (trendByBucket.get(r.bucket) ?? 0) + r.tokens);
  }
  const trendData = Array.from(trendByBucket.entries())
    .map(([bucket, tokens]) => ({ bucket, tokens }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket));

  const o = overview.data;

  return (
    <WorkspaceLayout active="/app/overview">
      <h1 className="text-2xl font-bold tracking-tight text-(--ox-text-h)">
        总览
      </h1>
      <p className="mt-1 text-sm text-(--ox-text-muted)">
        跨所有项目的 Token 消耗与成本。
      </p>

      {/* 统计卡 */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="今日 Token"
          value={tokens(o?.todayTokens)}
          hint={o ? `昨日 ${tokens(o.yesterdayTokens)}` : undefined}
          accent
        />
        <StatCard
          label="本周 Token"
          value={tokens(o?.weekTokens)}
          hint={o ? `上周 ${tokens(o.prevWeekTokens)}` : undefined}
        />
        <StatCard
          label="本月 Token"
          value={tokens(o?.monthTokens)}
          hint={o ? `上月 ${tokens(o.prevMonthTokens)}` : undefined}
        />
        <StatCard
          label="本月成本"
          value={cost(o?.monthCostUsd)}
          hint={o ? `今日 ${cost(o.todayCostUsd)}` : undefined}
          accent
        />
      </div>

      {/* 趋势 */}
      <div
        className="mt-6 rounded-xl border p-4"
        style={{ borderColor: "var(--ox-border)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-(--ox-text-h)">近 30 天 Token 趋势</h2>
          <span className="text-[11px] text-(--ox-text-muted)">按日</span>
        </div>
        <div className="mt-3">
          <TokenTrendChart data={trendData} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* 模型排行 */}
        <div
          className="rounded-xl border"
          style={{ borderColor: "var(--ox-border)" }}
        >
          <div className="border-b px-4 py-3 text-sm font-semibold text-(--ox-text-h)" style={{ borderColor: "var(--ox-border)" }}>
            按模型（近 30 天）
          </div>
          <div className="flex flex-col divide-y" style={{ borderColor: "var(--ox-border)" }}>
            {(byModel.data ?? []).slice(0, 6).map((m) => (
              <div key={m.model} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="truncate text-(--ox-text-h)">{m.model}</span>
                <span className="shrink-0 pl-3 text-right tabular-nums">
                  <span className="text-(--ox-text-h)">{formatTokens(m.tokens)}</span>
                  <span className="ml-2 text-xs text-(--ox-text-muted)">{cost(m.costUsd)}</span>
                </span>
              </div>
            ))}
            {(byModel.data ?? []).length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-(--ox-text-muted)">暂无数据</div>
            )}
          </div>
        </div>

        {/* 项目排行 */}
        <div
          className="rounded-xl border"
          style={{ borderColor: "var(--ox-border)" }}
        >
          <div className="border-b px-4 py-3 text-sm font-semibold text-(--ox-text-h)" style={{ borderColor: "var(--ox-border)" }}>
            按项目（近 30 天）
          </div>
          <div className="flex flex-col divide-y" style={{ borderColor: "var(--ox-border)" }}>
            {(byProject.data ?? []).slice(0, 6).map((p) => (
              <div key={p.projectId} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="truncate text-(--ox-text-h)">{p.projectName}</span>
                <span className="shrink-0 pl-3 text-right tabular-nums">
                  <span className="text-(--ox-text-h)">{formatTokens(p.tokens)}</span>
                  <span className="ml-2 text-xs text-(--ox-text-muted)">{cost(p.costUsd)}</span>
                </span>
              </div>
            ))}
            {(byProject.data ?? []).length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-(--ox-text-muted)">暂无数据</div>
            )}
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}

OverviewPage.skipAppLayout = true;
