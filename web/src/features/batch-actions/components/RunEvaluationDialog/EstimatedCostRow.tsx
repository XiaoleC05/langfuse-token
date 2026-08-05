import { InfoIcon } from "lucide-react";
import { api } from "@/src/utils/api";
import { usdFormatter } from "@/src/utils/numbers";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

type EstimatedCostRowProps = {
  projectId: string;
  evaluators: Array<{ id: string; name: string }>;
  observationCount: number;
};

function formatCostEstimate(cost: number): string {
  if (cost > 0 && cost < 0.005) return "< $0.01";
  return `~${usdFormatter(cost, 2, 2)}`;
}

export function EstimatedCostRow(props: EstimatedCostRowProps) {
  const { projectId, evaluators, observationCount } = props;

  const evaluatorIds = evaluators.map((e) => e.id);

  const avgCostQuery = api.evals.avgCostByEvaluatorIds.useQuery(
    { projectId, evaluatorIds },
    { enabled: evaluators.length > 0 },
  );

  if (avgCostQuery.isLoading) {
    return (
      <div className="flex gap-2">
        <span className="text-muted-foreground shrink-0">
          预估模型 API 密钥成本：
        </span>
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  const data = avgCostQuery.data;
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex gap-2">
        <span className="text-muted-foreground shrink-0">
          预估模型 API 密钥成本：
        </span>
        <span className="text-muted-foreground">无数据</span>
      </div>
    );
  }

  const evaluatorsWithData = evaluatorIds.filter((id) => id in data);
  const evaluatorsWithoutData = evaluatorIds.filter((id) => !(id in data));
  const isPartial = evaluatorsWithoutData.length > 0;

  const totalEstimate = evaluatorsWithData.reduce(
    (sum, id) => sum + data[id].avgCost * observationCount,
    0,
  );

  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground shrink-0">
        预估模型 API 密钥成本：
      </span>
      <span className="flex items-center gap-1 font-bold">
        {formatCostEstimate(totalEstimate)}
        {isPartial ? "*" : ""}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="text-muted-foreground h-3 w-3" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs space-y-2 p-3">
              <p className="text-xs">
                您关联的 API 密钥上的预期费用（非 Langfuse）。根据过去 7 天评估器执行的平均费用估算。
              </p>
              <div className="space-y-1">
                {evaluators.map(({ id, name }) => {
                  const entry = data[id];
                  return (
                    <div
                      key={id}
                      className="flex justify-between gap-4 text-xs"
                    >
                      <span className="truncate" title={name}>
                        {name}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {entry
                          ? formatCostEstimate(entry.avgCost * observationCount)
                          : "无数据"}
                      </span>
                    </div>
                  );
                })}
              </div>
              {isPartial ? (
                <p className="text-muted-foreground text-xs">
                  *部分估算。部分评估器没有执行历史。
                </p>
              ) : null}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </span>
    </div>
  );
}
