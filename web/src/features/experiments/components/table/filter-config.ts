import {
  omitFilterFacets,
  type FilterConfig,
} from "@/src/features/filters/lib/filter-config";
import type { ColumnToBackendKeyMap } from "@/src/features/filters/lib/filter-transform";
import type { ColumnDefinition } from "@langfuse/shared";

// Temporary column definitions for experiments
// TODO: Move to shared package once backend is implemented
// Column definitions that match backend experimentCols mapping
// These must align with packages/shared/src/server/tableMappings/mapExperimentTable.ts
export const experimentsTableCols: ColumnDefinition[] = [
  {
    name: "ID",
    id: "id",
    type: "string",
    internal: "experiment_id",
  },
  {
    name: "名称",
    id: "name",
    type: "string",
    internal: "experiment_name",
  },
  {
    name: "描述",
    id: "description",
    type: "string",
    internal: "experiment_description",
    nullable: true,
  },
  {
    name: "元数据",
    id: "metadata",
    type: "stringObject",
    internal: "experiment_metadata",
    nullable: true,
  },
  {
    name: "引用的提示词",
    id: "prompts",
    type: "string",
    internal: "prompts",
    nullable: true,
  },
  {
    name: "数据集",
    id: "experimentDatasetId",
    type: "stringOptions",
    internal: "experiment_dataset_id",
    options: [],
  },
  {
    name: "开始时间",
    id: "startTime",
    type: "datetime",
    internal: "start_time",
  },
  {
    name: "数据项数",
    id: "itemCount",
    type: "number",
    internal: "item_count",
  },
  {
    name: "总成本 ($)",
    id: "totalCost",
    type: "number",
    internal: "total_cost",
    nullable: true,
  },
  {
    name: "延迟 (秒)",
    id: "latencyAvg",
    type: "number",
    internal: "latency_avg",
    nullable: true,
  },
  {
    name: "错误数",
    id: "errorCount",
    type: "number",
    internal: "error_count",
  },
  // Observation-level scores (eos.* alias in backend)
  {
    name: "评分（数值）",
    id: "obs_scores_avg",
    type: "numberObject",
    internal: "obs_scores_avg",
  },
  {
    name: "评分（分类）",
    id: "obs_score_categories",
    type: "categoryOptions",
    internal: "obs_score_categories",
    options: [],
    nullable: true,
  },
  {
    name: "评分（布尔）",
    id: "obs_score_booleans",
    type: "booleanObject",
    internal: "obs_score_booleans",
    nullable: true,
  },
  // Trace-level scores (ets.* alias in backend)
  {
    name: "追踪评分（数值）",
    id: "trace_scores_avg",
    type: "numberObject",
    internal: "trace_scores_avg",
  },
  {
    name: "追踪评分（分类）",
    id: "trace_score_categories",
    type: "categoryOptions",
    internal: "trace_score_categories",
    options: [],
    nullable: true,
  },
  {
    name: "追踪评分（布尔）",
    id: "trace_score_booleans",
    type: "booleanObject",
    internal: "trace_score_booleans",
    nullable: true,
  },
];

// Helper function to get column name from experimentsTableCols by ID
export const getExperimentsColumnName = (id: string): string => {
  const column = experimentsTableCols.find((col) => col.id === id);
  if (!column) {
    throw new Error(`Column ${id} not found in experimentsTableCols`);
  }
  return column.name;
};

/**
 * Maps frontend column IDs to backend-expected column IDs for experiments table
 */
export const EXPERIMENTS_COLUMN_TO_BACKEND_KEY: ColumnToBackendKeyMap = {
  // No mapping needed currently
};

export const experimentsFilterConfig: FilterConfig = {
  tableName: "experiments",

  columnDefinitions: experimentsTableCols,

  defaultExpanded: ["experimentDatasetId"],

  facets: [
    {
      type: "string" as const,
      column: "name",
      label: getExperimentsColumnName("name"),
    },
    {
      type: "categorical" as const,
      column: "experimentDatasetId",
      label: getExperimentsColumnName("experimentDatasetId"),
    },
    {
      type: "stringKeyValue" as const,
      column: "metadata",
      label: getExperimentsColumnName("metadata"),
    },
    // Observation-level scores
    {
      type: "keyValue" as const,
      column: "obs_score_categories",
      label: getExperimentsColumnName("obs_score_categories"),
    },
    {
      type: "numericKeyValue" as const,
      column: "obs_scores_avg",
      label: getExperimentsColumnName("obs_scores_avg"),
    },
    {
      type: "booleanKeyValue" as const,
      column: "obs_score_booleans",
      label: getExperimentsColumnName("obs_score_booleans"),
    },
    // Trace-level scores
    {
      type: "keyValue" as const,
      column: "trace_score_categories",
      label: getExperimentsColumnName("trace_score_categories"),
    },
    {
      type: "numericKeyValue" as const,
      column: "trace_scores_avg",
      label: getExperimentsColumnName("trace_scores_avg"),
    },
    {
      type: "booleanKeyValue" as const,
      column: "trace_score_booleans",
      label: getExperimentsColumnName("trace_score_booleans"),
    },
  ],
};

export type ExperimentsOmittableFilterColumn = "experimentDatasetId";

export function isExperimentsOmittableFilterColumn(
  column: string,
): column is ExperimentsOmittableFilterColumn {
  return column === "experimentDatasetId";
}

export function getExperimentsFilterConfig(
  omittedFilter: ExperimentsOmittableFilterColumn[] = [],
): FilterConfig {
  return omitFilterFacets(experimentsFilterConfig, omittedFilter);
}
