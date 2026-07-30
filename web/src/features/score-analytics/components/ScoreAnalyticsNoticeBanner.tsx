import { Clock, Info } from "lucide-react";
import { useScoreAnalytics } from "./ScoreAnalyticsProvider";
import { useState, useEffect } from "react";
import { SamplingDetailsHoverCard } from "./SamplingDetailsHoverCard";

export function ScoreAnalyticsNoticeBanner() {
  const { isEstimating, estimate, isLoading, data } = useScoreAnalytics();
  const [showLoadingBanner, setShowLoadingBanner] = useState(false);

  // Track when estimation starts and set delay for showing loading banner
  useEffect(() => {
    if (isEstimating || (estimate && isLoading)) {
      // Start timer - show banner after 1.5 seconds
      const timer = setTimeout(() => {
        setShowLoadingBanner(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
    // Reset when loading completes
    setShowLoadingBanner(false);
  }, [isEstimating, estimate, isLoading]);

  // Don't show anything if we haven't started
  if (!isEstimating && !estimate) return null;

  // State 1: Estimating (loading)
  if (isEstimating || (estimate && isLoading)) {
    const showLargeDataset =
      estimate && estimate.estimatedMatchedCount > 100_000;

    // Only show banner if:
    // 1. Delay has passed, OR
    // 2. We have estimate data showing it's a large dataset
    if (!showLoadingBanner && !showLargeDataset) {
      return null;
    }

    return (
      <div className="bg-muted mb-4 rounded-md px-4 py-3">
        <div className="flex items-start gap-3">
          <Clock className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="text-sm font-bold">
              {showLargeDataset
                ? "正在处理大型数据集..."
                : "加载分析中..."}
            </div>
            {estimate && (
              <div className="text-muted-foreground text-sm">
                {estimate.mode === "single"
                  ? `正在分析 ~${estimate.score1Count.toLocaleString()} 条评分`
                  : `正在分析 ~${estimate.score1Count.toLocaleString()} (评分 1) 和 ~${estimate.score2Count.toLocaleString()} (评分 2) 条评分`}
                {estimate.willSample && " • 将应用采样"}
                {estimate.estimatedQueryTime && (
                  <> • 预估时间: {estimate.estimatedQueryTime}</>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // State 2: Loaded with sampling
  if (data?.samplingMetadata.isSampled) {
    return (
      <div className="bg-muted mb-4 rounded-md px-4 py-3">
        <div className="flex items-start gap-3">
          <Info className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold">
              采样数据
              <SamplingDetailsHoverCard
                samplingMetadata={data.samplingMetadata}
                mode={data.metadata.mode}
              />
            </div>
            <div className="text-muted-foreground text-sm">
              {data.metadata.mode === "single"
                ? `结果基于 ~${data.samplingMetadata.preflightEstimates?.score1Count.toLocaleString()} 条评分的 ${(data.samplingMetadata.samplingRate * 100).toFixed(2)}% 样本。`
                : `结果基于 ~${data.samplingMetadata.preflightEstimates?.score1Count.toLocaleString()} 条评分 1 和 ~${data.samplingMetadata.preflightEstimates?.score2Count.toLocaleString()} 条评分 2 数据的 ${(data.samplingMetadata.samplingRate * 100).toFixed(2)}% 样本。`}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Loaded without sampling (don't show banner)
  return null;
}
