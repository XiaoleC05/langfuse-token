"use client";

import { api } from "@/src/utils/api";
import { WorkspaceLayout } from "@/src/features/oxelia51/components/workspace/WorkspaceLayout";
import { formatCost, formatTokens, useCurrency } from "@/src/features/oxelia51/components/currency";

/** 供应商消耗：按 LLM 模型提供商（Claude / DeepSeek / OpenAI / 智谱 …）聚合。 */

export default function ProvidersPage() {
  const byProvider = api.workspace.byProvider.useQuery({ days: 30 });
  const rateQuery = api.workspace.exchangeRate.useQuery();
  const { currency } = useCurrency();
  const rate = rateQuery.data?.rateCnyPerUsd ?? 7.2;
  const cost = (usd?: number) => formatCost(usd ?? 0, currency, rate);
  const tokens = (n?: number) => formatTokens(n ?? 0);

  return (
    <WorkspaceLayout active="/app/providers">
      <h1 className="text-2xl font-bold tracking-tight text-(--ox-text-h)">
        供应商消耗
      </h1>
      <p className="mt-1 text-sm text-(--ox-text-muted)">
        按提供大模型的平台（Claude / DeepSeek / OpenAI / 智谱 …）聚合近 30 天 Token 用量与成本。
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(byProvider.data ?? []).map((p) => (
          <div
            key={p.provider}
            className="flex flex-col gap-3 rounded-lg border p-5"
            style={{ borderColor: "var(--ox-border)" }}
          >
            <div className="flex items-center gap-2.5">
              <span className="truncate text-sm font-semibold text-(--ox-text-h)">
                {p.provider}
              </span>
            </div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-(--ox-text-muted)">Token</span>
              <span className="tabular-nums text-(--ox-text-h)">{tokens(p.tokens)}</span>
            </div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-(--ox-text-muted)">请求</span>
              <span className="tabular-nums text-(--ox-text-h)">{p.requests} 次</span>
            </div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-(--ox-text-muted)">成本</span>
              <span className="tabular-nums text-(--ox-text-h)">{cost(p.costUsd)}</span>
            </div>
          </div>
        ))}
        {(byProvider.data ?? []).length === 0 && (
          <div
            className="col-span-full rounded-lg border px-4 py-10 text-center text-sm text-(--ox-text-muted)"
            style={{ borderColor: "var(--ox-border)" }}
          >
            暂无供应商数据。接入代理产生请求后，这里会按 LLM 平台展示 Token 消耗。
          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
}

ProvidersPage.skipAppLayout = true;
