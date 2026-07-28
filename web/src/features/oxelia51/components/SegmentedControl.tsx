"use client";

import { cn } from "@/src/utils/tailwind";

type SegmentedControlProps<T extends string> = {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

/** 小型分段切换控件（CNY/USD、日/周/月粒度等），选中态使用主题 accent 色。 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border p-0.5",
        className,
      )}
      role="group"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
            option.value === value
              ? "bg-[var(--ox-accent)] text-white"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
          aria-pressed={option.value === value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
