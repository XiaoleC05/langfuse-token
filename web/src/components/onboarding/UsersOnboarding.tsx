import React from "react";
import { SplashScreen } from "@/src/components/ui/splash-screen";
import { ActionButton } from "@/src/components/ActionButton";

export function UsersOnboarding() {
  return (
    <SplashScreen
      title="您尚未追踪用户"
      description="在追踪中添加用户 ID 后，您可以关联成本、评估和其他 LLM 应用指标，更好地了解用户如何与您的 LLM 应用进行交互。"
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/users-overview-v1.mp4"
    >
      <div className="mt-8">
        <h3 className="mb-4 text-2xl font-bold">开始追踪用户</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          要开始追踪用户，您需要向追踪添加一个 <code>userId</code>。
        </p>
        <ActionButton
          href="https://langfuse.com/docs/observability/features/users"
          variant="default"
        >
          阅读文档
        </ActionButton>
      </div>
    </SplashScreen>
  );
}
