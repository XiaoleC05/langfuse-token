import { Info } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/src/components/ui/button";

type DatasetVersionWarningBannerProps = {
  selectedVersion: Date;
  resetToLatest: () => void;
  className?: string;
  changeCounts?: {
    upserts: number;
    deletes: number;
  };
};

export function DatasetVersionWarningBanner({
  selectedVersion,
  resetToLatest,
  className = "",
  changeCounts,
}: DatasetVersionWarningBannerProps) {
  const totalChanges = changeCounts
    ? changeCounts.upserts + changeCounts.deletes
    : 0;
  const hasChanges = totalChanges > 0;

  return (
    <div
      className={`border-accent-dark-blue/10 bg-accent-light-blue/30 flex items-start gap-3 border-b p-3 ${className}`}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm wrap-break-word">
            正在查看自{" "}
            <span className="text-foreground font-bold">
              {format(selectedVersion, "MMM d, yyyy 'at' h:mm a")}
            </span>{" "}
            起的版本
          </p>
          <Button
            onClick={resetToLatest}
            variant="link"
            className="h-auto shrink-0 p-0 text-sm underline-offset-4"
          >
            返回最新版本
          </Button>
        </div>
        {changeCounts && hasChanges && (
          <p className="text-muted-foreground text-xs">
            自该版本以来共有 {totalChanges} 处变更，
            {changeCounts.upserts > 0 &&
              ` 其中 ${changeCounts.upserts} 次新增/更新`}
            {changeCounts.deletes > 0 &&
              `，${changeCounts.deletes} 次删除`}
          </p>
        )}
      </div>
    </div>
  );
}
