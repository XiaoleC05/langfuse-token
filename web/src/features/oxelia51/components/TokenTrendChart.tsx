"use client";

import { formatTokens } from "@/src/features/oxelia51/components/currency";

/**
 * 时间趋势柱状图（总览 / 分析共用）。
 * 按 bucket 渲染每日/周/月 Token 柱，最后一根为品牌红强调。
 */
export function TokenTrendChart({
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
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      preserveAspectRatio="none"
      style={{ height: 160 }}
    >
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
