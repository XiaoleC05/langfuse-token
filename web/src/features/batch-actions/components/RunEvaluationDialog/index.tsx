import { useMemo, useState } from "react";
import {
  type BatchActionQuery,
  type BatchEvalSourceTable,
  EvalTargetObject,
  BatchEvalSourceTable as SourceTable,
  getEvalTargetObjectFromSourceTable,
} from "@langfuse/shared";
import { api, sendAsPostOption } from "@/src/utils/api";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { ChevronLeft } from "lucide-react";
import { EvaluatorSelectionStep } from "./EvaluatorSelectionStep";
import { ConfirmationStep } from "./ConfirmationStep";
import { CreateEvaluatorDialog } from "./CreateEvaluatorDialog";
import { buildQueryWithSelectedIds } from "./utils";
import { useV4Beta } from "@/src/features/events/hooks/useV4Beta";

type RunEvaluationDialogProps = {
  projectId: string;
  selectedObservationIds: string[];
  query: BatchActionQuery;
  selectAll: boolean;
  totalCount: number;
  onClose: () => void;
  experimentCount?: number;
  exampleObservation?: {
    id: string;
    traceId: string;
    startTime?: Date;
  };
  sourceTable?: BatchEvalSourceTable;
};

type DialogStep = "select-evaluator" | "confirm";

