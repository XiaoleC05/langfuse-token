import { eventsTableCols, type FilterState } from "@langfuse/shared";
import {
  omitFilterFacets,
  type FilterConfig,
} from "@/src/features/filters/lib/filter-config";
import type { ColumnToBackendKeyMap } from "@/src/features/filters/lib/filter-transform";
import { renderFilterIcon } from "@/src/components/ItemBadge";
import { renderLevelIcon } from "@/src/components/level-colors";
import { OXELIA_DOCS_URL } from "@/src/features/oxelia51/constants";

// Helper function to get column name from eventsTableCols by ID
export const getEventsColumnName = (id: string): string => {
  const column = eventsTableCols.find((col) => col.id === id);
  if (!column) {
    throw new Error(`Column ${id} not found in eventsTableCols`);
  }
  return column.name;
};

/**
 * Maps frontend column IDs to backend-expected column IDs for events table
 * Events table uses different naming conventions than observations table
 */
export const OBSERVATION_EVENTS_COLUMN_TO_BACKEND_KEY: ColumnToBackendKeyMap = {
  // No mapping needed currently - events table column names align with UI
};

const isBooleanEqualityOperator = (operator: string): operator is "=" | "<>" =>
  operator === "=" || operator === "<>";

export const migrateLegacyRootObservationFilters = (
  filters: FilterState,
): FilterState => {
  const hasRootObservationFilter = filters.some(
    (filter) =>
      filter.column === "isRootObservation" &&
      filter.type === "boolean" &&
      isBooleanEqualityOperator(filter.operator),
  );

  return filters.flatMap((filter) => {
    if (
      filter.column === "isRootObservation" &&
      filter.type === "boolean" &&
      isBooleanEqualityOperator(filter.operator)
    ) {
      return [
        {
          ...filter,
          operator: "=" as const,
          value: filter.operator === "<>" ? !filter.value : filter.value,
        },
      ];
    }

    if (
      (filter.column === "hasParentObservation" ||
        filter.column === "Has Parent Observation") &&
      filter.type === "boolean" &&
      isBooleanEqualityOperator(filter.operator)
    ) {
      if (hasRootObservationFilter) {
        return [];
      }

      return [
        {
          ...filter,
          column: "isRootObservation",
          operator: "=" as const,
          value: filter.operator === "=" ? !filter.value : filter.value,
        },
      ];
    }

    return [filter];
  });
};

export type ObservationEventsOmittableFilterColumn =
  | "sessionId"
  | "userId"
  | "promptName";

