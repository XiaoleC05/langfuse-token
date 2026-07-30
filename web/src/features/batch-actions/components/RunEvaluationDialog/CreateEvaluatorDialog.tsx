import { useState } from "react";
import {
  EvalTargetObject,
  type EvalTargetObject as EvalTargetObjectType,
} from "@langfuse/shared";
import { api } from "@/src/utils/api";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { EvaluatorSelector } from "@/src/features/evals/components/evaluator-selector";
import { EvaluatorForm } from "@/src/features/evals/components/evaluator-form";
import { ChevronLeft } from "lucide-react";

type CreateEvaluatorDialogProps = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetObject?: EvalTargetObjectType;
};

export function CreateEvaluatorDialog(props: CreateEvaluatorDialogProps) {
  const {
    projectId,
    open,
    onOpenChange,
    targetObject = EvalTargetObject.EVENT,
  } = props;
  const [templateId, setTemplateId] = useState<string | null>(null);
  const utils = api.useUtils();

  const templatesQuery = api.evals.latestTemplates.useQuery(
    {
      projectId,
      limit: 500,
      page: 0,
    },
    {
      enabled: open,
    },
  );

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setTemplateId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-(--breakpoint-md) pb-0">
        <DialogHeader>
          <DialogTitle>
            为批量{" "}
            {targetObject === EvalTargetObject.EVENT
              ? "观测"
              : "实验"}{" "}
            运行创建评估器
          </DialogTitle>
          <DialogDescription>
            此表单为批量{" "}
            {targetObject === EvalTargetObject.EVENT
              ? "观测"
              : "实验"}{" "}
            运行创建评估器。
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="max-h-[72vh] overflow-y-auto pr-1 pb-0">
          {!templateId ? (
            <div className="space-y-4 px-1 pb-1">
              <p className="text-muted-foreground text-sm">
                选择一个评估器模板进行配置。
              </p>
              {templatesQuery.isLoading ? (
                <p className="text-muted-foreground text-sm">
                  正在加载模板...
                </p>
              ) : templatesQuery.isError ? (
                <p className="text-destructive text-sm">
                  加载模板失败：{templatesQuery.error.message}
                </p>
              ) : (
                <div className="max-h-[55vh] overflow-y-auto rounded-md border p-2">
                  <EvaluatorSelector
                    projectId={projectId}
                    evalTemplates={templatesQuery.data?.templates ?? []}
                    selectedTemplateId={undefined}
                    onTemplateSelect={(id) => setTemplateId(id)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="pb-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTemplateId(null)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                返回模板选择
              </Button>
              <EvaluatorForm
                useDialog
                projectId={projectId}
                evalTemplates={templatesQuery.data?.templates ?? []}
                templateId={templateId}
                hideTargetSelection
                hidePreviewTable
                defaultRunOnLive={false}
                defaultTarget={targetObject}
                onFormSuccess={() => {
                  handleClose(false);
                  utils.evals.jobConfigsByTarget.invalidate({
                    projectId,
                    targetObject,
                  });
                  showSuccessToast({
                    title: "评估器已创建",
                    description:
                      "在上一步中选择它以对所选项目运行。",
                  });
                }}
                preprocessFormValues={(values) => ({
                  ...values,
                  target: targetObject,
                  timeScope: ["NEW"],
                  ...(values.runOnLive
                    ? {}
                    : {
                        filter: [],
                        sampling: 1,
                        delay: 0,
                      }),
                })}
              />
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
