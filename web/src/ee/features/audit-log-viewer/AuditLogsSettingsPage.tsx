import Header from "@/src/components/layouts/header";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { AuditLogsTable } from "@/src/ee/features/audit-log-viewer/AuditLogsTable";
import { useHasEntitlement } from "@/src/features/entitlements/hooks";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";

export function AuditLogsSettingsPage(props: { projectId: string }) {
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "auditLogs:read",
  });
  const hasEntitlement = useHasEntitlement("audit-logs");

  const body = !hasEntitlement ? (
    <p className="text-muted-foreground text-sm">
      审计日志是企业版功能。升级套餐即可追踪项目中的所有变更。
    </p>
  ) : !hasAccess ? (
    <Alert>
      <AlertTitle>访问被拒绝</AlertTitle>
      <AlertDescription>
        请联系项目管理员申请访问权限。
      </AlertDescription>
    </Alert>
  ) : (
    <AuditLogsTable scope="project" projectId={props.projectId} />
  );

  return (
    <>
      <Header title="审计日志" />
      <p className="text-muted-foreground mb-2 text-sm">
        追踪项目中谁在何时更改了什么。监控设置、配置和数据随时间的变更。如需更详细/可筛选的审计日志，请联系
        Langfuse 团队。
      </p>
      {body}
    </>
  );
}
