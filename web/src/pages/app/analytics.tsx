"use client";

import { useState } from "react";
import { api } from "@/src/utils/api";
import { WorkspaceLayout } from "@/src/features/oxelia51/components/workspace/WorkspaceLayout";
import { formatCost, formatTokens, useCurrency } from "@/src/features/oxelia51/components/currency";
import { TokenTrendChart } from "@/src/features/oxelia51/components/TokenTrendChart";
import { OxCard } from "@/src/features/oxelia51/components/OxCard";
import { EmptyText } from "@/src/features/oxelia51/components/EmptyText";
import { SegmentedControl } from "@/src/features/oxelia51/components/SegmentedControl";

/** 个人工作台多维分析：纵（时间趋势）/ 横（模型·项目对比）/ 时（日历热力图）。 */

const GRANULARITY_LABEL = { day: "按日", week: "按周", month: "按月" } as const;
const GRANULARITY_OPTIONS = (Object.keys(GRANULARITY_LABEL) as (keyof typeof GRANULARITY_LABEL)[]).map(
  (value) => ({ value, label: GRANULARITY_LABEL[value] }),
);

function CalendarHeatmap({ data }: { data: { date: string; tokens: number }[] }) {
  const map = new Map(data.map((d) => [d.date, d.tokens]));
  const max = Math.max(...data.map((d) => d.tokens), 1);
  // 最近 35 天，按 7 列（周一开头）× 5 行
  const cells: { date: Date; key: string; val: number }[] = [];
  const today = new Date();
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    cells.push({ date: d, key, val: map.get(key) ?? 0 });
  }
  const cellSize = 26;
  const gap = 4;
  return (
    <div className="overflow-x-auto">
      <svg
        width={7 * cellSize + 6 * gap}
        height={5 * cellSize + 4 * gap}
        className="mx-auto"
      >
        {cells.map((c, i) => {
          const col = Math.floor(i / 5);
          const row = i % 5;
          const x = col * (cellSize + gap);
          const y = row * (cellSize + gap);
          const intensity = c.val === 0 ? 0 : 0.25 + 0.75 * (c.val / max);
          return (
            <rect key={c.key} x={x} y={y} width={cellSize} height={cellSize} rx={4}
              fill={c.val === 0 ? "var(--ox-border-light)" : `color-mix(in srgb, var(--ox-accent) ${Math.round(intensity * 100)}%, var(--ox-bg-alt))`}>
              <title>{`${c.key}: ${formatTokens(c.val)}`}</title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}

export default function AnalyticsPage() {
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day");
  const trend = api.workspace.tokenTrend.useQuery({ granularity });
  const byModel = api.workspace.byModel.useQuery({ days: 30 });
  const byProvider = api.workspace.byProvider.useQuery({ days: 30 });
  const calendar = api.workspace.calendarHeatmap.useQuery({ days: 35 });
  const rateQuery = api.workspace.exchangeRate.useQuery();
  const { currency } = useCurrency();
  const rate = rateQuery.data?.rateCnyPerUsd ?? 7.2;
  const cost = (usd?: number) => formatCost(usd ?? 0, currency, rate);
  const tokens = (n?: number) => formatTokens(n ?? 0);

  const trendByBucket = new Map<string, number>();
  for (const r of trend.data ?? []) trendByBucket.set(r.bucket, (trendByBucket.get(r.bucket) ?? 0) + r.tokens);
  const trendData = Array.from(trendByBucket.entries()).map(([bucket, v]) => ({ bucket, tokens: v })).sort((a, b) => a.bucket.localeCompare(b.bucket));

  const totalModelTokens = (byModel.data ?? []).reduce((s, m) => s + m.tokens, 0) || 1;
  const totalProviderCost = (byProvider.data ?? []).reduce((s, p) => s + p.costUsd, 0) || 1;

  return (
    <WorkspaceLayout active="/app/analytics">
      <h1 className="text-2xl font-bold tracking-tight text-(--ox-text-h)">
        分析
      </h1>
      <p className="mt-1 text-sm text-(--ox-text-muted)">
        纵 · 横 · 时，多维度看懂 Token 花在哪。
      </p>

      {/* 纵：时间趋势 */}
      <OxCard className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-(--ox-text-h)">时间趋势</h2>
          <SegmentedControl
            options={GRANULARITY_OPTIONS}
            value={granularity}
            onChange={setGranularity}
          />
        </div>
        <div className="mt-3">
          <TokenTrendChart data={trendData} />
        </div>
      </OxCard>

      {/* 时：日历热力图 */}
      <OxCard className="mt-6">
        <h2 className="text-sm font-semibold text-(--ox-text-h)">近 35 天日历</h2>
        <div className="mt-3">
          <CalendarHeatmap data={calendar.data ?? []} />
        </div>
      </OxCard>

      {/* 横：模型 / 供应商对比 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <OxCard>
          <h2 className="text-sm font-semibold text-(--ox-text-h)">按模型占比（近 30 天）</h2>
          <div className="mt-3 flex flex-col gap-2.5">
            {(byModel.data ?? []).slice(0, 5).map((m) => (
              <div key={m.model}>
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate text-(--ox-text-h)">{m.model}</span>
                  <span className="shrink-0 pl-2 tabular-nums text-(--ox-text-muted)">
                    {Math.round((m.tokens / totalModelTokens) * 100)}% · {tokens(m.tokens)} · {cost(m.costUsd)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--ox-border-light)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.max((m.tokens / totalModelTokens) * 100, 2)}%`, backgroundColor: "var(--ox-accent)" }} />
                </div>
              </div>
            ))}
            {(byModel.data ?? []).length === 0 && <EmptyText>暂无数据</EmptyText>}
          </div>
        </OxCard>

        <OxCard>
          <h2 className="text-sm font-semibold text-(--ox-text-h)">按供应商成本占比（近 30 天）</h2>
          <div className="mt-3 flex flex-col gap-2.5">
            {(byProvider.data ?? []).slice(0, 5).map((p) => (
              <div key={p.provider}>
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate text-(--ox-text-h)">{p.provider}</span>
                  <span className="shrink-0 pl-2 tabular-nums text-(--ox-text-muted)">
                    {Math.round((p.costUsd / totalProviderCost) * 100)}% · {cost(p.costUsd)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--ox-border-light)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.max((p.costUsd / totalProviderCost) * 100, 2)}%`, backgroundColor: "var(--ox-accent)" }} />
                </div>
              </div>
            ))}
            {(byProvider.data ?? []).length === 0 && <EmptyText>暂无数据</EmptyText>}
          </div>
        </OxCard>
      </div>
    </WorkspaceLayout>
  );
}

AnalyticsPage.skipAppLayout = true;
