import Header from "@/src/components/layouts/header";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Card } from "@/src/components/ui/card";
import { BlobStorageExportMode } from "@langfuse/shared";
import { type RouterOutputs } from "@/src/utils/api";

type BlobStorageIntegrationConfig = NonNullable<
  RouterOutputs["blobStorageIntegration"]["get"]["config"]
>;

const EXPORT_MODE_LABELS: Record<BlobStorageExportMode, string> = {
  [BlobStorageExportMode.FULL_HISTORY]: "完整历史",
  [BlobStorageExportMode.FROM_TODAY]: "从设置日期起",
  [BlobStorageExportMode.FROM_CUSTOM_DATE]: "从自定义日期起",
};

export const BlobStorageStatusSection = ({
  config,
}: {
  config: BlobStorageIntegrationConfig;
}) => {
  return (
    <>
      <Header title="状态" />
      {config.lastError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>上次导出失败</AlertTitle>
          <AlertDescription>
            {config.lastError}
            {config.lastErrorAt && (
              <>
                <br />
                <span className="text-xs opacity-70">
                  {new Date(config.lastErrorAt).toLocaleString()}
                </span>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
      <Card className="p-3">
        <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">数据已导出至</span>
          <span>
            {config.lastSyncAt
              ? new Date(config.lastSyncAt).toLocaleString()
              : "从未（待处理）"}
          </span>
          {config.nextSyncAt && (
            <>
              <span className="text-muted-foreground">
                下次导出计划
              </span>
              <span>{new Date(config.nextSyncAt).toLocaleString()}</span>
            </>
          )}
          <span className="text-muted-foreground">导出模式</span>
          <span>{EXPORT_MODE_LABELS[config.exportMode] ?? "未知"}</span>
          {(config.exportMode === BlobStorageExportMode.FROM_CUSTOM_DATE ||
            config.exportMode === BlobStorageExportMode.FROM_TODAY) &&
            config.exportStartDate && (
              <>
                <span className="text-muted-foreground">导出开始日期</span>
                <span>
                  {new Date(config.exportStartDate).toLocaleDateString()}
                </span>
              </>
            )}
        </div>
      </Card>
    </>
  );
};
