import { startCase } from "lodash";
import { type z } from "zod";

import { type metricAggregations } from "@langfuse/shared";
import {
  type MonitorThresholdOperator,
  type MonitorView,
  type MonitorWindow,
} from "@langfuse/shared/monitors";

import { operatorLabels, viewLabels, windowLabels } from "./monitorLabels";

/** proseWindowLabels overrides windowLabels for prose, dropping the redundant "1" on singular units. */
const proseWindowLabels: Partial<Record<MonitorWindow, string>> = {
  "1h": "小时",
  "1d": "天",
  "1w": "周",
};

/** windowLabel renders a window for prose, e.g. "hour" or "5 minutes". */
const windowLabel = (window: MonitorWindow): string =>
  proseWindowLabels[window] ?? windowLabels[window];

/** aggregationLabel renders an aggregation as a leading word, e.g. "Sum" or "p95". */
export const aggregationLabel = (
  aggregation: z.infer<typeof metricAggregations>,
): string => {
  // startCase mangles percentile tokens ("p95" -> "P 95"); keep them verbatim.
  if (/^p\d+$/.test(aggregation)) return aggregation;
  const map: Record<string, string> = {
    sum: "总和",
    avg: "平均值",
    min: "最小值",
    max: "最大值",
    count: "计数",
  };
  return map[aggregation] ?? startCase(aggregation);
};

/** metricSubject renders the noun a metric measures, e.g. "Observations Latency" or "Observations" for a bare count. */
const metricSubject = (view: MonitorView, measure: string): string =>
  measure === "count"
    ? viewLabels[view]
    : `${viewLabels[view]} ${startCase(measure)}`;

/** renderMetricDescription renders a metric as prose, e.g. "Sum of Observations Latency". */
const renderMetricDescription = (
  view: MonitorView,
  metric: { measure: string; aggregation: z.infer<typeof metricAggregations> },
): string =>
  `${metricSubject(view, metric.measure)} ${aggregationLabel(metric.aggregation)}`;

/** renderNamePlaceholder renders the auto-suggested monitor name, e.g. "Observations Latency 总和 低于 100". */
export const renderNamePlaceholder = ({
  view,
  metric,
  thresholdOperator,
  alertThreshold,
}: {
  view: MonitorView;
  metric: { measure: string; aggregation: z.infer<typeof metricAggregations> };
  thresholdOperator: MonitorThresholdOperator;
  alertThreshold?: number | null;
}): string => {
  const value =
    alertThreshold != null && Number.isFinite(alertThreshold)
      ? alertThreshold
      : 0;
  return `${renderMetricDescription(view, metric)} ${operatorLabels[thresholdOperator]} ${value}`;
};

/** renderChartSubtitle renders the preview subtitle, e.g. "Observations Latency 总和 每 5 分钟". */
export const renderChartSubtitle = ({
  view,
  metric,
  window,
}: {
  view: MonitorView;
  metric: { measure: string; aggregation: z.infer<typeof metricAggregations> };
  window: MonitorWindow;
}): string =>
  `${renderMetricDescription(view, metric)} 每 ${windowLabel(window)}`;
