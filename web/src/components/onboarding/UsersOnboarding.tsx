import React from "react";
import { SplashScreen } from "@/src/components/ui/splash-screen";
import { ActionButton } from "@/src/components/ActionButton";
import { OXELIA_DOCS_URL } from "@/src/features/oxelia51/constants";

export function UsersOnboarding() {
  return (
    <SplashScreen
      title="您尚未追踪用户"
      description="在追踪中添加用户 ID 后，您可以关联成本、评估和其他应用指标，更好地了解用户如何与您的应用进行交互。"
    >
      <div className="mt-8">
        <h3 className="mb-4 text-2xl font-bold">开始追踪用户</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          要开始追踪用户，您需要向追踪添加一个 <code>userId</code>。
        </p>
        <ActionButton
          href={OXELIA_DOCS_URL}
          variant="default"
        >
          阅读文档
        </ActionButton>
      </div>
    </SplashScreen>
  );
}
