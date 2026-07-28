"use client";

import { Moon, Sun } from "lucide-react";
import { useOxelia51Theme } from "@/src/features/theming/oxelia51-theme";
import { cn } from "@/src/utils/tailwind";

/** 导航栏底部的 Cozy / Cosmos 双主题切换。 */
export function Oxelia51ThemeToggle() {
  const [theme, setTheme] = useOxelia51Theme();

  return (
    <div
      className="flex items-center gap-1 rounded-md border p-1 group-data-[collapsible=icon]:hidden"
      role="group"
      aria-label="Oxelia51 主题切换"
    >
      <button
        type="button"
        title="Cozy 暖色"
        onClick={() => setTheme("cozy")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1 rounded-sm px-2 py-1 text-xs transition-colors",
          theme === "cozy"
            ? "bg-[var(--ox-accent)] text-white"
            : "text-muted-foreground hover:bg-accent",
        )}
      >
        <Sun className="h-3.5 w-3.5" />
        Cozy
      </button>
      <button
        type="button"
        title="Cosmos 深色"
        onClick={() => setTheme("cosmos")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1 rounded-sm px-2 py-1 text-xs transition-colors",
          theme === "cosmos"
            ? "bg-[var(--ox-accent)] text-white"
            : "text-muted-foreground hover:bg-accent",
        )}
      >
        <Moon className="h-3.5 w-3.5" />
        Cosmos
      </button>
    </div>
  );
}
