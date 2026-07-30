import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { ExternalLinkIcon } from "lucide-react";
import { api } from "@/src/utils/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { type DashboardPlacement } from "@/src/features/widgets/components/DashboardGrid";

/**
 * Clone-first flow for Langfuse-managed (read-only) dashboards: any edit
 * attempt routes here instead of being blocked. Confirming clones the
 * dashboard into the project (optionally carrying the attempted change via
 * `pendingDefinition` and setting the clone as the project's Home) and
 * navigates to the editable copy.
 */
export function CloneFirstDialog({
  open,
  onOpenChange,
  projectId,
  dashboardId,
  dashboardName,
  setAsHome = false,
  pendingDefinition,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  dashboardId: string;
  dashboardName: string;
  /** Set the clone as this project's Home dashboard in the same gesture. */
  setAsHome?: boolean;
  /** The attempted edit (e.g. moved/removed tile) to apply to the clone. */
  pendingDefinition?: { widgets: DashboardPlacement[] } | null;
  /** Called when the user dismisses without cloning (revert the attempt). */
  onCancel?: () => void;
}) {
  const router = useRouter();
  const utils = api.useUtils();
  const capture = usePostHogClientCapture();

  // Detect existing copies of this dashboard so we can offer navigating to
  // one instead of accumulating "(Clone)" duplicates.
  const dashboards = api.dashboard.allDashboards.useQuery(
    {
      projectId,
      page: 1,
      limit: 500,
      orderBy: { column: "updatedAt", order: "DESC" },
    },
    { enabled: open },
  );
  const existingClone = useMemo(() => {
    const clonePattern = new RegExp(
      `^${dashboardName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\(Clone( \\d+)?\\)$`,
    );
    return dashboards.data?.dashboards.find(
      (d) => d.owner === "PROJECT" && clonePattern.test(d.name),
    );
  }, [dashboards.data?.dashboards, dashboardName]);

  const cloneDashboard = api.dashboard.cloneDashboard.useMutation({
    onSuccess: (data) => {
      utils.dashboard.invalidate();
      capture("dashboard:clone_dashboard", {
        source: "clone_first_dialog",
        set_as_home: setAsHome,
        had_pending_change: Boolean(pendingDefinition),
      });
      showSuccessToast({
        title: "可编辑副本已创建",
        description: setAsHome
          ? "该副本现在是此项目的首页仪表盘"
          : "您现在正在编辑自己的副本",
        duration: 3000,
      });
      onOpenChange(false);
      if (data?.id) {
        router.push(
          `/project/${projectId}/dashboards/${encodeURIComponent(data.id)}`,
        );
      }
    },
    onError: (e) => {
      showErrorToast("创建副本失败", e.message);
    },
  });

  const handleConfirm = () => {
    cloneDashboard.mutate({
      projectId,
      dashboardId,
      definition: pendingDefinition ?? undefined,
      setAsHome,
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    // Keep the dialog open while the clone is in flight (it navigates on
    // success); closing mid-flight would revert the grid and then surprise-
    // navigate.
    if (!nextOpen && cloneDashboard.isPending) return;
    if (!nextOpen) {
      capture("dashboard:clone_first_cancelled", {
        dashboard_id: dashboardId,
        had_pending_change: Boolean(pendingDefinition),
      });
      onCancel?.();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>创建您的可编辑副本</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="text-muted-foreground grid gap-3 py-4 text-sm">
            <p>
              <span className="text-foreground font-bold">
                &ldquo;{dashboardName}&rdquo;
              </span>{" "}
              由 Langfuse 维护，无法直接编辑。
              我们将在此项目中创建您自己的可编辑副本
              {pendingDefinition ? " 并应用您的更改" : ""}
              {setAsHome ? "，并从此显示在您的首页上" : ""}。
            </p>
            <p>
              副本中由 Langfuse 维护的卡片可以重新排列或移除；编辑其内容的功能将在未来版本中提供。
            </p>
            {existingClone && (
              <div className="bg-muted/50 flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                <span>
                  您已有一个副本：{" "}
                  <span className="text-foreground font-bold">
                    &ldquo;{existingClone.name}&rdquo;
                  </span>
                  {pendingDefinition
                    ? " —— 打开它将丢弃您尝试的更改"
                    : ""}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    capture("dashboard:clone_open_existing_click", {
                      dashboard_id: dashboardId,
                      existing_clone_id: existingClone.id,
                      had_pending_change: Boolean(pendingDefinition),
                    });
                    onOpenChange(false);
                    onCancel?.();
                    router.push(
                      `/project/${projectId}/dashboards/${encodeURIComponent(existingClone.id)}`,
                    );
                  }}
                >
                  <ExternalLinkIcon size={14} className="mr-1" />
                  打开现有副本
                </Button>
              </div>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <div className="flex gap-2">
            <Button
              onClick={() => handleOpenChange(false)}
              variant="outline"
              type="button"
              disabled={cloneDashboard.isPending}
            >
              取消
            </Button>
            <Button
              onClick={handleConfirm}
              type="button"
              loading={cloneDashboard.isPending}
            >
              创建我的副本
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
