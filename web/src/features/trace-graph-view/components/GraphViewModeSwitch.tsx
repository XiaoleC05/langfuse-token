import React from "react";
import { Combine, Route, type LucideIcon } from "lucide-react";

import { cn } from "@/src/utils/tailwind";
import { type GraphViewMode } from "../types";

/**
 * Segmented mode switch overlaid on the graph canvas. Mirrors the Tree/Timeline
 * ViewModeSwitch styling (TracePanelNavigationHeader) so the trace view's mode
 * switches read as one family.
 */
const MODES: {
  mode: GraphViewMode;
  icon: LucideIcon;
  label: string;
  title: string;
}[] = [
  {
    mode: "aggregated",
    icon: Combine,
    label: "聚合视图",
    title: "将重复步骤合并为一个节点——展示整体结构",
  },
  {
    mode: "expanded",
    icon: Route,
    label: "展开视图",
    title: "每个调用作为独立节点，按运行顺序排列",
  },
];

export function GraphViewModeSwitch({
  value,
  onChange,
}: {
  value: GraphViewMode;
  onChange: (mode: GraphViewMode) => void;
}) {
  return (
    <div className="bg-background/80 inline-flex h-7 items-center rounded-md border p-0.5 backdrop-blur">
      {MODES.map(({ mode, icon: Icon, label, title }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          aria-pressed={value === mode}
          aria-label={label}
          title={title}
          className={cn(
            "flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-bold transition-colors",
            value === mode
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          {/* Collapse to icons on narrow canvases (mirrors the nav header's
              switch) so the pill never collides with the zoom stack. */}
          <span className="@max-[340px]/graphcanvas:hidden">{label}</span>
        </button>
      ))}
    </div>
  );
}
