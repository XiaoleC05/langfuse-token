import { describe, expect, it } from "vitest";

import { renderNamePlaceholder } from "./renderMonitorLabels";

describe("renderNamePlaceholder", () => {
  it("measured metric: aggregation of view + measure is operator threshold", () => {
    expect(
      renderNamePlaceholder({
        view: "observations",
        metric: { measure: "latency", aggregation: "sum" },
        thresholdOperator: "LT",
        alertThreshold: 100,
      }),
    ).toBe("观测数据 Latency 总和 低于 100");
  });

  it("percentile aggregation: kept verbatim, not start-cased into 'P 95'", () => {
    expect(
      renderNamePlaceholder({
        view: "observations",
        metric: { measure: "latency", aggregation: "p95" },
        thresholdOperator: "GT",
        alertThreshold: 100,
      }),
    ).toBe("观测数据 Latency p95 高于 100");
  });

  it("bare count: omits the measure", () => {
    expect(
      renderNamePlaceholder({
        view: "observations",
        metric: { measure: "count", aggregation: "count" },
        thresholdOperator: "GT",
        alertThreshold: 5,
      }),
    ).toBe("观测数据 计数 高于 5");
  });

  it("missing threshold: defaults the value to 0", () => {
    expect(
      renderNamePlaceholder({
        view: "observations",
        metric: { measure: "count", aggregation: "count" },
        thresholdOperator: "GT",
        alertThreshold: null,
      }),
    ).toBe("观测数据 计数 高于 0");
  });
});
