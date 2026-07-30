import { type ReactNode } from "react";
import { type FilterState, type HomeDashboardPresetId } from "@langfuse/shared";
import { type ViewVersion } from "@langfuse/shared/query";
import { type DashboardDateRangeAggregationOption } from "@/src/utils/date-range-utils";
import { TracesBarListChart } from "@/src/features/dashboard/components/TracesBarListChart";
import { ModelCostTable } from "@/src/features/dashboard/components/ModelCostTable";
import { ScoresTable } from "@/src/features/dashboard/components/ScoresTable";
import { TracesAndObservationsTimeSeriesChart } from "@/src/features/dashboard/components/TracesTimeSeriesChart";
import { ModelUsageChart } from "@/src/features/dashboard/components/ModelUsageChart";
import { UserChart } from "@/src/features/dashboard/components/UserChart";
import { ChartScores } from "@/src/features/dashboard/components/ChartScores";
import { LatencyTable } from "@/src/features/dashboard/components/LatencyTables";
import { GenerationLatencyChart } from "@/src/features/dashboard/components/LatencyChart";
import { ScoreAnalytics } from "@/src/features/dashboard/components/score-analytics/ScoreAnalytics";

/**
 * Props bag a "preset" dashboard placement is rendered with. Derived by
 * PresetDashboardWidget from the surrounding dashboard's state (time range,
 * filters, scheduler) so the registered Home cards receive the same props the
 * bespoke Home page used to pass them.
 */
export interface PresetWidgetContext {
  projectId: string;
  /** Page-level filters WITHOUT the time window (time arrives as timestamps). */
  globalFilterState: FilterState;
  /** globalFilterState plus the time window as datetime filters — for legacy cards that expect it inline. */
  mergedFilterState: FilterState;
  fromTimestamp: Date;
  toTimestamp: Date;
  agg: DashboardDateRangeAggregationOption;
  isLoading: boolean;
  metricsVersion: ViewVersion;
  schedulerId?: string;
  /** Shared recharts syncId so time-series tiles move their crosshairs together. */
  syncId: string;
  className: string;
}

/**
 * presetId → existing Home card component, rendered verbatim with its
 * existing data fetches (LFE-10693 phase 1: presets reuse today's queries
 * untouched). Keyed by the shared HomeDashboardPresetId union so this registry
 * and the curated Home dashboard definition cannot drift apart silently.
 */
const HOME_PRESETS: Record<
  HomeDashboardPresetId,
  (ctx: PresetWidgetContext) => ReactNode
> = {
  "home-traces": (ctx) => (
    <TracesBarListChart
      className={ctx.className}
      projectId={ctx.projectId}
      globalFilterState={ctx.globalFilterState}
      fromTimestamp={ctx.fromTimestamp}
      toTimestamp={ctx.toTimestamp}
      isLoading={ctx.isLoading}
      metricsVersion={ctx.metricsVersion}
      schedulerId={ctx.schedulerId}
    />
  ),
  "home-model-costs": (ctx) => (
    <ModelCostTable
      className={ctx.className}
      projectId={ctx.projectId}
      globalFilterState={ctx.globalFilterState}
      fromTimestamp={ctx.fromTimestamp}
      toTimestamp={ctx.toTimestamp}
      isLoading={ctx.isLoading}
      metricsVersion={ctx.metricsVersion}
      schedulerId={ctx.schedulerId}
    />
  ),
  "home-scores-table": (ctx) => (
    <ScoresTable
      className={ctx.className}
      projectId={ctx.projectId}
      globalFilterState={ctx.mergedFilterState}
      isLoading={ctx.isLoading}
      metricsVersion={ctx.metricsVersion}
    />
  ),
  "home-traces-obs-time-series": (ctx) => (
    <TracesAndObservationsTimeSeriesChart
      className={ctx.className}
      projectId={ctx.projectId}
      globalFilterState={ctx.globalFilterState}
      fromTimestamp={ctx.fromTimestamp}
      toTimestamp={ctx.toTimestamp}
      agg={ctx.agg}
      isLoading={ctx.isLoading}
      metricsVersion={ctx.metricsVersion}
      schedulerId={ctx.schedulerId}
      syncId={ctx.syncId}
    />
  ),
  "home-model-usage": (ctx) => (
    <ModelUsageChart
      className={ctx.className}
      projectId={ctx.projectId}
      globalFilterState={ctx.mergedFilterState}
      fromTimestamp={ctx.fromTimestamp}
      toTimestamp={ctx.toTimestamp}
      userAndEnvFilterState={ctx.globalFilterState}
      agg={ctx.agg}
      isLoading={ctx.isLoading}
      metricsVersion={ctx.metricsVersion}
      schedulerId={ctx.schedulerId}
      syncId={ctx.syncId}
    />
  ),
  "home-users": (ctx) => (
    <UserChart
      className={ctx.className}
      projectId={ctx.projectId}
      globalFilterState={ctx.globalFilterState}
      fromTimestamp={ctx.fromTimestamp}
      toTimestamp={ctx.toTimestamp}
      isLoading={ctx.isLoading}
      metricsVersion={ctx.metricsVersion}
      schedulerId={ctx.schedulerId}
    />
  ),
  "home-chart-scores": (ctx) => (
    <ChartScores
      className={ctx.className}
      agg={ctx.agg}
      projectId={ctx.projectId}
      globalFilterState={ctx.globalFilterState}
      fromTimestamp={ctx.fromTimestamp}
      toTimestamp={ctx.toTimestamp}
      isLoading={ctx.isLoading}
      metricsVersion={ctx.metricsVersion}
      schedulerId={ctx.schedulerId}
      syncId={ctx.syncId}
    />
  ),
  "home-latency-table-traces": (ctx) => (
    <LatencyTable
      kind="traces"
      className={ctx.className}
      projectId={ctx.projectId}
      globalFilterState={ctx.globalFilterState}
      fromTimestamp={ctx.fromTimestamp}
      toTimestamp={ctx.toTimestamp}
      isLoading={ctx.isLoading}
      metricsVersion={ctx.metricsVersion}
      schedulerId={ctx.schedulerId}
    />
  ),
  "home-latency-table-generations": (ctx) => (
    <LatencyTable
      kind="generations"
      className={ctx.className}
      projectId={ctx.projectId}
      globalFilterState={ctx.globalFilterState}
      fromTimestamp={ctx.fromTimestamp}
      toTimestamp={ctx.toTimestamp}
      isLoading={ctx.isLoading}
      metricsVersion={ctx.metricsVersion}
      schedulerId={ctx.schedulerId}
    />
  ),
  "home-latency-table-observations": (ctx) => (
    <LatencyTable
      kind="observations"
      className={ctx.className}
      projectId={ctx.projectId}
      globalFilterState={ctx.globalFilterState}
      fromTimestamp={ctx.fromTimestamp}
      toTimestamp={ctx.toTimestamp}
      isLoading={ctx.isLoading}
      metricsVersion={ctx.metricsVersion}
      schedulerId={ctx.schedulerId}
    />
  ),
  "home-generation-latency": (ctx) => (
    <GenerationLatencyChart
      className={ctx.className}
      projectId={ctx.projectId}
      agg={ctx.agg}
      globalFilterState={ctx.globalFilterState}
      fromTimestamp={ctx.fromTimestamp}
      toTimestamp={ctx.toTimestamp}
      isLoading={ctx.isLoading}
      metricsVersion={ctx.metricsVersion}
      schedulerId={ctx.schedulerId}
      syncId={ctx.syncId}
    />
  ),
  "home-score-analytics": (ctx) => (
    <ScoreAnalytics
      className={ctx.className}
      agg={ctx.agg}
      projectId={ctx.projectId}
      globalFilterState={ctx.globalFilterState}
      fromTimestamp={ctx.fromTimestamp}
      toTimestamp={ctx.toTimestamp}
      isLoading={ctx.isLoading}
      metricsVersion={ctx.metricsVersion}
      schedulerId={ctx.schedulerId}
      syncId={ctx.syncId}
    />
  ),
};

