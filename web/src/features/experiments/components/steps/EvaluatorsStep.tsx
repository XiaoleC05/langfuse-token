import React from "react";
import { FormItem, FormLabel, FormMessage } from "@/src/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { TemplateSelector } from "@/src/features/evals/components/template-selector";
import { EvaluatorForm } from "@/src/features/evals/components/evaluator-form";
import { type EvaluatorsStepProps } from "@/src/features/experiments/types/stepProps";
import { StepHeader } from "@/src/features/experiments/components/shared/StepHeader";

export const EvaluatorsStep: React.FC<EvaluatorsStepProps> = ({
  projectId,
  datasetId,
  evaluatorState,
  permissions,
}) => {
  const {
    evalTemplates,
    selectedEvaluatorData,
    showEvaluatorForm,
    handleConfigureEvaluator,
    handleSelectEvaluator,
    handleCloseEvaluatorForm,
    handleEvaluatorSuccess,
    preprocessFormValues,
  } = evaluatorState;
  const { hasEvalReadAccess, hasEvalWriteAccess } = permissions;
  return (
    <div className="space-y-6">
      <StepHeader
        title="评估器（可选）"
        description="配置评估器以自动为实验结果评分。你可以添加多个评估器来评估 LLM 输出的不同方面。"
      />

      <FormItem>
        <FormLabel>选择评估器</FormLabel>
        {hasEvalReadAccess && datasetId ? (
          <TemplateSelector
            projectId={projectId}
            datasetId={datasetId}
            evalTemplates={evalTemplates}
            onConfigureTemplate={handleConfigureEvaluator}
            onSelectEvaluator={handleSelectEvaluator}
            disabled={!hasEvalWriteAccess}
          />
        ) : (
          <p className="text-muted-foreground text-sm">
            {!hasEvalReadAccess
              ? "你没有管理评估器的权限"
              : "请先选择数据集以配置评估器"}
          </p>
        )}
        <FormMessage />
      </FormItem>

      {/* Dialog for configuring evaluators */}
      {selectedEvaluatorData && (
        <Dialog
          open={showEvaluatorForm}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseEvaluatorForm();
            }
          }}
        >
          <DialogContent className="max-h-[90vh] max-w-(--breakpoint-md) overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedEvaluatorData.evaluator.id ? "编辑" : "配置"}
                评估器
              </DialogTitle>
            </DialogHeader>
            <EvaluatorForm
              useDialog={true}
              projectId={projectId}
              evalTemplates={evalTemplates}
              templateId={selectedEvaluatorData.templateId}
              existingEvaluator={selectedEvaluatorData.evaluator}
              mode={selectedEvaluatorData.evaluator.id ? "edit" : "create"}
              hideTargetSection={!selectedEvaluatorData.evaluator.id}
              onFormSuccess={handleEvaluatorSuccess}
              preprocessFormValues={preprocessFormValues}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
