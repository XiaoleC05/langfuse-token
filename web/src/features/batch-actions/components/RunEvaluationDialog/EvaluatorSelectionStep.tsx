import { useMemo } from "react";
import { observationVariableMappingList } from "@langfuse/shared";
import { type RouterOutputs } from "@/src/utils/api";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/design-system/Checkbox/Checkbox";
import { Input } from "@/src/components/ui/input";
import { EvaluatorPromptPreview } from "./EvaluatorPromptPreview";
import { renderPromptPreviewFromObservation } from "./utils";
import { Eye, Plus, X } from "lucide-react";

type Evaluator = RouterOutputs["evals"]["jobConfigsByTarget"][number];
type ObservationPreview = RouterOutputs["observations"]["byId"];
type EventPreview = RouterOutputs["events"]["batchIO"][number];

type EvaluatorSelectionStepProps = {
  eligibleEvaluators: Evaluator[];
  selectedEvaluators: Evaluator[];
  isQueryLoading: boolean;
  isQueryError: boolean;
  queryErrorMessage: string | undefined;
  previewObservation: ObservationPreview | EventPreview | undefined;
  isPreviewLoading: boolean;
  evaluatorScopeLabel: "观测" | "实验";
  selectedEvaluatorIds: string[];
  evaluatorSearchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onToggleEvaluator: (evaluatorId: string) => void;
  onCreateEvaluator: () => void;
};

export function EvaluatorSelectionStep(props: EvaluatorSelectionStepProps) {
  const {
    eligibleEvaluators,
    selectedEvaluators,
    isQueryLoading,
    isQueryError,
    queryErrorMessage,
    previewObservation,
    isPreviewLoading,
    evaluatorScopeLabel,
    selectedEvaluatorIds,
    evaluatorSearchQuery,
    onSearchQueryChange,
    onToggleEvaluator,
    onCreateEvaluator,
  } = props;

  const filteredEvaluators = useMemo(() => {
    const normalizedSearch = evaluatorSearchQuery.trim().toLowerCase();
    const filtered = normalizedSearch
      ? eligibleEvaluators.filter((evaluator) => {
          const templateName = evaluator.evalTemplate?.name ?? "";

          return (
            evaluator.scoreName.toLowerCase().includes(normalizedSearch) ||
            templateName.toLowerCase().includes(normalizedSearch)
          );
        })
      : eligibleEvaluators;

    return [...filtered].sort((a, b) =>
      a.scoreName.localeCompare(b.scoreName, undefined, {
        sensitivity: "base",
      }),
    );
  }, [eligibleEvaluators, evaluatorSearchQuery]);

  const getPromptPreview = (evaluator: Evaluator) => {
    if (isPreviewLoading) {
      return "正在加载预览...";
    }

    if (!previewObservation) {
      return "当前选择无法预览。";
    }

    const mappingResult = observationVariableMappingList.safeParse(
      evaluator.variableMapping,
    );

    if (!mappingResult.success) {
      return "评估器映射对观测预览无效。";
    }

    return renderPromptPreviewFromObservation({
      prompt: evaluator.evalTemplate?.prompt,
      variableMapping: mappingResult.data,
      observation: previewObservation,
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex min-h-0 flex-1 flex-col">
        {isQueryLoading ? (
          <p className="text-muted-foreground text-sm">正在加载评估器...</p>
        ) : isQueryError ? (
          <Card>
            <CardContent className="text-destructive p-4 text-sm">
              加载评估器失败：{queryErrorMessage}
            </CardContent>
          </Card>
        ) : eligibleEvaluators.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground p-4 text-sm">
              未找到{evaluatorScopeLabel}范围的评估器。创建一个新的{" "}
              {evaluatorScopeLabel}范围的评估器，它将显示在此处。
            </CardContent>
          </Card>
        ) : (
          <div className="flex h-full min-h-0 flex-col gap-2">
            <div className="relative">
              <Input
                autoFocus
                className="pr-10"
                placeholder="搜索评估器..."
                value={evaluatorSearchQuery}
                onChange={(event) =>
                  onSearchQueryChange(event.currentTarget.value)
                }
              />
              {evaluatorSearchQuery.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1/2 right-1.5 h-7 w-7 -translate-y-1/2"
                  onClick={() => onSearchQueryChange("")}
                  aria-label="清除评估器搜索"
                >
                  <X className="h-3 w-3" />
                </Button>
              ) : null}
            </div>

            <div className="px-1 pb-1">
              <div className="flex min-h-6 flex-wrap items-center gap-2">
                {selectedEvaluators.length > 0 ? (
                  selectedEvaluators.map((evaluator) => (
                    <EvaluatorPromptPreview
                      key={evaluator.id}
                      previewContent={getPromptPreview(evaluator)}
                      trigger={
                        <div>
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1 pr-1"
                          >
                            <span>{evaluator.scoreName}</span>
                            <button
                              type="button"
                              aria-label={`移除 ${evaluator.scoreName}`}
                              className="hover:bg-muted rounded p-0.5"
                              onClick={() => onToggleEvaluator(evaluator.id)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        </div>
                      }
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground text-xs">
                    未选择评估器
                  </p>
                )}
              </div>
            </div>

            {filteredEvaluators.length === 0 ? (
              <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border">
                <p className="text-muted-foreground p-4 text-sm">
                  没有符合搜索条件的评估器。
                </p>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
                {filteredEvaluators.map((item, index, array) => {
                  const templateLabel = `模板：${item.evalTemplate?.name ?? "已删除的模板"}`;

                  return (
                    <div key={item.id}>
                      <div
                        className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 px-2 py-1.5 transition-colors"
                        onClick={() => onToggleEvaluator(item.id)}
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-sm font-bold"
                            title={item.scoreName}
                          >
                            {item.scoreName}
                          </p>
                          <p
                            className="text-muted-foreground truncate text-[11px]"
                            title={templateLabel}
                          >
                            {templateLabel}
                          </p>
                        </div>
                        <EvaluatorPromptPreview
                          previewContent={getPromptPreview(item)}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-7 w-7"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                              }}
                              onClick={(event) => event.stopPropagation()}
                              aria-label={`预览 ${item.scoreName}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <span className="mr-1">
                          <Checkbox
                            checked={selectedEvaluatorIds.includes(item.id)}
                            aria-label={`选择 ${item.scoreName}`}
                            onClick={(event) => event.stopPropagation()}
                            onCheckedChange={() => onToggleEvaluator(item.id)}
                          />
                        </span>
                      </div>
                      {index < array.length - 1 ? (
                        <div className="border-border/50 border-b" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <Button
        variant="outline"
        size="default"
        className="h-9 w-full"
        onClick={onCreateEvaluator}
      >
        <Plus className="mr-1 h-4 w-4" />
        创建新评估器
      </Button>
    </div>
  );
}
