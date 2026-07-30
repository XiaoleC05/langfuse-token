import Link from "next/link";

import { Label } from "@/src/components/ui/label";
import { api } from "@/src/utils/api";
import { type UIModelParams } from "@langfuse/shared";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";

export const LLMApiKeyComponent = (p: {
  projectId: string;
  modelParams: UIModelParams;
}) => {
  const hasAccess = useHasProjectAccess({
    projectId: p.projectId,
    scope: "llmApiKeys:read",
  });

  if (!hasAccess) {
    return (
      <div>
        <Label className="text-xs font-bold">API 密钥</Label>
        <p className="text-muted-foreground text-sm">
          LLM API 密钥仅对所有者(Owner)和管理员(Admin)角色可见。
        </p>
      </div>
    );
  }

  const apiKeys = api.llmApiKey.all.useQuery({
    projectId: p.projectId,
  });

  if (apiKeys.isPending) {
    return (
      <div>
        <Label className="text-xs font-bold">API 密钥</Label>
        <p className="text-muted-foreground text-sm">加载中…</p>
      </div>
    );
  }

  const modelProvider = p.modelParams.provider.value;
  const apiKey = apiKeys.data?.data.find((k) => k.provider === modelProvider);

  return (
    <div className="space-y-2 text-xs">
      <Label className="text-xs font-bold">API 密钥</Label>
      <div>
        {apiKey ? (
          <Link href={`/project/${p.projectId}/settings/llm-connections`}>
            <span className="bg-input mr-2 rounded-sm p-1 text-xs">
              {apiKey.displaySecretKey}
            </span>
          </Link>
        ) : undefined}
      </div>
    </div>
  );
};
