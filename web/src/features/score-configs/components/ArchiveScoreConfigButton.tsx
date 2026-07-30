import { Archive } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import React from "react";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { api } from "@/src/utils/api";
import { useEmptyScoreConfigs } from "@/src/features/scores/hooks/useEmptyConfigs";

export const ArchiveScoreConfigButton = ({
  configId,
  projectId,
  isArchived,
  name,
}: {
  configId: string;
  projectId: string;
  isArchived: boolean;
  name: string;
}) => {
  const capture = usePostHogClientCapture();
  const { emptySelectedConfigIds, setEmptySelectedConfigIds } =
    useEmptyScoreConfigs();

  const hasAccess = useHasProjectAccess({
    projectId: projectId,
    scope: "scoreConfigs:CUD",
  });

  const utils = api.useUtils();
  const configMutation = api.scoreConfigs.update.useMutation({
    onSuccess: () => utils.scoreConfigs.invalidate(),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="flex w-full items-center justify-start"
          disabled={!hasAccess}
          onClick={(e) => {
            e.stopPropagation();
            capture("score_configs:archive_form_open");
          }}
        >
          <Archive className="mr-2 h-4 w-4"></Archive>
          归档
        </Button>
      </PopoverTrigger>
      <PopoverContent
        onClick={(e) => e.stopPropagation()}
        className="max-w-[500px]"
      >
        <h2 className="mb-3 font-bold">
          {isArchived ? "恢复配置" : "归档配置"}
        </h2>
        <p className="mb-3 text-sm">
          你的配置当前处于
          {isArchived
            ? `归档状态。如想再次在标注中使用"${name}",请恢复。`
            : `活跃状态。如不再想在标注中使用"${name}",请归档。历史"${name}"评分仍会显示且可删除。你可以随时恢复配置。`}
        </p>
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant={isArchived ? "default" : "destructive"}
            loading={configMutation.isPending}
            onClick={() => {
              configMutation.mutateAsync({
                projectId,
                id: configId,
                isArchived: !isArchived,
              });
              setEmptySelectedConfigIds(
                emptySelectedConfigIds.filter((id) => id !== configId),
              );
              capture("score_configs:archive_form_submit");
            }}
          >
            确认
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
