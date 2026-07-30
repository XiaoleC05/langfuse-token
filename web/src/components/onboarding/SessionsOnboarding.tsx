import React from "react";
import { SplashScreen } from "@/src/components/ui/splash-screen";
import { ActionButton } from "@/src/components/ActionButton";

export function SessionsOnboarding() {
  return (
    <SplashScreen
      title="您尚未使用会话"
      description="会话可将属于同一工作流或对话的追踪分组在一起。"
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/sessions-overview-v1.mp4"
    >
      <div className="mt-8">
        <h3 className="mb-4 text-2xl font-bold">开始使用会话</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          要开始使用会话，您需要向追踪添加一个 <code>sessionId</code>。
        </p>
        <ActionButton
          href="https://langfuse.com/docs/observability/features/sessions"
          variant="default"
        >
          阅读文档
        </ActionButton>
      </div>
    </SplashScreen>
  );
}