export function RunEvaluationDialog(props: RunEvaluationDialogProps) {
  const { isBetaEnabled } = useV4Beta();
  const {
    projectId,
    selectedObservationIds,
    query,
    selectAll,
    totalCount,
    sourceTable = SourceTable.EVENTS,
  } = props;

  const [step, setStep] = useState<DialogStep>("select-evaluator");
  const [selectedEvaluatorIds, setSelectedEvaluatorIds] = useState<string[]>(
    [],
  );
  const [evaluatorSearchQuery, setEvaluatorSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Derive targetObject from sourceTable
  const targetObject = getEvalTargetObjectFromSourceTable(sourceTable);

  const evaluatorsQuery = api.evals.jobConfigsByTarget.useQuery({
    projectId,
    targetObject,
  });

  const runEvaluationMutation =
    api.batchAction.runEvaluation.create.useMutation({
      onError: (error) => {
        showErrorToast("安排评估失败", error.message);
      },
    });

  const displayCount = selectAll ? totalCount : selectedObservationIds.length;
  // For experiments source, displayCount is experiment count, not item count
  const isExperimentsSource = sourceTable === SourceTable.EXPERIMENTS;
  const scopeLabel =
    sourceTable === SourceTable.EVENTS ? "观测" : "实验项";
  const evaluatorScopeLabel =
    targetObject === EvalTargetObject.EVENT ? "观测" : "实验";
  const experimentItemsExperimentCount =
    sourceTable === SourceTable.EXPERIMENT_ITEMS
      ? (props.experimentCount ?? 0)
      : 0;

  const previewObservationQuery = api.observations.byId.useQuery(
    {
      projectId,
      observationId: props.exampleObservation?.id as string,
      traceId: props.exampleObservation?.traceId as string,
      startTime: props.exampleObservation?.startTime ?? null,
    },
    {
      enabled:
        !isBetaEnabled &&
        Boolean(
          props.exampleObservation?.id && props.exampleObservation?.traceId,
        ),
    },
  );

  const previewEventQuery = api.events.batchIO.useQuery(
    {
      projectId,
      observations: [
        {
          id: props.exampleObservation?.id as string,
          traceId: props.exampleObservation?.traceId as string,
        },
      ],
      minStartTime: props.exampleObservation?.startTime as Date,
      maxStartTime: props.exampleObservation?.startTime as Date,
      truncated: false,
      includeToolCalls: true,
    },
    {
      ...sendAsPostOption,
      enabled:
        isBetaEnabled &&
        Boolean(
          props.exampleObservation?.id &&
          props.exampleObservation?.traceId &&
          props.exampleObservation?.startTime,
        ),
    },
  );

  const eligibleEvaluators = useMemo(() => {
    return (evaluatorsQuery.data ?? []).filter(
      (evaluator) => evaluator.targetObject === targetObject,
    );
  }, [evaluatorsQuery.data, targetObject]);

  const selectedEvaluators = useMemo(
    () =>
      eligibleEvaluators.filter((evaluator) =>
        selectedEvaluatorIds.includes(evaluator.id),
      ),
    [eligibleEvaluators, selectedEvaluatorIds],
  );

  const toggleEvaluatorSelection = (evaluatorId: string) => {
    setSelectedEvaluatorIds((previous) =>
      previous.includes(evaluatorId)
        ? previous.filter((id) => id !== evaluatorId)
        : [...previous, evaluatorId],
    );
  };

  const onSubmit = async () => {
    if (selectedEvaluators.length === 0) {
      return;
    }

    const finalQuery = buildQueryWithSelectedIds({
      query,
      selectAll,
      selectedObservationIds,
    });

    try {
      await runEvaluationMutation.mutateAsync({
        projectId,
        query: finalQuery,
        evaluatorIds: selectedEvaluators.map((evaluator) => evaluator.id),
        sourceTable,
      });
    } catch {
      return;
    }

    showSuccessToast({
      title: "评估已排入队列",
      description: isExperimentsSource
        ? `已为 ${displayCount} 个所选实验中的项目安排评估，使用 ${selectedEvaluators.length} 个${selectedEvaluators.length === 1 ? "评估器" : "评估器"}。`
        : sourceTable === SourceTable.EXPERIMENT_ITEMS
          ? `已为最多 ${displayCount} 个实验项（跨 ${experimentItemsExperimentCount} 个实验）安排评估，使用 ${selectedEvaluators.length} 个${selectedEvaluators.length === 1 ? "评估器" : "评估器"}。`
          : `已为 ${displayCount} 个所选${scopeLabel}安排评估，使用 ${selectedEvaluators.length} 个${selectedEvaluators.length === 1 ? "评估器" : "评估器"}。`,
      link: {
        href: `/project/${projectId}/settings/batch-actions`,
        text: "查看批量操作",
      },
    });

    props.onClose();
  };

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && props.onClose()}>
        <DialogContent className="flex max-h-[62vh] min-h-[38vh] max-w-2xl flex-col">
          <DialogHeader>
            <DialogTitle>
              {isExperimentsSource
                ? `评估 ${displayCount} 个实验中的项目`
                : sourceTable === SourceTable.EXPERIMENT_ITEMS
                  ? `评估最多 ${displayCount} 个实验项（跨 ${experimentItemsExperimentCount} 个实验）`
                  : `评估 ${displayCount} 个${scopeLabel}`}
            </DialogTitle>
            <DialogDescription>
              {step === "confirm"
                ? "运行前请检查您的评估配置。"
                : `选择一个或多个${evaluatorScopeLabel}范围的评估器。`}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex-1 overflow-hidden">
            {step === "select-evaluator" ? (
              <EvaluatorSelectionStep
                eligibleEvaluators={eligibleEvaluators}
                selectedEvaluators={selectedEvaluators}
                isQueryLoading={evaluatorsQuery.isLoading}
                isQueryError={evaluatorsQuery.isError}
                queryErrorMessage={evaluatorsQuery.error?.message}
                previewObservation={
                  isBetaEnabled
                    ? previewEventQuery.data?.[0]
                    : previewObservationQuery.data
                }
                isPreviewLoading={
                  previewObservationQuery.isLoading ||
                  previewEventQuery.isLoading
                }
                evaluatorScopeLabel={evaluatorScopeLabel}
                selectedEvaluatorIds={selectedEvaluatorIds}
                evaluatorSearchQuery={evaluatorSearchQuery}
                onSearchQueryChange={setEvaluatorSearchQuery}
                onToggleEvaluator={toggleEvaluatorSelection}
                onCreateEvaluator={() => setShowCreateDialog(true)}
              />
            ) : (
              <ConfirmationStep
                projectId={projectId}
                displayCount={displayCount}
                evaluators={selectedEvaluators.map((e) => ({
                  id: e.id,
                  name: e.scoreName,
                }))}
                hideCount={targetObject === EvalTargetObject.EXPERIMENT}
                sourceTable={sourceTable}
                experimentCount={experimentItemsExperimentCount}
              />
            )}
          </DialogBody>

          <DialogFooter className="flex justify-between">
            {step === "confirm" ? (
              <Button
                variant="ghost"
                onClick={() => setStep("select-evaluator")}
                disabled={runEvaluationMutation.isPending}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                返回
              </Button>
            ) : (
              <div />
            )}

            {step === "select-evaluator" ? (
              <Button
                onClick={() => setStep("confirm")}
                disabled={selectedEvaluators.length === 0}
              >
                继续{" "}
                {selectedEvaluators.length > 0
                  ? `使用 ${selectedEvaluators.length} 个评估器`
                  : null}
              </Button>
            ) : (
              <Button
                onClick={onSubmit}
                loading={runEvaluationMutation.isPending}
              >
                运行评估
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateEvaluatorDialog
        projectId={projectId}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        targetObject={targetObject}
      />
    </>
  );
}
