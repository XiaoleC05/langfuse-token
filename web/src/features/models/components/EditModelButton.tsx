import { Button } from "@/src/components/ui/button";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { UpsertModelFormDialog } from "@/src/features/models/components/UpsertModelFormDialog";
import { type GetModelResult } from "@/src/features/models/validation";

export const EditModelButton = ({
  modelData,
  projectId,
}: {
  modelData: GetModelResult;
  projectId: string;
}) => {
  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "models:CUD",
  });

  return (
    <UpsertModelFormDialog {...{ modelData, projectId, action: "edit" }}>
      <Button
        variant="outline"
        disabled={!hasAccess}
        title="编辑模型"
        className="flex items-center"
      >
        <span>编辑</span>
      </Button>
    </UpsertModelFormDialog>
  );
};