/**
 * Display metadata for the preset picker (Add Widget dialog). `illustration`
 * keys into ChartTypeIllustration.
 */
export const HOME_PRESET_METADATA: Record<
  HomeDashboardPresetId,
  { name: string; description: string; illustration: string }
> = {
  "home-traces": {
    name: "追踪",
    description: "追踪总量及热门追踪名称",
    illustration: "HORIZONTAL_BAR",
  },
  "home-model-costs": {
    name: "模型成本",
    description: "各模型的成本和 Token 用量",
    illustration: "PIVOT_TABLE",
  },
  "home-scores-table": {
    name: "评分",
    description: "按名称统计的评分数量和平均值",
    illustration: "PIVOT_TABLE",
  },
  "home-traces-obs-time-series": {
    name: "追踪和观测时间序列",
    description: "流量趋势，可按追踪/观测切换视图",
    illustration: "BAR_TIME_SERIES",
  },
  "home-model-usage": {
    name: "模型用量",
    description: "按模型或类型统计的成本和用量趋势",
    illustration: "AREA_TIME_SERIES",
  },
  "home-users": {
    name: "用户用量",
    description: "各用户的 Token 成本和追踪数量",
    illustration: "HORIZONTAL_BAR",
  },
  "home-chart-scores": {
    name: "评分趋势",
    description: "各项评分的移动平均值",
    illustration: "LINE_TIME_SERIES",
  },
  "home-latency-table-traces": {
    name: "追踪延迟百分位",
    description: "各追踪名称的 p50–p99 延迟",
    illustration: "PIVOT_TABLE",
  },
  "home-latency-table-generations": {
    name: "生成延迟百分位",
    description: "各生成名称的 p50–p99 延迟",
    illustration: "PIVOT_TABLE",
  },
  "home-latency-table-observations": {
    name: "观测延迟百分位",
    description: "各观测类型和名称的 p50–p99 延迟",
    illustration: "PIVOT_TABLE",
  },
  "home-generation-latency": {
    name: "模型延迟",
    description: "各 LLM 的延迟百分位，按百分位分页显示",
    illustration: "LINE_TIME_SERIES",
  },
  "home-score-analytics": {
    name: "评分分析",
    description: "所选评分的图表和分布情况",
    illustration: "HISTOGRAM",
  },
};

export function getHomePreset(
  presetId: string,
): ((ctx: PresetWidgetContext) => ReactNode) | undefined {
  return (
    HOME_PRESETS as Record<
      string,
      ((ctx: PresetWidgetContext) => ReactNode) | undefined
    >
  )[presetId];
}
