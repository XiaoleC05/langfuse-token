import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Trash } from "lucide-react";
import { api } from "@/src/utils/api";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";

interface DeleteAutomationButtonProps {
  projectId: string;
  automationId: string;
  onSuccess?: () => void;
  variant?: "icon" | "button"; // "icon" for list view, "button" for form view
}

export const DeleteAutomationButton: React.FC<DeleteAutomationButtonProps> = ({
  projectId,
  automationId,
  onSuccess,
  variant = "icon",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const utils = api.useUtils();
  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "automations:CUD",
  });

  const deleteAutomationMutation = api.automations.deleteAutomation.useMutation(
    {
      onSuccess: () => {
        showSuccessToast({
          title: "自动化已删除",
          description: "自动化已成功删除。",
        });

        if (onSuccess) {
          onSuccess();
        }

        utils.automations.invalidate();
      },
    },
  );

  return (
    <Popover open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
      <PopoverTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={!hasAccess}
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">删除</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="border-light-red flex items-center"
            disabled={!hasAccess}
          >
            <span className="text-dark-red">删除</span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent>
        <h2 className="mb-3 font-bold">请确认</h2>
        <p className="mb-3 text-sm">
          此操作将永久删除该自动化及其执行历史。
          此操作不可撤销。
        </p>
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="destructive"
            loading={deleteAutomationMutation.isPending}
            onClick={() => {
              deleteAutomationMutation.mutateAsync({
                projectId,
                automationId,
              });
              setIsOpen(false);
            }}
          >
            删除自动化
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
