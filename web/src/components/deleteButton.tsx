import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Button, type ButtonProps } from "@/src/components/ui/button";
import { LockIcon, TrashIcon } from "lucide-react";
import { IconOnlyButton } from "@/src/components/IconOnlyButton";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { type ProjectScope } from "@/src/features/rbac/constants/projectAccessRights";
import { api } from "@/src/utils/api";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { useHasEntitlement } from "@/src/features/entitlements/hooks";

export type DeleteButtonProps = {
  itemId: string;
  projectId: string;
  isTableAction?: boolean;
  scope?: ProjectScope;
  invalidateFunc?: () => void;
  redirectUrl?: string;
  deleteConfirmation?: string;
  icon?: boolean;
  enabled?: boolean;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  title?: string;
  className?: string;
  // forwarded explicitly because the base component does not spread unknown
  // props onto the rendered button
  "aria-label"?: string;
};

type BaseDeleteButtonProps = Omit<DeleteButtonProps, "itemId"> & {
  variant?: ButtonProps["variant"];
  scope: NonNullable<DeleteButtonProps["scope"]>;
  invalidateFunc: NonNullable<DeleteButtonProps["invalidateFunc"]>;
  captureDeleteOpen: (
    capture: ReturnType<typeof usePostHogClientCapture>,
    isTableAction: boolean,
  ) => void;
  captureDeleteSuccess: (
    capture: ReturnType<typeof usePostHogClientCapture>,
    isTableAction: boolean,
  ) => void;
  entityToDeleteName: string;
  customDeletePrompt?: string;
  executeDeleteMutation: (onSuccess: () => void) => Promise<void>;
  isDeleteMutationLoading: boolean;
  itemId?: string;
  // when set, the popover explains why deletion is blocked instead of asking for confirmation
  deleteBlocker?: React.ReactNode;
  onPopoverOpenChange?: (open: boolean) => void;
};

