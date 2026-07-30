import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { Settings2, Check } from "lucide-react";

type ExperimentDisplaySettingsProps = {
  layout: "grid" | "list";
  onLayoutChange: (layout: "grid" | "list") => void;
  itemVisibility: "baseline-only" | "all";
  onItemVisibilityChange: (visibility: "baseline-only" | "all") => void;
  hasComparisons: boolean;
  hasBaseline: boolean;
};

export function ExperimentDisplaySettings({
  layout,
  onLayoutChange,
  itemVisibility,
  onItemVisibilityChange,
  hasComparisons,
  hasBaseline,
}: ExperimentDisplaySettingsProps) {
  const isItemVisibilityDisabled = !hasComparisons || !hasBaseline;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Settings2 className="h-4 w-4" />
          <span className="ml-2 hidden md:inline">显示</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>布局</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onLayoutChange("grid")}>
          {layout === "grid" && <Check className="mr-2 h-4 w-4" />}
          {layout !== "grid" && <span className="mr-2 h-4 w-4" />}
          网格
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onLayoutChange("list")}>
          {layout === "list" && <Check className="mr-2 h-4 w-4" />}
          {layout !== "list" && <span className="mr-2 h-4 w-4" />}
          列表
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>数据项可见性</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => onItemVisibilityChange("baseline-only")}
          disabled={isItemVisibilityDisabled}
        >
          {itemVisibility === "baseline-only" && (
            <Check className="mr-2 h-4 w-4" />
          )}
          {itemVisibility !== "baseline-only" && (
            <span className="mr-2 h-4 w-4" />
          )}
          仅显示基线中的数据项
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onItemVisibilityChange("all")}
          disabled={isItemVisibilityDisabled}
        >
          {itemVisibility === "all" && <Check className="mr-2 h-4 w-4" />}
          {itemVisibility !== "all" && <span className="mr-2 h-4 w-4" />}
          显示全部数据项
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
