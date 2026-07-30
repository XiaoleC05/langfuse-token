import React from "react";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { Database, Beaker, Zap, Code } from "lucide-react";
import { DatasetActionButton } from "@/src/features/datasets/components/DatasetActionButton";

export function DatasetsOnboarding({ projectId }: { projectId: string }) {
  const valuePropositions: ValueProposition[] = [
    {
      title: "持续改进",
      description:
        "从生产环境的边界情况创建数据集，改进您的应用程序",
      icon: <Zap className="h-4 w-4" />,
    },
    {
      title: "部署前测试",
      description: "在部署到生产环境前对新版本进行基准测试",
      icon: <Beaker className="h-4 w-4" />,
    },
    {
      title: "结构化测试",
      description:
        "在输入和预期输出的集合上运行实验",
      icon: <Database className="h-4 w-4" />,
    },
    {
      title: "自定义工作流",
      description:
        "通过 API 和 SDK 围绕数据集构建自定义工作流，例如微调、小样本提示",
      icon: <Code className="h-4 w-4" />,
    },
  ];

  return (
    <SplashScreen
      title="开始使用数据集与实验"
      description="Langfuse 中的数据集是 LLM 应用程序的输入（和预期输出）集合。您可以针对这些数据集运行实验，在部署到生产环境前测试新版本。"
      valuePropositions={valuePropositions}
      primaryAction={{
        label: "创建数据集",
        component: (
          <DatasetActionButton
            variant="default"
            mode="create"
            projectId={projectId}
            size="lg"
          />
        ),
      }}
      secondaryAction={{
        label: "了解更多",
        href: "https://langfuse.com/docs/datasets",
      }}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/datasets-overview-v1.mp4"
    />
  );
}
