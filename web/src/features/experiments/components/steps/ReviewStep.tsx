import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { type ReviewStepProps } from "@/src/features/experiments/types/stepProps";
import { StepHeader } from "@/src/features/experiments/components/shared/StepHeader";

export const ReviewStep: React.FC<ReviewStepProps> = ({
  formState,
  navigationState,
  summary,
}) => {
  const { form } = formState;
  const { setActiveStep } = navigationState;
  const {
    selectedPromptName,
    selectedPromptVersion,
    selectedDataset,
    modelParams,
    activeEvaluatorNames,
    structuredOutputEnabled,
    selectedSchemaName,
    validationResult,
  } = summary;
  const formValues = form.getValues();

  return (
    <div className="space-y-6">
      <StepHeader
        title="审核并运行"
        description="运行前请审核您的实验配置。您可以返回任何步骤进行修改。"
      />

      {/* Two-column grid layout */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {/* Prompt Card - Top Left */}
        <Card
          className="hover:bg-accent cursor-pointer transition-colors"
          onClick={() => setActiveStep("prompt")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base">提示词</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground">名称：</span>
              <span className="font-bold">{selectedPromptName}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">版本：</span>
              <span className="font-bold">v{selectedPromptVersion}</span>
            </div>
          </CardContent>
        </Card>

        {/* Model Card - Top Right */}
        <Card
          className="hover:bg-accent cursor-pointer transition-colors"
          onClick={() => setActiveStep("prompt")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base">模型</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground">提供商：</span>
              <span>{modelParams.provider.value}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">模型：</span>
              <span>{modelParams.model.value}</span>
            </div>
            {modelParams.temperature.enabled && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">温度：</span>
                <span>{modelParams.temperature.value}</span>
              </div>
            )}
            {modelParams.max_tokens.enabled && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">最大 Token 数：</span>
                <span>{modelParams.max_tokens.value}</span>
              </div>
            )}
            {structuredOutputEnabled && selectedSchemaName && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">
                  结构化输出：
                </span>
                <span>{selectedSchemaName}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dataset Card - Middle Left */}
        <Card
          className="hover:bg-accent cursor-pointer transition-colors"
          onClick={() => setActiveStep("dataset")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base">数据集</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground">名称：</span>
              <span className="font-bold">{selectedDataset?.name}</span>
            </div>
            {validationResult?.isValid && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">数据项：</span>
                <span>{validationResult.totalItems}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evaluators Card - Middle Right (only if there are evaluators) */}
        {activeEvaluatorNames.length > 0 && (
          <Card
            className="hover:bg-accent cursor-pointer transition-colors"
            onClick={() => setActiveStep("evaluators")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                评估器 ({activeEvaluatorNames.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {activeEvaluatorNames.map((name) => (
                  <Badge key={name} variant="secondary" className="text-xs">
                    {name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Run Details Card - Bottom (Full Width) */}
        <Card
          className="hover:bg-accent cursor-pointer transition-colors md:col-span-2"
          onClick={() => setActiveStep("details")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base">实验运行详情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground">实验名称：</span>
              <span className="font-bold">{formValues.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">运行名称：</span>
              <span className="font-bold">{formValues.runName}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="text-muted-foreground h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  此运行名称根据实验名称自动生成，可通过公共 API 获取对应的实验结果。
                </TooltipContent>
              </Tooltip>
            </div>
            {formValues.description && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">描述：</span>
                <span className="text-sm">{formValues.description}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
