import React from "react";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { FileText, GitBranch, Zap, BarChart4 } from "lucide-react";
import { OXELIA_DOCS_URL } from "@/src/features/oxelia51/constants";

export function PromptsOnboarding({ projectId }: { projectId: string }) {
  const valuePropositions: ValueProposition[] = [
    {
      title: "与代码解耦",
      description:
        "无需重新部署应用程序即可部署新提示词，使更新更快更简单",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      title: "UI 或编程方式编辑",
      description:
        "非技术用户可轻松在 UI 中编辑提示词。开发者可选择通过 API 和 SDK 以编程方式更新提示词",
      icon: <GitBranch className="h-4 w-4" />,
    },
    {
      title: "性能优化",
      description:
        "客户端缓存可避免应用程序的延迟或可用性问题",
      icon: <Zap className="h-4 w-4" />,
    },
    {
      title: "对比指标",
      description:
        "跨不同提示词版本追踪延迟、成本和评估指标",
      icon: <BarChart4 className="h-4 w-4" />,
    },
  ];

  return (
    <SplashScreen
      title="开始使用提示词管理"
      description="Langfuse 提示词管理可帮助您集中管理、版本控制和协作迭代提示词。开始使用提示词管理来提升应用程序的性能和可维护性。"
      valuePropositions={valuePropositions}
      primaryAction={{
        label: "创建提示词",
        href: `/project/${projectId}/prompts/new`,
      }}
      secondaryAction={{
        label: "了解更多",
        href: OXELIA_DOCS_URL,
      }}
    />
  );
}
