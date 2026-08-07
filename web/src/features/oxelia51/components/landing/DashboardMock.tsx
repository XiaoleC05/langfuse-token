"use client";

import { env } from "@/src/env.mjs";

/**
 * Hero 产品截图（设计稿 mock）：浏览器窗框 + 目标仪表盘（多维 Token 统计）。
 * 纯 CSS/SVG 渲染，适配 Cozy/Cosmos 双主题；非真实数据，仅作产品预览。
 */
function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex-1 rounded-lg border p-2.5" style={{ borderColor: "var(--ox-border)" }}>
      <div className="text-[10px] text-(--ox-text-muted)">{label}</div>
      <div
        className="mt-0.5 text-base font-semibold tabular-nums sm:text-lg"
        style={{ color: accent ? "var(--ox-accent)" : "var(--ox-text-h)" }}
      >
        {value}
      </div>
    </div>
  );
}

export function DashboardMock() {
  const basePath = env.NEXT_PUBLIC_BASE_PATH ?? "";
  // 近 7 天用量（示意）
  const bars = [38, 62, 50, 76, 58, 82, 100];
  const barMax = 100;
  const chartH = 88;

  const navItems = ["总览", "项目", "会话", "统计", "设置"];
  const rows = [
    { name: "cursor-web", session: "重构落地页", tokens: "48.2K", cost: "¥3.14" },
    { name: "claude-code", session: "调试 proxy", tokens: "36.8K", cost: "¥2.02" },
    { name: "deepseek", session: "批量摘要", tokens: "22.1K", cost: "¥0.86" },
  ];

  return (
    <div
      className="overflow-hidden rounded-xl border text-left shadow-2xl shadow-black/10 dark:shadow-black/40"
      style={{ borderColor: "var(--ox-border)", backgroundColor: "var(--ox-bg)" }}
    >
      {/* 浏览器窗框 */}
      <div
        className="flex items-center gap-2 border-b px-4 py-2.5"
        style={{ borderColor: "var(--ox-border)", backgroundColor: "var(--ox-bg-alt)" }}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span
          className="ml-3 flex-1 truncate rounded-md px-3 py-1 text-[11px] text-(--ox-text-muted)"
          style={{ backgroundColor: "var(--ox-bg)" }}
        >
          app.oxelia51.com/overview
        </span>
      </div>

      <div className="flex">
        {/* 侧栏 */}
        <div
          className="hidden w-40 shrink-0 border-r p-3 sm:block"
          style={{ borderColor: "var(--ox-border)", backgroundColor: "var(--ox-bg-alt)" }}
        >
          <div className="flex items-center gap-1.5 px-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${basePath}/icon-glyph-64.png`}
              alt=""
              width={18}
              height={18}
              className="dark:hidden"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${basePath}/icon-glyph-64-dark.png`}
              alt=""
              width={18}
              height={18}
              className="hidden dark:block"
            />
            <span className="text-[11px] font-medium text-(--ox-text-h)">oxelia51</span>
          </div>
          <nav className="mt-4 flex flex-col gap-1">
            {navItems.map((item, i) => (
              <span
                key={item}
                className="rounded-md px-2 py-1.5 text-[11px]"
                style={
                  i === 0
                    ? {
                        backgroundColor: "var(--ox-accent)",
                        color: "#fff",
                      }
                    : { color: "var(--ox-text-muted)" }
                }
              >
                {item}
              </span>
            ))}
          </nav>
        </div>

        {/* 主区 */}
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-(--ox-text-h)">今日用量</div>
            <span className="text-[10px] text-(--ox-text-muted)">近 7 天</span>
          </div>

          {/* 统计卡 */}
          <div className="mt-3 flex gap-3">
            <StatCard label="Token" value="128.4K" accent />
            <StatCard label="成本" value="¥6.02" accent />
            <StatCard label="请求数" value="1,024" />
          </div>

          {/* 图表 */}
          <div
            className="mt-3 rounded-lg border p-3"
            style={{ borderColor: "var(--ox-border)" }}
          >
            <div className="text-[10px] text-(--ox-text-muted)">按日 Token 消耗</div>
            <svg viewBox="0 0 280 90" className="mt-2 h-20 w-full" preserveAspectRatio="none">
              {bars.map((b, i) => {
                const h = (b / barMax) * (chartH - 14);
                const x = 14 + i * (24 + 16);
                const y = chartH - 4 - h;
                return (
                  <rect
                    key={i}
                    x={x}
                    y={y}
                    width={24}
                    height={h}
                    rx={3}
                    fill={i === bars.length - 1 ? "var(--ox-accent)" : "var(--ox-border-light)"}
                  />
                );
              })}
            </svg>
          </div>

          {/* 列表 */}
          <div
            className="mt-3 overflow-hidden rounded-lg border"
            style={{ borderColor: "var(--ox-border)" }}
          >
            <div
              className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 px-3 py-1.5 text-[10px] text-(--ox-text-muted)"
              style={{ backgroundColor: "var(--ox-bg-alt)" }}
            >
              <span>项目</span>
              <span>会话</span>
              <span>Token</span>
              <span>成本</span>
            </div>
            {rows.map((r) => (
              <div
                key={r.name + r.session}
                className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-2 border-t px-3 py-1.5 text-[10px]"
                style={{ borderColor: "var(--ox-border)" }}
              >
                <span className="truncate text-(--ox-text-h)">{r.name}</span>
                <span className="truncate text-(--ox-text-muted)">{r.session}</span>
                <span className="tabular-nums text-(--ox-text-h)">{r.tokens}</span>
                <span className="tabular-nums text-(--ox-text-muted)">{r.cost}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
