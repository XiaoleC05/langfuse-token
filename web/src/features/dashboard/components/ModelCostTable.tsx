import DocPopup from "@/src/components/layouts/doc-popup";
import { RightAlignedCell } from "@/src/features/dashboard/components/RightAlignedCell";
import { LeftAlignedCell } from "@/src/features/dashboard/components/LeftAlignedCell";
import { DashboardCard } from "@/src/features/dashboard/components/cards/DashboardCard";
import { DashboardTable } from "@/src/features/dashboard/components/cards/DashboardTable";
import { type FilterState, getGenerationLikeTypes } from "@langfuse/shared";
import { compactNumberFormatter } from "@/src/utils/numbers";
import { TotalMetric } from "./TotalMetric";
import {
  formatCost,
  useCurrency,
} from "@/src/features/oxelia51/currency";
import { truncate } from "@/src/utils/string";
import { type QueryType, type ViewVersion } from "@langfuse/shared/query";
import { mapLegacyUiTableFilterToView } from "@/src/features/dashboard/lib/dashboardUiTableToViewMapping";
import { useScheduledDashboardExecuteQuery } from "@/src/hooks/useDashboardQueryScheduler";
import { cn } from "@/src/utils/tailwind";
import { OXELIA_DOCS_URL } from "@/src/features/oxelia51/constants";

export const ModelCostTable = ({
  className,
  projectId,
  globalFilterState,
  fromTimestamp,
  toTimestamp,
  isLoading = false,
  metricsVersion,
  schedulerId,
}: {
  className: string;
  projectId: string;
  globalFilterState: FilterState;
  fromTimestamp: Date;
  toTimestamp: Date;
  isLoading?: boolean;
  metricsVersion?: ViewVersion;
  schedulerId?: string;
}) => {
  const modelCostQuery: QueryType = {
    view: "observations",
    dimensions: [{ field: "providedModelName" }],
    metrics: [
      { measure: "totalCost", aggregation: "sum" },
      { measure: "totalTokens", aggregation: "sum" },
    ],
    filters: [
      ...mapLegacyUiTableFilterToView("observations", globalFilterState),
      {
        column: "type",
        operator: "any of",
        value: getGenerationLikeTypes(),
        type: "stringOptions",
      },
    ],
    timeDimension: null,
    fromTimestamp: fromTimestamp.toISOString(),
    toTimestamp: toTimestamp.toISOString(),
    orderBy: [{ field: "sum_totalCost", direction: "desc" }],
    chartConfig: { type: "table", row_limit: 20 },
  };

  const metrics = useScheduledDashboardExecuteQuery(
    {
      projectId,
      query: modelCostQuery,
      version: metricsVersion,
    },
    {
      trpc: {
        context: {
          skipBatch: true,
        },
      },
      queryId: `${schedulerId ?? "home:model-costs"}:metrics`,
      enabled: !isLoading,
    },
  );

  // Oxelia51：币种全局切换（CNY/USD），列头与金额跟随
  const { currency, rate } = useCurrency();

  const totalTokenCost = metrics.data?.reduce(
    (acc, curr) =>
      acc + (curr.sum_totalCost ? (curr.sum_totalCost as number) : 0),
    0,
  );

  const metricsData = metrics.data
    ? metrics.data
        .filter((item) => item.providedModelName !== null)
        .map((item, i) => [
          <LeftAlignedCell
            key={`${i}-model`}
            title={item.providedModelName as string}
          >
            {truncate(item.providedModelName as string, 30)}
          </LeftAlignedCell>,
          <RightAlignedCell key={`${i}-tokens`}>
            {item.sum_totalTokens
              ? compactNumberFormatter(item.sum_totalTokens as number)
              : "0"}
          </RightAlignedCell>,
          <RightAlignedCell key={`${i}-cost`}>
            {formatCost(
              (item.sum_totalCost as number) ?? 0,
              currency,
              rate,
            )}
          </RightAlignedCell>,
        ])
    : [];

  return (
    <DashboardCard
      // h-full pins the card to the tile so the table fits its rows to the
      // AVAILABLE height instead of overflowing; min-h-0 lets the flex column
      // shrink so the row area scrolls internally. (LFE-11035)
      className={cn(className, "h-full")}
      cardContentClassName="min-h-0"
      title="模型成本"
      isLoading={isLoading || metrics.isLoading}
    >
      <DashboardTable
        headers={[
          "模型",
          <RightAlignedCell key="tokens">Token 用量</RightAlignedCell>,
          <RightAlignedCell key="cost">{currency}</RightAlignedCell>,
        ]}
        rows={metricsData}
        isLoading={isLoading || metrics.isLoading}
        collapse={{ collapsed: 5, expanded: 20 }}
      >
        <TotalMetric
          metric={formatCost(totalTokenCost ?? 0, currency, rate)}
          description="总成本"
        >
          <DocPopup
            description="通过将每个模型的 Token 数量乘以每个 Token 的成本计算得出。"
            href={OXELIA_DOCS_URL}
          />
        </TotalMetric>
      </DashboardTable>
    </DashboardCard>
  );
};
