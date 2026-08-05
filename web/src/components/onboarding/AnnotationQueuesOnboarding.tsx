import React from "react";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { ClipboardCheck, Users, BarChart4, GitMerge } from "lucide-react";
import { CreateOrEditAnnotationQueueButton } from "@/src/features/annotation-queues/components/CreateOrEditAnnotationQueueButton";

export function AnnotationQueuesOnboarding({
  projectId,
}: {
  projectId: string;
}) {
  const valuePropositions: ValueProposition[] = [
    {
      title: "管理评分工作流",
      description:
        "创建和管理标注队列，简化评分工作流程",
      icon: <ClipboardCheck className="h-4 w-4" />,
    },
    {
      title: "与标注者协作",
      description:
        "邀请团队成员来标注和评估您的模型输出",
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "追踪标注指标",
      description:
        "监控团队的标注进度和质量指标",
      icon: <BarChart4 className="h-4 w-4" />,
    },
    {
      title: "基准评估工作",
      description:
        "使用标注数据作为评估其他评估指标的基准",
      icon: <GitMerge className="h-4 w-4" />,
    },
  ];

  return (
    <SplashScreen
      title="开始使用标注队列"
      description="标注队列帮助您管理项目的手动标注/标记。创建队列、定义标注指标并追踪进度。"
      valuePropositions={valuePropositions}
      primaryAction={{
        label: "创建标注队列",
        component: (
          <CreateOrEditAnnotationQueueButton
            variant="default"
            projectId={projectId}
            size="lg"
          />
        ),
      }}
      secondaryAction={{
        label: "了解更多",
        href: "https://langfuse.com/docs/scores/annotation",
      }}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/annotation-queue-overview-v1.mp4"
    />
  );
}
