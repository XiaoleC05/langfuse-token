import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/src/components/ui/hover-card";
import { Info } from "lucide-react";

interface SamplingMetadata {
  samplingRate: number;
  preflightEstimates?: {
    score1Count: number;
    score2Count: number;
    estimatedMatchedCount: number;
  };
  adaptiveFinal?: {
    usedFinal: boolean;
    reason: string;
  };
}

interface SamplingDetailsHoverCardProps {
  samplingMetadata: SamplingMetadata;
  mode?: "single" | "two";
  showLabel?: boolean;
}

export function SamplingDetailsHoverCard({
  samplingMetadata,
  mode = "two",
  showLabel = false,
}: SamplingDetailsHoverCardProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          className={
            showLabel
              ? "text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
              : "hover:bg-muted-foreground/10 inline-flex h-4 w-4 items-center justify-center rounded-full"
          }
          aria-label="查看采样详情"
        >
          {showLabel && <span>采样数据</span>}
          <Info
            className={showLabel ? "h-3 w-3" : "text-muted-foreground h-3 w-3"}
          />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="start">
        <div className="space-y-3">
          <div>
            <h4 className="mb-2 text-sm font-bold">
              {mode === "single" ? "预估评分数量" : "预估评分"}
            </h4>
            <dl className="space-y-1 text-sm">
              {mode === "single" ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">总评分:</dt>
                  <dd className="font-bold">
                    ~
                    {samplingMetadata.preflightEstimates?.score1Count.toLocaleString()}
                  </dd>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">评分 1:</dt>
                    <dd className="font-bold">
                      ~
                      {samplingMetadata.preflightEstimates?.score1Count.toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">评分 2:</dt>
                    <dd className="font-bold">
                      ~
                      {samplingMetadata.preflightEstimates?.score2Count.toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      预估匹配数:
                    </dt>
                    <dd className="font-bold">
                      ~
                      {samplingMetadata.preflightEstimates?.estimatedMatchedCount.toLocaleString()}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-bold">查询优化</h4>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">采样:</dt>
                <dd className="font-bold">
                  {(samplingMetadata.samplingRate * 100).toFixed(1)}%
                  (hash-based)
                </dd>
              </div>
              {samplingMetadata.adaptiveFinal && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">去重:</dt>
                  <dd className="font-bold">
                    {samplingMetadata.adaptiveFinal.usedFinal
                      ? "已启用"
                      : "因性能原因跳过"}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <p className="text-muted-foreground text-xs">
            基于哈希的采样可在保持统计准确性的同时确保结果一致且可复现。
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
