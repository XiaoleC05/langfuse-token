"use client";

import { InAppAgentToolPayload } from "./InAppAgentToolPayload";
import type { InAppAgentToolCallContent } from "./utils/utils";

const TOOL_CALL_RESULT_PRESENTATION = {
  running: { label: "结果", variant: "default" },
  succeeded: { label: "结果", variant: "default" },
  failed: { label: "错误", variant: "failed" },
  denied: { label: "已拒绝", variant: "denied" },
} as const satisfies Record<
  InAppAgentToolCallContent["status"],
  {
    label: string;
    variant: "default" | "failed" | "denied";
  }
>;

export function InAppAgentToolResultPayload({
  tool,
}: {
  tool: InAppAgentToolCallContent;
}) {
  if (tool.result === undefined && tool.error === undefined) {
    return null;
  }

  const presentation = TOOL_CALL_RESULT_PRESENTATION[tool.status];

  return (
    <InAppAgentToolPayload
      label={presentation.label}
      value={tool.error ?? tool.result ?? ""}
      variant={presentation.variant}
    />
  );
}
