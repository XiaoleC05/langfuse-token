import {
  type MonitorThresholdOperator,
  type MonitorView,
  type MonitorWindow,
} from "@langfuse/shared/monitors";

/** windowLabels maps each MonitorWindow enum value to a human label. */
export const windowLabels: Record<MonitorWindow, string> = {
  "5m": "5 分钟",
  "10m": "10 分钟",
  "15m": "15 分钟",
  "30m": "30 分钟",
  "1h": "1 小时",
  "2h": "2 小时",
  "4h": "4 小时",
  "1d": "1 天",
  "2d": "2 天",
  "1w": "1 周",
};

/** operatorLabels maps each MonitorThresholdOperator to a natural-language label. */
export const operatorLabels: Record<MonitorThresholdOperator, string> = {
  GT: "高于",
  GTE: "高于或等于",
  LT: "低于",
  LTE: "低于或等于",
  EQ: "等于",
  NEQ: "不等于",
};

/** operatorSymbol maps each MonitorThresholdOperator to a single math glyph. */
export const operatorSymbol: Record<MonitorThresholdOperator, string> = {
  GT: ">",
  GTE: "≥",
  LT: "<",
  LTE: "≤",
  EQ: "=",
  NEQ: "≠",
};

/** viewLabels maps each MonitorView to a human label. */
export const viewLabels: Record<MonitorView, string> = {
  observations: "观测数据",
  "scores-numeric": "评分（数值型）",
  "scores-boolean": "评分（布尔型）",
  "scores-categorical": "评分（分类型）",
};
