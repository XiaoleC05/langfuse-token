import Header from "@/src/components/layouts/header";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { SettingsTableCard } from "@/src/components/layouts/settings-table-card";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { BatchActionsTable } from "./BatchActionsTable";

export function BatchActionsSettingsPage(props: { projectId: string }) {
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "datasets:CUD",
  });

  return (
    <>
      <Header title="批量操作" />
      <p className="mb-4 text-sm">
        跟踪在表格上执行的批量操作状态，例如将观测添加到数据集、删除追踪，以及将条目添加到标注队列。操作将在后台异步处理。
      </p>
      {hasAccess ? (
        <SettingsTableCard>
          <BatchActionsTable projectId={props.projectId} />
        </SettingsTableCard>
      ) : (
        <Alert>
          <AlertTitle>无访问权限</AlertTitle>
          <AlertDescription>
            您没有查看批量操作的权限。
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
