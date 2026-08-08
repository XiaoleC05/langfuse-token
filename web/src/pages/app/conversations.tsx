"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { api } from "@/src/utils/api";
import { WorkspaceLayout } from "@/src/features/oxelia51/components/workspace/WorkspaceLayout";
import { formatCost, formatTokens, useCurrency } from "@/src/features/oxelia51/currency";

/** 个人工作台会话时间线：跨项目按 token_events.session_id 聚合的 Token 会话。 */

function shortId(id: string) {
  return id.length > 20 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

export default function ConversationsPage() {
  const sessions = api.workspace.bySession.useQuery({ days: 30, limit: 100 });
  const rateQuery = api.workspace.exchangeRate.useQuery();
  const { currency } = useCurrency();
  const rate = rateQuery.data?.rateCnyPerUsd ?? 7.2;
  const cost = (usd?: number) => formatCost(usd ?? 0, currency, rate);
  const tokens = (n?: number) => formatTokens(n ?? 0);

  return (
    <WorkspaceLayout active="/app/conversations">
      <h1 className="text-2xl font-bold tracking-tight text-(--ox-text-h)">
        会话
      </h1>
      <p className="mt-1 text-sm text-(--ox-text-muted)">
        跨项目的 Token 会话时间线（近 30 天）。
      </p>

      <div
        className="mt-6 overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--ox-border)" }}
      >
        <div
          className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2.5 text-[11px] text-(--ox-text-muted)"
          style={{ backgroundColor: "var(--ox-bg-alt)" }}
        >
          <span>会话</span>
          <span>项目</span>
          <span>Token</span>
          <span>成本</span>
          <span>最近</span>
        </div>
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--ox-border)" }}>
          {(sessions.data ?? []).map((s) => (
            <Link
              key={s.sessionId}
              href={`/app/conversations/${encodeURIComponent(s.sessionId)}`}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-(--ox-bg-alt)"
            >
              <span className="flex min-w-0 items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-(--ox-accent)" />
                <span className="truncate text-(--ox-text-h)">{shortId(s.sessionId)}</span>
              </span>
              <span className="max-w-28 truncate text-xs text-(--ox-text-muted)">
                {s.projectName}
              </span>
              <span className="tabular-nums text-(--ox-text-h)">{tokens(s.tokens)}</span>
              <span className="tabular-nums text-(--ox-text-muted)">{cost(s.costUsd)}</span>
              <span className="text-xs tabular-nums text-(--ox-text-muted)">
                {s.lastSeen ? new Date(s.lastSeen).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
              </span>
            </Link>
          ))}
          {(sessions.data ?? []).length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-(--ox-text-muted)">
              暂无会话数据。接入代理产生请求后，这里会按会话展示 Token 消耗。
            </div>
          )}
        </div>
      </div>
    </WorkspaceLayout>
  );
}

ConversationsPage.skipAppLayout = true;
