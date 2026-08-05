import React from "react";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { Bot, Gauge, Zap, BarChart4 } from "lucide-react";
import { useIsCodeEvalEnabled } from "@/src/features/evals/hooks/useIsCodeEvalEnabled";
import { EvalTemplateSourceCodeLanguage } from "@langfuse/shared";

interface EvaluatorsOnboardingProps {
  projectId: string;
}

export function EvaluatorsOnboarding({ projectId }: EvaluatorsOnboardingProps) {
  const { enabled, supportedSourceCodeLanguages } = useIsCodeEvalEnabled();
  const codeEvaluatorLanguageDescription =
    supportedSourceCodeLanguages.includes(EvalTemplateSourceCodeLanguage.PYTHON)
      ? "TypeScript or Python"
      : "TypeScript";

  const llmAsJudgeValuePropositions: ValueProposition[] = [
    {
      title: "自动化评估",
      description:
        "使用自动评估，无需人工审核",
      icon: <Bot className="h-4 w-4" />,
    },
    {
      title: "衡量质量",
      description:
        "创建自定义评估标准来衡量输出质量",
      icon: <Gauge className="h-4 w-4" />,
    },
    {
      title: "高效扩展",
      description:
        "通过可自定义的采样率自动评估数千条追踪",
      icon: <Zap className="h-4 w-4" />,
    },
    {
      title: "追踪性能",
      description:
        "随时间监控评估指标，发现趋势和改进点",
      icon: <BarChart4 className="h-4 w-4" />,
    },
  ];

  if (enabled) {
    return (
      <SplashScreen
        title="开始使用评估"
        description={
          <>
            使用评估器自动对追踪和观测进行评分。
            Langfuse 支持两种评估器类型：
            <ul className="text-muted-foreground mx-auto mt-2 max-w-2xl list-disc space-y-2 pl-5 text-left text-sm">
              <li>
                <span className="text-foreground font-bold">
                  自动评估器
                </span>{" "}
                根据自然语言标准自动对输出进行评分。
              </li>
              <li>
                <span className="text-foreground font-bold">
                  代码评估器
                </span>{" "}
                使用 {codeEvaluatorLanguageDescription} 逻辑进行确定性自定义评分。
              </li>
            </ul>
          </>
        }
        primaryAction={{
          label: "创建评估器",
          href: `/project/${projectId}/evals/new`,
        }}
        secondaryAction={{
          label: "了解更多",
          href: "https://langfuse.com/docs/evaluation",
        }}
      />
    );
  }

  return (
    <SplashScreen
      title="开始使用自动评估"
      description="创建评估模板和评估器，通过自动评估对追踪进行评分。设置自定义评估标准，自动帮助您衡量输出质量。"
      valuePropositions={llmAsJudgeValuePropositions}
      primaryAction={{
        label: "创建评估器",
        href: `/project/${projectId}/evals/new`,
      }}
      secondaryAction={{
        label: "了解更多",
        href: "https://langfuse.com/docs/evaluation/evaluation-methods/llm-as-a-judge",
      }}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/scores-llm-as-a-judge-overview-v1.mp4"
    />
  );
}
