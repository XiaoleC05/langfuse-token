"use client";

import { useState } from "react";
import { api } from "@/src/utils/api";
import { WorkspaceLayout } from "@/src/features/oxelia51/components/workspace/WorkspaceLayout";
import { formatCost, formatTokens, useCurrency } from "@/src/features/oxelia51/currency";

/** 个人工作台多维分析：纵（时间趋势）/ 横（模型·项目对比）/ 时（日历热力图）。 */

const GRANULARITY_LABEL = { day: "按日", week: "按周", month: "按月" } as const;

function TrendChart({
  data,
}: {
  data: { bucket: string; tokens: number }[];
}) {
  if (data.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-(--ox-text-muted)">暂无数据</div>;
  }
  const max = Math.max(...data.map((d) => d.tokens), 1);
  const W = 720;
  const H = 140;
  const pad = 3;
  const step = W / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 160 }}>
      {data.map((d, i) => {
        const h = (d.tokens / max) * (H - 12);
        const x = i * step + pad;
        const w = Math.max(step - pad * 2, 1);
        return (
          <rect key={d.bucket} x={x} y={H - h} width={w} height={h} rx={2}
            fill={i === data.length - 1 ? "var(--ox-accent)" : "var(--ox-border-light)"}>
            <title>{`${d.bucket}: ${formatTokens(d.tokens)}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}

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
  const byProject = api.workspace.byProject.useQuery();
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
  const totalProjectCost = (byProject.data ?? []).reduce((s, p) => s + p.costUsd, 0) || 1;

  return (
    <WorkspaceLayout active="/app/analytics">
      <h1 className="text-2xl font-bold tracking-tight text-(--ox-text-h)">
        分析
      </h1>
      <p className="mt-1 text-sm text-(--ox-text-muted)">
        纵 · 横 · 时，多维度看懂 Token 花在哪。
      </p>

      {/* 纵：时间趋势 */}
      <div className="mt-6 rounded-xl border p-4" style={{ borderColor: "var(--ox-border)" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-(--ox-text-h)">时间趋势</h2>
          <div className="flex items-center gap-1 rounded-lg border p-0.5" style={{ borderColor: "var(--ox-border)" }}>
            {(["day", "week", "month"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGranularity(g)}
                className="rounded-md px-2.5 py-1 text-xs transition-colors"
                style={
                  granularity === g
                    ? { backgroundColor: "var(--ox-accent)", color: "#fff" }
                    : { color: "var(--ox-text-muted)" }
                }
              >
                {GRANULARITY_LABEL[g]}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <TrendChart data={trendData} />
        </div>
      </div>

      {/* 时：日历热力图 */}
      <div className="mt-6 rounded-xl border p-4" style={{ borderColor: "var(--ox-border)" }}>
        <h2 className="text-sm font-semibold text-(--ox-text-h)">近 35 天日历</h2>
        <div className="mt-3">
          <CalendarHeatmap data={calendar.data ?? []} />
        </div>
      </div>

      {/* 横：模型 / 项目对比 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--ox-border)" }}>
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
            {(byModel.data ?? []).length === 0 && (
              <div className="py-6 text-center text-sm text-(--ox-text-muted)">暂无数据</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border p-4" style={{ borderColor: "var(--ox-border)" }}>
          <h2 className="text-sm font-semibold text-(--ox-text-h)">按项目成本占比（近 30 天）</h2>
          <div className="mt-3 flex flex-col gap-2.5">
            {(byProject.data ?? []).slice(0, 5).map((p) => (
              <div key={p.projectId}>
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate text-(--ox-text-h)">{p.projectName}</span>
                  <span className="shrink-0 pl-2 tabular-nums text-(--ox-text-muted)">
                    {Math.round((p.costUsd / totalProjectCost) * 100)}% · {cost(p.costUsd)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--ox-border-light)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.max((p.costUsd / totalProjectCost) * 100, 2)}%`, backgroundColor: "var(--ox-accent)" }} />
                </div>
              </div>
            ))}
            {(byProject.data ?? []).length === 0 && (
              <div className="py-6 text-center text-sm text-(--ox-text-muted)">暂无数据</div>
            )}
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}

AnalyticsPage.skipAppLayout = true;
