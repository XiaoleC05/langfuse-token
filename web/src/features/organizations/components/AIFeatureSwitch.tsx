import { Button } from "@/src/components/ui/button";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { api } from "@/src/utils/api";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import Header from "@/src/components/layouts/header";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useHasOrganizationAccess } from "@/src/features/rbac/utils/checkOrganizationAccess";
import {
  useLangfuseCloudRegion,
  useQueryOrganization,
} from "@/src/features/organizations/hooks";
import { Card } from "@/src/components/ui/card";
import { LockIcon, ExternalLink } from "lucide-react";
import { useSession } from "next-auth/react";

export default function AIFeatureSwitch() {
  const { update: updateSession } = useSession();
  const utils = api.useUtils();
  const { isLangfuseCloud } = useLangfuseCloudRegion();
  const capture = usePostHogClientCapture();
  const organization = useQueryOrganization();
  const aiFeaturesEnabled = organization?.aiFeaturesEnabled;
  const aiTelemetryEnabled = organization?.aiTelemetryEnabled;
  const [isAIFeatureSwitchEnabled, setIsAIFeatureSwitchEnabled] = useState(
    aiFeaturesEnabled ?? false,
  );
  const [isAITelemetrySwitchEnabled, setIsAITelemetrySwitchEnabled] = useState(
    aiTelemetryEnabled ?? true,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const hasAccess = useHasOrganizationAccess({
    organizationId: organization?.id,
    scope: "organization:update",
  });

  const updateAIFeatures = api.organizations.update.useMutation({
    onSuccess: async () => {
      await updateSession();
      // Admins resolve org context from this query, not the session
      utils.organizations.byId.invalidate();
      setConfirmOpen(false);
    },
    onError: () => {
      setConfirmOpen(false);
    },
  });

  const updateAITelemetry = api.organizations.update.useMutation({
    onSuccess: async () => {
      await updateSession();
      // Admins resolve org context from this query, not the session
      utils.organizations.byId.invalidate();
    },
    onError: () => {
      setIsAITelemetrySwitchEnabled(aiTelemetryEnabled ?? true);
    },
  });

  useEffect(() => {
    if (aiFeaturesEnabled === undefined || aiTelemetryEnabled === undefined) {
      return;
    }

    if (!confirmOpen && !updateAIFeatures.isPending) {
      setIsAIFeatureSwitchEnabled(aiFeaturesEnabled);
    }

    if (!updateAITelemetry.isPending) {
      setIsAITelemetrySwitchEnabled(aiTelemetryEnabled);
    }
  }, [
    aiFeaturesEnabled,
    aiTelemetryEnabled,
    confirmOpen,
    updateAIFeatures.isPending,
    updateAITelemetry.isPending,
  ]);

  function handleSwitchChange(newValue: boolean) {
    if (!hasAccess) return;
    setIsAIFeatureSwitchEnabled(newValue);
    setConfirmOpen(true);
  }

  function handleTelemetrySwitchChange(newValue: boolean) {
    if (!organization || !hasAccess) return;
    setIsAITelemetrySwitchEnabled(newValue);
    capture("organization_settings:ai_telemetry_toggle");
    updateAITelemetry.mutate({
      orgId: organization.id,
      aiTelemetryEnabled: newValue,
    });
  }

  function handleCancel() {
    setIsAIFeatureSwitchEnabled(organization?.aiFeaturesEnabled ?? false);
    setConfirmOpen(false);
  }

  function handleConfirm() {
    if (!organization || !hasAccess) return;
    capture("organization_settings:ai_features_toggle");
    updateAIFeatures.mutate({
      orgId: organization.id,
      aiFeaturesEnabled: isAIFeatureSwitchEnabled,
    });
  }

  if (!isLangfuseCloud) return null;

  return (
    <div>
      <Header title="智能功能" />
      <Card className="mb-4 p-3">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-1">
            <h4 className="font-bold">
              为您的组织启用智能功能
            </h4>
            <p className="text-sm">
              此设置适用于所有用户和项目。在 Langfuse 数据区域内，任何数据{" "}
              <i>可能</i>会被发送到 AWS Bedrock。追踪会被发送到您所在数据区域内的
              Langfuse Cloud。您的数据不会被用于训练模型。相关的 HIPAA、SOC2、
              GDPR 和 ISO 27001 合规要求不受影响。{" "}
              <a
                href="https://langfuse.com/security/ai-features"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 hover:underline"
              >
                更多详情请参阅文档。
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
          <div className="relative">
            <Switch
              checked={isAIFeatureSwitchEnabled}
              onCheckedChange={handleSwitchChange}
              disabled={!hasAccess}
            />
            {!hasAccess && (
              <span title="无访问权限">
                <LockIcon className="text-muted absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform" />
              </span>
            )}
          </div>
        </div>
        {isAIFeatureSwitchEnabled && (
          <div className="mt-4 flex flex-row items-center justify-between border-t pt-4">
            <div className="flex flex-col gap-1">
              <h4 className="font-bold">
                产品/服务改进数据使用授权
              </h4>
              <p className="text-sm">
                与 Langfuse 共享您的功能使用数据，用于产品和服务改进。
              </p>
            </div>
            <div className="relative">
              <Switch
                checked={isAITelemetrySwitchEnabled}
                onCheckedChange={handleTelemetrySwitchChange}
                disabled={!hasAccess || updateAITelemetry.isPending}
              />
              {!hasAccess && (
                <span title="无访问权限">
                  <LockIcon className="text-muted absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform" />
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      <Dialog
        open={confirmOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen && !updateAIFeatures.isPending) {
            handleCancel();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认更改智能功能</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <span className="text-sm">
              您即将{" "}
              <strong>
                {isAIFeatureSwitchEnabled ? "启用" : "禁用"}
              </strong>{" "}
              组织的智能功能。启用后，任何数据{"  "}
              <i>可能</i>会被发送到您数据区域内的 AWS Bedrock 进行处理。
              <br />
              <br />{" "}
              <a
                href="https://langfuse.com/security/ai-features"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 hover:underline"
              >
                在文档中了解更多。
                <ExternalLink className="h-3 w-3" />
              </a>
            </span>
            <p className="text-muted-foreground mt-3 text-sm">
              您确定要继续吗？
            </p>
          </DialogBody>
          <DialogFooter>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                disabled={updateAIFeatures.isPending}
                onClick={handleCancel}
              >
                取消
              </Button>
              <Button
                type="submit"
                onClick={handleConfirm}
                loading={updateAIFeatures.isPending}
              >
                确认
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
