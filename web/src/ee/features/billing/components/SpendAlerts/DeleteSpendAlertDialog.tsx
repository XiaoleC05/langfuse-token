import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { api } from "@/src/utils/api";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { toast } from "sonner";

interface DeleteSpendAlertDialogProps {
  orgId: string;
  alertId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteSpendAlertDialog({
  orgId,
  alertId,
  open,
  onOpenChange,
  onSuccess,
}: DeleteSpendAlertDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const capture = usePostHogClientCapture();

  const deleteMutation = api.spendAlerts.deleteSpendAlert.useMutation();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync({
        orgId,
        id: alertId,
      });
      capture("spend_alert:deleted", {
        orgId,
        alertId,
      });
      toast.success("消费提醒已删除");
      onSuccess();
    } catch (error) {
      console.error("Failed to delete spend alert:", error);
      toast.error("删除消费提醒失败，请重试。");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>删除消费提醒</DialogTitle>
          <DialogDescription>
            确定要删除此消费提醒吗？此操作无法撤销，删除后您将不再收到针对该限额的通知。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "正在删除..." : "删除提醒"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