export function DeleteButton({
  variant,
  itemId,
  projectId,
  isTableAction = false,
  scope,
  invalidateFunc,
  redirectUrl,
  deleteConfirmation,
  icon = false,
  enabled = true,
  title,
  className,
  size,
  captureDeleteOpen,
  captureDeleteSuccess,
  entityToDeleteName,
  executeDeleteMutation,
  isDeleteMutationLoading,
  customDeletePrompt,
  deleteBlocker,
  onPopoverOpenChange,
  "aria-label": ariaLabel,
}: BaseDeleteButtonProps) {
  const [isDeleted, setIsDeleted] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const capture = usePostHogClientCapture();
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");

  const hasAccess = useHasProjectAccess({ projectId, scope: scope });

  const onDeleteSuccess = useMemo(() => {
    return () => {
      setIsDeleted(true);
      captureDeleteSuccess(capture, isTableAction);
      !isTableAction && redirectUrl
        ? router.push(redirectUrl)
        : invalidateFunc();
    };
  }, [
    isTableAction,
    redirectUrl,
    invalidateFunc,
    router,
    captureDeleteSuccess,
    capture,
  ]);

  return (
    <Popover
      key={itemId ?? "delete-action"}
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        // Reset the type-to-confirm input on close so the confirmation must be
        // re-typed each time (the component now stays mounted per table row).
        if (!o) setDeleteConfirmationInput("");
        onPopoverOpenChange?.(o);
      }}
    >
      {icon ? (
        // Icon-only: a compact button with a built-in tooltip; the popover is
        // opened from onClick since the tooltip wrapper can't be a trigger.
        <PopoverAnchor asChild>
          <span className="inline-flex">
            <IconOnlyButton
              icon={<TrashIcon className="h-4 w-4" />}
              label={title ?? "删除"}
              aria-label={ariaLabel ?? "删除"}
              disabledReason={
                hasAccess
                  ? undefined
                  : `你没有删除此${entityToDeleteName}的权限。`
              }
              variant={variant ?? "outline"}
              size={size ?? "icon"}
              className={className}
              disabled={!enabled}
              onClick={(e) => {
                e.stopPropagation();
                captureDeleteOpen(capture, isTableAction);
                // Opening via controlled state (PopoverAnchor, not
                // PopoverTrigger) means Radix never echoes onOpenChange, so
                // notify consumers explicitly.
                setOpen(true);
                onPopoverOpenChange?.(true);
              }}
            />
          </span>
        </PopoverAnchor>
      ) : (
        <PopoverTrigger asChild>
          <Button
            variant={variant ?? "ghost"}
            size={size ?? "default"}
            title={title}
            aria-label={ariaLabel}
            className={className}
            disabled={!hasAccess || !enabled}
            onClick={(e) => {
              e.stopPropagation();
              captureDeleteOpen(capture, isTableAction);
            }}
          >
            {hasAccess ? (
              <TrashIcon className="mr-2 h-4 w-4" />
            ) : (
              <LockIcon className="mr-2 h-4 w-4" />
            )}
            删除
          </Button>
        </PopoverTrigger>
      )}
      <PopoverContent onClick={(e) => e.stopPropagation()}>
        {deleteBlocker ?? (
          <>
            <h2 className="mb-3 font-bold">请确认</h2>
            <p className="mb-3 max-w-72 text-sm">
              {customDeletePrompt ??
                `此操作无法撤销。它将删除与此${entityToDeleteName}关联的所有数据。如果这是项目默认配置,将对所有用户删除。`}
            </p>
            {deleteConfirmation && (
              <div className="mb-4 grid w-full gap-1.5">
                <Label htmlFor="delete-confirmation">
                  输入 &quot;{deleteConfirmation}&quot; 以确认
                </Label>
                <Input
                  id="delete-confirmation"
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                />
              </div>
            )}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="destructive"
                loading={isDeleteMutationLoading || isDeleted}
                onClick={() => {
                  if (
                    deleteConfirmation &&
                    deleteConfirmationInput !== deleteConfirmation
                  ) {
                    alert("请输入正确的确认内容");
                    return;
                  }
                  executeDeleteMutation(onDeleteSuccess);
                }}
              >
                删除{entityToDeleteName}
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function DeleteTraceButton(props: DeleteButtonProps) {
  const utils = api.useUtils();
  const {
    itemId,
    projectId,
    scope = "traces:delete",
    invalidateFunc = () => utils.traces.all.invalidate(),
  } = props;
  const traceMutation = api.traces.deleteMany.useMutation();
  const executeDeleteMutation = async (onSuccess: () => void) => {
    try {
      await traceMutation.mutateAsync({
        traceIds: [itemId],
        projectId,
      });
    } catch (error) {
      return Promise.reject(error);
    }
    showSuccessToast({
      title: "追踪已删除",
      description:
        "所选追踪将被删除。追踪为异步删除,最长可能仍在 24 小时内可见。",
    });
    onSuccess();
  };
  const hasTraceDeletionEntitlement = useHasEntitlement("trace-deletion");
  return (
    <DeleteButton
      {...props}
      scope={scope}
      invalidateFunc={invalidateFunc}
      captureDeleteOpen={(capture, isTableAction) =>
        capture("trace:delete_form_open", {
          source: isTableAction ? "table-single-row" : "trace detail",
        })
      }
      captureDeleteSuccess={(capture, isTableAction) =>
        capture("trace:delete", {
          source: isTableAction ? "table-single-row" : "trace",
        })
      }
      entityToDeleteName="追踪"
      executeDeleteMutation={executeDeleteMutation}
      isDeleteMutationLoading={traceMutation.isPending}
      enabled={hasTraceDeletionEntitlement}
    />
  );
}

export function DeleteDatasetButton(props: DeleteButtonProps) {
  const utils = api.useUtils();
  const {
    itemId,
    projectId,
    scope = "datasets:CUD",
    invalidateFunc = () => utils.datasets.invalidate(),
  } = props;
  const datasetMutation = api.datasets.deleteDataset.useMutation();
  const executeDeleteMutation = async (onSuccess: () => void) => {
    try {
      await datasetMutation.mutateAsync({
        datasetId: itemId,
        projectId,
      });
    } catch (error) {
      return Promise.reject(error);
    }
    onSuccess();
  };
  return (
    <DeleteButton
      {...props}
      scope={scope}
      invalidateFunc={invalidateFunc}
      captureDeleteOpen={(capture, isTableAction) =>
        capture("datasets:delete_form_open", {
          source: isTableAction ? "table-single-row" : "dataset",
        })
      }
      captureDeleteSuccess={(capture, isTableAction) =>
        capture("datasets:delete_dataset_button_click", {
          source: isTableAction ? "table-single-row" : "dataset",
        })
      }
      entityToDeleteName="数据集"
      executeDeleteMutation={executeDeleteMutation}
      isDeleteMutationLoading={datasetMutation.isPending}
    />
  );
}

export function DeleteDashboardButton(props: DeleteButtonProps) {
  const utils = api.useUtils();
  const {
    itemId,
    projectId,
    scope = "dashboards:CUD",
    invalidateFunc = () => utils.dashboard.invalidate(),
  } = props;
  const dashboardMutation = api.dashboard.delete.useMutation();
  const executeDeleteMutation = async (onSuccess: () => void) => {
    try {
      await dashboardMutation.mutateAsync({
        dashboardId: itemId,
        projectId,
      });
    } catch (error) {
      return Promise.reject(error);
    }
    showSuccessToast({
      title: "仪表板已删除",
      description: "仪表板已成功删除",
    });
    onSuccess();
  };

  return (
    <DeleteButton
      {...props}
      scope={scope}
      invalidateFunc={invalidateFunc}
      captureDeleteOpen={(capture) =>
        capture("dashboard:delete_dashboard_form_open")
      }
      captureDeleteSuccess={(capture) =>
        capture("dashboard:delete_dashboard_button_click")
      }
      entityToDeleteName="仪表板"
      executeDeleteMutation={executeDeleteMutation}
      isDeleteMutationLoading={dashboardMutation.isPending}
    />
  );
}

/** DeleteMonitorButton deletes a monitor through the shared confirm-then-delete pattern. */
export function DeleteMonitorButton(props: DeleteButtonProps) {
  const utils = api.useUtils();
  const {
    itemId,
    projectId,
    scope = "monitors:CUD",
    invalidateFunc = () => utils.monitors.invalidate(),
  } = props;
  const monitorMutation = api.monitors.delete.useMutation({
    onSuccess: () => {
      showSuccessToast({
        title: "监控器已删除",
        description: "监控器已成功删除",
      });
      utils.monitors.invalidate();
    },
  });

  const executeDeleteMutation = async (onSuccess: () => void) => {
    try {
      await monitorMutation.mutateAsync({ id: itemId, projectId });
    } catch (error) {
      return Promise.reject(error);
    }
    onSuccess();
  };

  return (
    <DeleteButton
      {...props}
      scope={scope}
      invalidateFunc={invalidateFunc}
      captureDeleteOpen={(capture, isTableAction) =>
        capture("monitors:delete_form_open", {
          source: isTableAction ? "table-single-row" : "monitor",
        })
      }
      captureDeleteSuccess={(capture, isTableAction) =>
        capture("monitors:delete_monitor_button_click", {
          source: isTableAction ? "table-single-row" : "monitor",
        })
      }
      entityToDeleteName="监控器"
      customDeletePrompt="此操作无法撤销。它将停止所有评估,并删除该监控器的告警历史。"
      executeDeleteMutation={executeDeleteMutation}
      isDeleteMutationLoading={monitorMutation.isPending}
    />
  );
}

export function DeleteEvalConfigButton(props: DeleteButtonProps) {
  const utils = api.useUtils();
  const {
    itemId,
    projectId,
    scope = "evalJob:CUD",
    invalidateFunc = () => utils.evals.invalidate(),
  } = props;

  const evaluatorMutation = api.evals.deleteEvalJob.useMutation({
    onSuccess: () => {
      showSuccessToast({
        title: "运行中的评估器已删除",
        description: "运行中的评估器已成功删除",
      });
      utils.evals.invalidate();
    },
  });

  const executeDeleteMutation = async (onSuccess: () => void) => {
    try {
      await evaluatorMutation.mutateAsync({
        evalConfigId: itemId,
        projectId,
      });
      onSuccess();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  return (
    <DeleteButton
      {...props}
      scope={scope}
      invalidateFunc={invalidateFunc}
      captureDeleteOpen={(capture, isTableAction) =>
        capture("eval_config:delete_form_open", {
          source: isTableAction ? "table-single-row" : "eval config detail",
        })
      }
      captureDeleteSuccess={(capture, isTableAction) =>
        capture("eval_config:delete_evaluator_button_click", {
          source: isTableAction ? "table-single-row" : "eval config detail",
        })
      }
      customDeletePrompt="此操作无法撤销,将删除与该运行中评估器关联的所有日志。该评估器产生的评分不会被删除。"
      entityToDeleteName="运行中的评估器"
      executeDeleteMutation={executeDeleteMutation}
      isDeleteMutationLoading={evaluatorMutation.isPending}
    />
  );
}

export function DeleteEvaluationModelButton(
  props: Omit<DeleteButtonProps, "itemId">,
) {
  const utils = api.useUtils();
  const {
    projectId,
    scope = "evalDefaultModel:CUD",
    invalidateFunc = () => utils.defaultLlmModel.invalidate(),
  } = props;

  const { mutateAsync: deleteDefaultModel, isPending } =
    api.defaultLlmModel.deleteDefaultModel.useMutation({
      onSuccess: () => {
        showSuccessToast({
          title: "默认评估模型已删除",
          description:
            "默认评估模型已删除。依赖默认模型的运行中评估将被停用,排队中的任务将失败。",
        });
        utils.defaultLlmModel.fetchDefaultModel.invalidate({ projectId });
      },
    });

  const executeDeleteMutation = async (onSuccess: () => void) => {
    try {
      await deleteDefaultModel({
        projectId,
      });
    } catch (error) {
      return Promise.reject(error);
    }
    onSuccess();
  };

  return (
    <DeleteButton
      {...props}
      variant="outline"
      scope={scope}
      invalidateFunc={invalidateFunc}
      captureDeleteOpen={(capture, isTableAction) =>
        capture("eval_config:delete_form_open", {
          source: isTableAction ? "table-single-row" : "evaluator",
        })
      }
      captureDeleteSuccess={(capture, isTableAction) =>
        capture("eval_config:delete_evaluator_button_click", {
          source: isTableAction ? "table-single-row" : "evaluator",
        })
      }
      entityToDeleteName="默认评估模型"
      customDeletePrompt="删除该模型可能导致运行中的评估器失败。请确保没有运行中的评估器依赖该模型。"
      deleteConfirmation="delete"
      executeDeleteMutation={executeDeleteMutation}
      isDeleteMutationLoading={isPending}
    />
  );
}
