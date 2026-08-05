import { Button, type ButtonProps } from "@/src/components/ui/button";
import { Edit, LockIcon, Pen, PlusIcon, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useState, forwardRef } from "react";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { DatasetForm } from "@/src/features/datasets/components/DatasetForm";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { type Prisma } from "@langfuse/shared";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { IconOnlyButton } from "@/src/components/IconOnlyButton";
import { api } from "@/src/utils/api";

interface BaseDatasetButtonProps {
  mode: "create" | "update" | "delete";
  projectId: string;
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}

interface CreateDatasetButtonProps extends BaseDatasetButtonProps {
  mode: "create";
  folderPrefix?: string;
}

interface DeleteDatasetButtonProps extends BaseDatasetButtonProps {
  mode: "delete";
  datasetId: string;
  datasetName: string;
  icon?: boolean;
}

interface UpdateDatasetButtonProps extends BaseDatasetButtonProps {
  mode: "update";
  datasetId: string;
  datasetName: string;
  datasetDescription?: string;
  datasetMetadata?: Prisma.JsonValue;
  datasetInputSchema?: Prisma.JsonValue;
  datasetExpectedOutputSchema?: Prisma.JsonValue;
  icon?: boolean;
}

type DatasetActionButtonProps =
  | CreateDatasetButtonProps
  | UpdateDatasetButtonProps
  | DeleteDatasetButtonProps;

export const DatasetActionButton = forwardRef<
  HTMLButtonElement,
  DatasetActionButtonProps
>((props, ref) => {
  const capture = usePostHogClientCapture();
  const [open, setOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "datasets:CUD",
  });
  const utils = api.useUtils();
  const deleteMutation = api.datasets.deleteDataset.useMutation();

  const actionButton =
    props.mode === "update" ? (
      props.icon ? (
        <IconOnlyButton
          ref={ref}
          icon={<Pen className="h-4 w-4" />}
          label="编辑"
          aria-label="编辑"
          disabledReason={
            hasAccess
              ? undefined
              : "您没有编辑此数据集的权限。"
          }
          variant={props.variant}
          size={props.size}
          className={props.className}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
            capture("datasets:update_form_open", {
              source: "table-single-row",
            });
          }}
        />
      ) : (
        <Button
          ref={ref}
          variant={props.variant || "ghost"}
          size={props.size || "icon"}
          className={props.className}
          disabled={!hasAccess}
          onClick={() => {
            setOpen(true);
            capture("datasets:update_form_open", {
              source: "table-single-row",
            });
          }}
        >
          {hasAccess ? (
            <Edit className="mr-2 h-4 w-4" />
          ) : (
            <LockIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          编辑
        </Button>
      )
    ) : props.mode === "delete" ? (
      props.icon ? (
        <IconOnlyButton
          ref={ref}
          icon={<Trash className="h-4 w-4" />}
          label="删除"
          aria-label="删除"
          disabledReason={
            hasAccess
              ? undefined
              : "您没有删除此数据集的权限。"
          }
          variant={props.variant}
          size={props.size}
          className={props.className}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
            capture("datasets:delete_form_open", {
              source: "table-single-row",
            });
          }}
        />
      ) : (
        <Button
          ref={ref}
          variant={props.variant || "ghost"}
          size={props.size}
          className={props.className}
          disabled={!hasAccess}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
            capture("datasets:delete_form_open", {
              source: "table-single-row",
            });
          }}
        >
          {hasAccess ? (
            <Trash className="mr-2 h-4 w-4" />
          ) : (
            <LockIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          删除
        </Button>
      )
    ) : (
      <Button
        ref={ref}
        size={props.size}
        className={props.className}
        disabled={!hasAccess}
        onClick={() => capture("datasets:new_form_open")}
        variant={props.variant || "default"}
      >
        {hasAccess ? (
          <PlusIcon className="mr-1.5 -ml-0.5 h-4 w-4" aria-hidden="true" />
        ) : (
          <LockIcon className="mr-1.5 -ml-0.5 h-3 w-3" aria-hidden="true" />
        )}
        新建数据集
      </Button>
    );

  // Icon-only buttons carry their own tooltip and open the dialog via onClick,
  // so they are rendered directly rather than as an asChild dialog trigger.
  const isIconMode = props.mode !== "create" && props.icon;

  if (props.mode === "delete") {
    const { projectId, datasetId, datasetName } = props;
    const handleDelete = async () => {
      capture("datasets:delete_form_submit");
      try {
        await deleteMutation.mutateAsync({ projectId, datasetId });
        utils.datasets.invalidate();
        setDeleteConfirmationInput("");
        setOpen(false);
      } catch (error) {
        console.error(error);
      }
    };

    return (
      <>
        {isIconMode ? actionButton : null}
        <ConfirmDialog
          open={hasAccess && open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) setDeleteConfirmationInput("");
          }}
          trigger={isIconMode ? undefined : actionButton}
          size="lg"
          title="请确认"
          description="此操作无法撤销，将删除与此数据集相关的所有数据。"
          confirmLabel="删除数据集"
          confirmDisabled={deleteConfirmationInput !== datasetName}
          loading={deleteMutation.isPending}
          onConfirm={handleDelete}
        >
          <div className="grid w-full gap-1.5">
            <Label htmlFor="delete-confirmation">
              输入 &quot;{datasetName}&quot; 以确认删除
            </Label>
            <Input
              id="delete-confirmation"
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
            />
          </div>
        </ConfirmDialog>
      </>
    );
  }

  return (
    <Dialog open={hasAccess && open} onOpenChange={setOpen}>
      {isIconMode ? (
        actionButton
      ) : (
        <DialogTrigger asChild>{actionButton}</DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] sm:max-w-2xl md:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {props.mode === "create" ? "创建新数据集" : "更新数据集"}
          </DialogTitle>
        </DialogHeader>

        {props.mode === "create" ? (
          <DatasetForm
            mode="create"
            projectId={props.projectId}
            onFormSuccess={() => setOpen(false)}
            folderPrefix={props.folderPrefix}
          />
        ) : (
          <DatasetForm
            mode="update"
            projectId={props.projectId}
            onFormSuccess={() => setOpen(false)}
            datasetId={props.datasetId}
            datasetName={props.datasetName}
            datasetDescription={props.datasetDescription}
            datasetMetadata={props.datasetMetadata}
            datasetInputSchema={props.datasetInputSchema}
            datasetExpectedOutputSchema={props.datasetExpectedOutputSchema}
          />
        )}
      </DialogContent>
    </Dialog>
  );
});

DatasetActionButton.displayName = "DatasetActionButton";