export const observationEventsFilterConfig: FilterConfig = {
  tableName: "observations-events",

  columnDefinitions: eventsTableCols,

  defaultExpanded: ["environment", "name", "isRootObservation", "type"],

  migrateFilterState: migrateLegacyRootObservationFilters,

  facets: [
    {
      type: "categorical" as const,
      column: "environment",
      label: getEventsColumnName("environment"),
    },
    {
      type: "categorical" as const,
      column: "type",
      label: getEventsColumnName("type"),
      help: {
        description:
          "观测类型对追踪中捕获的工作进行分类，例如生成、Span、工具、链和代理。",
        href: OXELIA_DOCS_URL,
      },
      renderIcon: renderFilterIcon,
    },
    {
      type: "boolean" as const,
      column: "isRootObservation",
      label: "是否为根观测",
      tooltip:
        "根观测是追踪中的顶层节点，或由 SDK 标记为应用根。筛选为 True 即可查看根层级观测。",
    },
    {
      type: "categorical" as const,
      column: "traceName",
      label: getEventsColumnName("traceName"),
    },
    {
      type: "categorical" as const,
      column: "name",
      label: getEventsColumnName("name"),
    },
    {
      // Tags are a primary, user-defined filter — keep them near the identity
      // facets at the top of the sidebar rather than buried mid-list (LFE-10494).
      type: "categorical" as const,
      column: "traceTags",
      label: getEventsColumnName("traceTags"),
    },
    {
      // Display relabel to "Status" (see traces-config); column id stays
      // `level` until the cross-surface rename lands.
      type: "categorical" as const,
      column: "level",
      label: "状态",
      renderIcon: renderLevelIcon,
    },
    {
      type: "categorical" as const,
      column: "providedModelName",
      label: getEventsColumnName("providedModelName"),
    },
    {
      type: "categorical" as const,
      column: "modelId",
      label: getEventsColumnName("modelId"),
    },
    {
      type: "categorical" as const,
      column: "promptName",
      label: getEventsColumnName("promptName"),
    },
    {
      type: "stringKeyValue" as const,
      column: "metadata",
      label: getEventsColumnName("metadata"),
    },
    {
      type: "categorical" as const,
      column: "version",
      label: getEventsColumnName("version"),
    },
    {
      type: "string" as const,
      column: "statusMessage",
      label: getEventsColumnName("statusMessage"),
    },
    {
      type: "string" as const,
      column: "traceId",
      label: getEventsColumnName("traceId"),
    },
    {
      type: "categorical" as const,
      column: "sessionId",
      label: getEventsColumnName("sessionId"),
    },
    {
      type: "categorical" as const,
      column: "userId",
      label: getEventsColumnName("userId"),
    },
    {
      type: "categorical" as const,
      column: "experimentDatasetId",
      label: getEventsColumnName("experimentDatasetId"),
    },
    {
      type: "categorical" as const,
      column: "experimentId",
      label: getEventsColumnName("experimentId"),
    },
    {
      type: "categorical" as const,
      column: "experimentName",
      label: getEventsColumnName("experimentName"),
    },
    {
      type: "numeric" as const,
      column: "latency",
      label: getEventsColumnName("latency"),
      min: 0,
      max: 60,
      unit: "s",
    },
    {
      type: "numeric" as const,
      column: "timeToFirstToken",
      label: getEventsColumnName("timeToFirstToken"),
      min: 0,
      max: 60,
      unit: "s",
    },
    {
      type: "numeric" as const,
      column: "inputTokens",
      label: getEventsColumnName("inputTokens"),
      min: 0,
      max: 1000000,
    },
    {
      type: "numeric" as const,
      column: "outputTokens",
      label: getEventsColumnName("outputTokens"),
      min: 0,
      max: 1000000,
    },
    {
      type: "numeric" as const,
      column: "totalTokens",
      label: getEventsColumnName("totalTokens"),
      min: 0,
      max: 1000000,
    },
    {
      type: "numeric" as const,
      column: "inputCost",
      label: getEventsColumnName("inputCost"),
      min: 0,
      max: 100,
      unit: "$",
    },
    {
      type: "numeric" as const,
      column: "outputCost",
      label: getEventsColumnName("outputCost"),
      min: 0,
      max: 100,
      unit: "$",
    },
    {
      type: "numeric" as const,
      column: "totalCost",
      label: getEventsColumnName("totalCost"),
      min: 0,
      max: 100,
      unit: "$",
    },
    {
      type: "categorical" as const,
      column: "toolNames",
      label: "工具名称（可用）",
    },
    {
      type: "categorical" as const,
      column: "calledToolNames",
      label: "工具名称（已调用）",
    },
    {
      type: "numeric" as const,
      column: "toolDefinitions",
      label: "可用工具",
      min: 0,
      max: 25,
    },
    {
      type: "numeric" as const,
      column: "toolCalls",
      label: "工具调用",
      min: 0,
      max: 25,
    },
    // The "Scores" facets are level-agnostic: their filter matches a score at
    // observation OR trace level (LFE-10596), and their options list all score
    // names. The trace-only `trace_scores_avg` / `trace_score_categories` /
    // `trace_score_booleans` columns stay valid (search bar `traceScores.` +
    // existing saved views) but are no longer offered as separate sidebar
    // facets — one "Scores" group.
    {
      type: "keyValue" as const,
      column: "score_categories",
      label: "分类评分",
    },
    {
      type: "numericKeyValue" as const,
      column: "scores_avg",
      label: "数值评分",
    },
    {
      type: "booleanKeyValue" as const,
      column: "score_booleans",
      label: "布尔评分",
    },
    {
      type: "numeric" as const,
      column: "commentCount",
      label: "评论数量",
      min: 0,
      max: 100,
    },
    {
      type: "string" as const,
      column: "commentContent",
      label: "评论内容",
    },
  ],
};

export function getObservationEventsFilterConfig(
  omittedFilter: ObservationEventsOmittableFilterColumn[] = [],
): FilterConfig {
  return omitFilterFacets(observationEventsFilterConfig, omittedFilter);
}
