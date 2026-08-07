import React from "react";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { ThumbsUp, Star, LineChart, Code } from "lucide-react";
import { OXELIA_DOCS_URL } from "@/src/features/oxelia51/constants";

export function ScoresOnboarding() {
  const valuePropositions: ValueProposition[] = [
    {
      title: "收集用户反馈",
      description:
        "收集用户的点赞/点踩反馈，识别高质量和低质量的输出",
      icon: <ThumbsUp className="h-4 w-4" />,
    },
    {
      title: "运行基于模型的评估",
      description:
        "自动评估应用程序的输出",
      icon: <Star className="h-4 w-4" />,
    },
    {
      title: "追踪质量指标",
      description:
        "随时间监控质量指标，发现趋势和问题",
      icon: <LineChart className="h-4 w-4" />,
    },
    {
      title: "使用自定义指标",
      description:
        "Langfuse 的评分非常灵活，可用于追踪与应用程序相关的任何指标",
      icon: <Code className="h-4 w-4" />,
    },
  ];

  return (
    <SplashScreen
      title="开始使用评分"
      description="通过用户反馈、基于模型的评估或人工审核，评分可帮助您评估应用程序的质量/安全性。评分可以通过 API 和 SDK 以编程方式使用来追踪自定义指标。"
      valuePropositions={valuePropositions}
      secondaryAction={{
        label: "了解更多",
        href: OXELIA_DOCS_URL,
      }}
    />
  );
}
