import Header from "@/src/components/layouts/header";
import ContainerPage from "@/src/components/layouts/container-page";
import { StatusBadge } from "@/src/components/layouts/status-badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/router";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { api, type RouterOutputs } from "@/src/utils/api";
import { deriveSyncStatus } from "@/src/features/blobstorage-integration/deriveSyncStatus";
import { type BlobStorageSyncStatus } from "@/src/features/blobstorage-integration/types";
import { BlobStorageIntegrationContainer } from "@/src/features/blobstorage-integration/components/BlobStorageIntegrationContainer";
import { BlobStorageStatusSection } from "@/src/features/blobstorage-integration/components/BlobStorageStatusSection";
import { OXELIA_DOCS_URL } from "@/src/features/oxelia51/constants";

const syncStatusToBadge: Record<BlobStorageSyncStatus, string> = {
  up_to_date: "active",
  running: "running",
  queued: "queued",
  idle: "pending",
  disabled: "disabled",
  error: "error",
};

const syncStatusFromConfig = (
  config: NonNullable<RouterOutputs["blobStorageIntegration"]["get"]["config"]>,
): BlobStorageSyncStatus =>
  deriveSyncStatus({
    enabled: config.enabled,
    lastError: config.lastError,
    lastSyncAt: config.lastSyncAt ? new Date(config.lastSyncAt) : null,
    nextSyncAt: config.nextSyncAt ? new Date(config.nextSyncAt) : null,
    runStartedAt: config.runStartedAt ? new Date(config.runStartedAt) : null,
  });

export default function BlobStorageIntegrationSettings() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "integrations:CRUD",
  });
  const state = api.blobStorageIntegration.get.useQuery(
    { projectId },
    {
      enabled: hasAccess,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 50 * 60 * 1000, // 50 minutes
      refetchInterval: (query) => {
        const cfg = query.state.data?.config;
        if (!cfg) return false;
        const status = syncStatusFromConfig(cfg);
        return status === "running" || status === "queued" ? 5_000 : false;
      },
    },
  );

  const syncStatus =
    state.isLoading || !hasAccess || !state.data?.config
      ? undefined
      : syncStatusFromConfig(state.data.config);

  return (
    <ContainerPage
      headerProps={{
        title: "Blob Storage 集成",
        breadcrumb: [
          { name: "设置", href: `/project/${projectId}/settings` },
        ],
        actionButtonsLeft: (
          <>
            {syncStatus && <StatusBadge type={syncStatusToBadge[syncStatus]} />}
          </>
        ),
        actionButtonsRight: (
          <Button asChild variant="secondary">
            <Link
              href={OXELIA_DOCS_URL}
              target="_blank"
            >
              集成文档 ↗
            </Link>
          </Button>
        ),
      }}
    >
      <p className="text-primary mb-4 text-sm">
        将您的追踪数据按计划导出到 AWS S3、兼容 S3 的存储或 Azure Blob
        Storage。可设置每小时、每天或每周导出到您自己的存储，用于数据分析或备份。使用
        &quot;验证&quot;按钮上传一个小测试文件来测试您的配置，使用
        &quot;立即运行&quot;按钮触发立即导出。
      </p>
      {!hasAccess && (
        <p className="text-sm">
          您当前的角色无权访问这些设置，请联系您的项目管理员或所有者。
        </p>
      )}
      {state.data?.config && (
        <BlobStorageStatusSection config={state.data.config} />
      )}
      {hasAccess && (
        <>
          <Header title="配置" className="mt-8" />
          <Card className="p-3">
            <BlobStorageIntegrationContainer
              config={state.data?.config ?? null}
              projectId={projectId}
              isLoading={state.isLoading}
              isEnrichedExportAvailable={
                state.data?.isEnrichedExportAvailable ?? false
              }
              legacyWritesActive={state.data?.legacyWritesActive ?? true}
            />
          </Card>
        </>
      )}
    </ContainerPage>
  );
}
