"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import { api } from "@/src/utils/api";
import { WorkspaceLayout } from "@/src/features/oxelia51/components/workspace/WorkspaceLayout";
import { formatCost, formatTokens, useCurrency } from "@/src/features/oxelia51/currency";

/** 会话详情：该会话按模型的 token/成本拆解。 */

function shortId(id: string) {
  return id.length > 30 ? `${id.slice(0, 12)}…${id.slice(-6)}` : id;
}

export default function SessionDetailPage() {
  const router = useRouter();
  const sessionId = (router.query.id as string) ?? "";
  const detail = api.workspace.sessionDetail.useQuery(
    { sessionId },
    { enabled: sessionId.length > 0 },
  );
  const rateQuery = api.workspace.exchangeRate.useQuery();
  const { currency } = useCurrency();
  const rate = rateQuery.data?.rateCnyPerUsd ?? 7.2;
  const cost = (usd?: number) => formatCost(usd ?? 0, currency, rate);
  const tokens = (n?: number) => formatTokens(n ?? 0);

  const summary = detail.data?.summary;

  return (
    <WorkspaceLayout active="/app/conversations">
      <Link
        href="/app/conversations"
        className="inline-flex items-center gap-1 text-xs text-(--ox-text-muted) transition-colors hover:text-(--ox-text-h)"
      >
        <ArrowLeft className="h-3 w-3" /> 返回会话列表
      </Link>
      <h1 className="mt-3 break-all text-xl font-bold tracking-tight text-(--ox-text-h)">
        {sessionId ? shortId(sessionId) : "…"}
      </h1>

      {/* 汇总 */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--ox-border)" }}>
          <div className="text-xs text-(--ox-text-muted)">Token</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-(--ox-text-h)">
            {tokens(summary?.tokens)}
          </div>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--ox-border)" }}>
          <div className="text-xs text-(--ox-text-muted)">成本</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-(--ox-accent)">
            {cost(summary?.costUsd)}
          </div>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--ox-border)" }}>
          <div className="text-xs text-(--ox-text-muted)">请求数</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-(--ox-text-h)">
            {tokens(summary?.requests)}
          </div>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--ox-border)" }}>
          <div className="text-xs text-(--ox-text-muted)">最近调用</div>
          <div className="mt-1 text-sm font-medium text-(--ox-text-h)">
            {summary?.lastSeen
              ? new Date(summary.lastSeen).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
              : "—"}
          </div>
        </div>
      </div>

      {/* 按模型 */}
      <div className="mt-6 overflow-hidden rounded-xl border" style={{ borderColor: "var(--ox-border)" }}>
        <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-3 border-b px-4 py-2.5 text-[11px] text-(--ox-text-muted)" style={{ borderColor: "var(--ox-border)", backgroundColor: "var(--ox-bg-alt)" }}>
          <span>模型</span>
          <span>项目</span>
          <span>Token</span>
          <span>成本</span>
          <span>请求</span>
        </div>
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--ox-border)" }}>
          {(detail.data?.byModel ?? []).map((r) => (
            <div key={r.model} className="grid grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-3 px-4 py-2.5 text-sm">
              <span className="truncate text-(--ox-text-h)">{r.model}</span>
              <span className="max-w-28 truncate text-xs text-(--ox-text-muted)">{r.projectName}</span>
              <span className="tabular-nums text-(--ox-text-h)">{tokens(r.tokens)}</span>
              <span className="tabular-nums text-(--ox-text-muted)">{cost(r.costUsd)}</span>
              <span className="tabular-nums text-(--ox-text-muted)">{tokens(r.requests)}</span>
            </div>
          ))}
          {(detail.data?.byModel ?? []).length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-(--ox-text-muted)">
              该会话暂无数据，或你无权访问。
            </div>
          )}
        </div>
      </div>
    </WorkspaceLayout>
  );
}

SessionDetailPage.skipAppLayout = true;
