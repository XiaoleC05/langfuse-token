import { isNumericDataType } from "@/src/features/scores/lib/helpers";
import { isPresent, type ScoreConfigDomain } from "@langfuse/shared";
import React from "react";

export function ScoreConfigDetails({ config }: { config: ScoreConfigDomain }) {
  const { name, description, minValue, maxValue, dataType } = config;
  if (!description && !isPresent(minValue) && !isPresent(maxValue)) return null;
  const isNameTruncated = name.length > 20;

  return (
    <div className="bg-background p-2 text-xs text-wrap">
      {!!description && <p>{`描述:${description}`}</p>}
      {isNumericDataType(dataType) &&
      (isPresent(minValue) || isPresent(maxValue)) ? (
        <p>{`范围:[${minValue ?? "-∞"}, ${maxValue ?? "∞"}]`}</p>
      ) : null}
      {isNameTruncated && <p>{`完整名称:${name}`}</p>}
    </div>
  );
}
