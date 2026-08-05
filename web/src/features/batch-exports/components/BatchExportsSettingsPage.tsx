import Header from "@/src/components/layouts/header";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { BatchExportsTable } from "@/src/features/batch-exports/components/BatchExportsTable";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { SettingsTableCard } from "@/src/components/layouts/settings-table-card";

export function BatchExportsSettingsPage(props: { projectId: string }) {
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "batchExports:read",
  });

  return (
    <>
      <Header title="导出" />
      <p className="mb-4 text-sm">
        通过 Langfuse 各处的导出按钮，以您偏好的格式导出大型数据集。导出会
        异步处理，并在完成后一小时内可供下载。导出就绪后，您将收到邮件通知。
      </p>
      {hasAccess ? (
        <SettingsTableCard>
          <BatchExportsTable projectId={props.projectId} />
        </SettingsTableCard>
      ) : (
        <Alert>
          <AlertTitle>访问被拒绝</AlertTitle>
          <AlertDescription>
            您没有权限查看批量导出。
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
