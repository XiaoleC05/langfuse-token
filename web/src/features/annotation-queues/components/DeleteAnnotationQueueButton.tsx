import { DeleteButton } from "@/src/components/deleteButton";
import { api } from "@/src/utils/api";

type DeleteAnnotationQueueButtonProps = {
  projectId: string;
  queueId: string;
};

export const DeleteAnnotationQueueButton = ({
  projectId,
  queueId,
}: DeleteAnnotationQueueButtonProps) => {
  const utils = api.useUtils();
  const deleteMutation = api.annotationQueues.delete.useMutation();

  return (
    <DeleteButton
      itemId={queueId}
      projectId={projectId}
      scope="annotationQueues:CUD"
      invalidateFunc={() => utils.annotationQueues.invalidate()}
      isTableAction
      icon
      variant="ghost"
      size="icon-xs"
      title="删除"
      aria-label="删除"
      captureDeleteOpen={() => undefined}
      captureDeleteSuccess={() => undefined}
      customDeletePrompt="此操作不可撤销，将移除此队列中的队列条目。在此队列中标注时添加的评分不会被删除。"
      entityToDeleteName="标注队列"
      executeDeleteMutation={async (onSuccess) => {
        await deleteMutation.mutateAsync({
          projectId,
          queueId,
        });
        onSuccess();
      }}
      isDeleteMutationLoading={deleteMutation.isPending}
    />
  );
};
