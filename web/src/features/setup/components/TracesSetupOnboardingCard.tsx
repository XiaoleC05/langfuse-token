import { ActionButton } from "@/src/components/ActionButton";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { SplashScreen } from "@/src/components/ui/splash-screen";
import { copyTextToClipboard } from "@/src/utils/clipboard";
import { ApiKeyDetailContent } from "@/src/features/public-api/components/ApiKeyDetailContent";
import { useLangfuseBaseUrl } from "@/src/features/public-api/hooks/useLangfuseEnvCode";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { api } from "@/src/utils/api";
import { type RouterOutput } from "@/src/utils/types";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { Check, Copy, LockIcon, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { OXELIA_DOCS_URL } from "@/src/features/oxelia51/constants";

const SKILLS_INSTALL_COMMAND =
  "从 github.com/langfuse/skills 安装 Langfuse 技能，并使用它按照最佳实践为此应用添加 Langfuse 追踪。";
const MANUAL_TRACING_DOCS_URL =
  OXELIA_DOCS_URL;

function CopyableSnippet({
  value,
  onCopy,
}: {
  value: string;
  onCopy?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyTextToClipboard(value);
      onCopy?.();
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      toast.error("复制到剪贴板失败");
    }
  };

  return (
    <div className="bg-muted/50 flex items-center gap-4 rounded-2xl border p-5 shadow-xs">
      <code className="min-w-0 flex-1 font-mono text-xs leading-6 break-words whitespace-pre-wrap sm:text-sm">
        {value}
      </code>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-2"
        onClick={() => handleCopy()}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "已复制" : "复制提示词"}
      </Button>
    </div>
  );
}

export function TracesSetupOnboardingCard({
  projectId,
}: {
  projectId: string;
}) {
  const capture = usePostHogClientCapture();
  const baseUrl = useLangfuseBaseUrl();
  const hasApiKeyCreateAccess = useHasProjectAccess({
    projectId,
    scope: "apiKeys:CUD",
  });
  const [apiKeys, setApiKeys] = useState<
    RouterOutput["projectApiKeys"]["create"] | null
  >(null);
  const utils = api.useUtils();
  const mutCreateApiKey = api.projectApiKeys.create.useMutation({
    onSuccess: (data) => {
      utils.projectApiKeys.invalidate();
      setApiKeys(data);
    },
  });

  const createApiKey = async () => {
    capture("onboarding:tracing_api_key_create_clicked");

    try {
      await mutCreateApiKey.mutateAsync({ projectId });
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error("创建 API 密钥失败");
    }
  };

  return (
    <SplashScreen
      waitingFor="等待第一条追踪"
      title="是时候记录第一条追踪了，只需一分钟"
      description="先获取 API 密钥，然后让编程代理为你的应用添加 Langfuse 可观测性。"
      videoPosition="bottom"
      steps={[
        {
          title: "创建 API 密钥",
          description:
            "你的应用需要 API 密钥才能向 Langfuse 发送追踪。",
          content: apiKeys ? (
            <ApiKeyDetailContent
              scope="project"
              secretKey={apiKeys.secretKey}
              publicKey={apiKeys.publicKey}
              baseUrl={baseUrl}
              className="mt-1"
              showMcpSection={false}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {hasApiKeyCreateAccess ? (
                <Button
                  onClick={createApiKey}
                  loading={mutCreateApiKey.isPending}
                  className="self-start"
                >
                  创建新的 API 密钥
                </Button>
              ) : (
                <Button disabled className="self-start">
                  <LockIcon
                    className="mr-2 -ml-0.5 h-4 w-4"
                    aria-hidden="true"
                  />
                  创建新的 API 密钥
                </Button>
              )}
              <ActionButton
                href={`/project/${projectId}/settings/api-keys`}
                variant="secondary"
              >
                管理 API 密钥
              </ActionButton>
            </div>
          ),
        },
        {
          title: "使用编程代理添加追踪",
          badge: (
            <Badge variant="tertiary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              推荐
            </Badge>
          ),
          description:
            "将此提示词粘贴到 Claude、Cursor、Copilot 或其他编程代理中。",
          content: (
            <>
              <CopyableSnippet
                value={SKILLS_INSTALL_COMMAND}
                onCopy={() =>
                  capture("onboarding:tracing_agent_prompt_copy_clicked", {
                    projectId,
                  })
                }
              />
              <div className="mt-3">
                <Link
                  href={MANUAL_TRACING_DOCS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex text-sm underline underline-offset-4 hover:no-underline"
                  onClick={() =>
                    capture("onboarding:tracing_manual_docs_link_clicked", {
                      href: MANUAL_TRACING_DOCS_URL,
                      projectId,
                    })
                  }
                >
                  或按照文档手动设置追踪
                </Link>
              </div>
            </>
          ),
        },
        {
          title: "运行你的应用 — 追踪将在此显示",
          description:
            "一旦你的应用进行模型调用，追踪将在几秒内显示。",
        },
      ]}
    />
  );
}
