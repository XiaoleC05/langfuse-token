import { type ReactNode } from "react";
import { ExternalLink } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { useHasOrganizationAccess } from "@/src/features/rbac/utils/checkOrganizationAccess";

export function openAIFeaturesSettings(organizationId: string) {
  window.open(
    `/organization/${organizationId}/settings`,
    "_blank",
    "noopener,noreferrer",
  );
}

export function AIFeaturesDisabledNotice({
  organizationId,
  children,
}: {
  organizationId: string | undefined;
  children: ReactNode;
}) {
  const canUpdateOrgSettings = useHasOrganizationAccess({
    organizationId,
    scope: "organization:update",
  });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        {children}
        {!canUpdateOrgSettings
          ? " 请联系您的组织管理员在组织设置中启用AI功能。"
          : null}
      </p>
      {canUpdateOrgSettings && organizationId ? (
        <Button
          onClick={() => openAIFeaturesSettings(organizationId)}
          variant="outline"
          size="sm"
          className="w-fit"
        >
          在组织设置中启用
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
