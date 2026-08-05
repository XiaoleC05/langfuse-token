import { useRouter } from "next/router";
import { Button } from "@/src/components/ui/button";
import { api } from "@/src/utils/api";
import { Copy } from "lucide-react";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";

export const DuplicateDatasetButton: React.FC<{
  projectId: string;
  datasetId: string;
}> = ({ projectId, datasetId }) => {
  const router = useRouter();
  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "datasets:CUD",
  });
  const duplicateDataset = api.datasets.duplicateDataset.useMutation({
    onSuccess: ({ id }) => {
      router.push(`/project/${projectId}/datasets/${id}/items`);
    },
  });

  const handleDuplicate = () => {
    if (
      confirm(
        "确定要复制此数据集及其所有数据项吗？",
      )
    ) {
      duplicateDataset.mutate({ projectId, datasetId });
    }
  };

  return (
    <Button
      onClick={handleDuplicate}
      variant="ghost"
      title="复制数据集"
      loading={duplicateDataset.isPending}
      disabled={!hasAccess}
    >
      <Copy className="mr-2 h-4 w-4" />
      复制
    </Button>
  );
};
