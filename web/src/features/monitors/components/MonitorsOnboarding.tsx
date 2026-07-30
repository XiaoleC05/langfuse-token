import Link from "next/link";
import { ChevronRight, Github, Plus, Slack, Webhook } from "lucide-react";

import { ActionButton } from "@/src/components/ActionButton";
import { Button } from "@/src/components/ui/button";
import { SplashScreen } from "@/src/components/ui/splash-screen";
import { automationCreateHref } from "@/src/features/automations/components/automationForm";
import { type ActionTypes } from "@langfuse/shared";

/** OnboardingChannel describes one notification-channel CTA shown in step 1 of the splash. */
type OnboardingChannel = {
  actionType: ActionTypes;
  label: string;
  icon: React.ReactNode;
};

/** channels enumerates the three notification channels presented to a first-time user. */
const channels: OnboardingChannel[] = [
  {
    actionType: "SLACK",
    label: "连接 Slack",
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- brand icon retained for parity with MonitorAutomationsPanel.
    icon: <Slack className="h-4 w-4" aria-hidden="true" />,
  },
  {
    actionType: "WEBHOOK",
    label: "连接 Webhooks",
    icon: <Webhook className="h-4 w-4" aria-hidden="true" />,
  },
  {
    actionType: "GITHUB_DISPATCH",
    label: "连接 Github Actions",
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- see Slack note above.
    icon: <Github className="h-4 w-4" aria-hidden="true" />,
  },
];

/** MonitorsOnboarding renders the splash shown on /monitors when the project has no monitors yet. */
export function MonitorsOnboarding({
  projectId,
  hasCUDAccess,
}: {
  projectId: string;
  hasCUDAccess: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-xl pt-12">
      <SplashScreen
        title="在问题影响用户之前及时发现"
        description="当成本、质量、延迟或其他关键指标超出预期范围时及时获得通知。"
        steps={[
          {
            title: "选择告警通知渠道",
            description:
              "将告警发送至 Slack、Webhooks 或 GitHub Actions，让您的团队和工作流能够自动响应。",
            content: (
              <div className="flex flex-col gap-2">
                {channels.map((channel) => (
                  <Button
                    key={channel.actionType}
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full justify-between gap-2 px-6 py-5"
                  >
                    <Link
                      href={automationCreateHref(
                        projectId,
                        channel.actionType,
                        `/project/${projectId}/monitors`,
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {channel.icon}
                        {channel.label}
                      </span>
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                ))}
              </div>
            ),
          },
          {
            title: "决定监控内容",
            description:
              "为成本突增、质量下降、延迟变化或其他重要变化创建监控。",
            content: (
              <ActionButton
                hasAccess={hasCUDAccess}
                icon={<Plus className="h-4 w-4" aria-hidden="true" />}
                href={`/project/${projectId}/monitors/new`}
                variant="default"
                size="lg"
              >
                创建监控
              </ActionButton>
            ),
          },
        ]}
      />
    </div>
  );
}
