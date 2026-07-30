import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";

/**
 * Copy-first flow for Langfuse-managed widgets on a project dashboard:
 * editing one creates the project's own copy (the placement is rewired to
 * it) and opens the copy in the widget editor.
 */
export function CopyWidgetDialog({
  open,
  onOpenChange,
  widgetName,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgetName: string;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // Keep the dialog open while the copy is in flight (it navigates on
        // success).
        if (!nextOpen && isPending) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>编辑此组件的你的副本</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-muted-foreground py-4 text-sm">
            <span className="text-foreground font-bold">
              &ldquo;{widgetName}&rdquo;
            </span>{" "}
            由 Langfuse 维护,无法直接编辑。
            我们将用你自己的可编辑副本替换此卡片,并在组件编辑器中打开它
            ——仪表板的其余部分保持不变。
          </p>
        </DialogBody>
        <DialogFooter>
          <div className="flex gap-2">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              type="button"
              disabled={isPending}
            >
              取消
            </Button>
            <Button onClick={onConfirm} type="button" loading={isPending}>
              创建我的副本
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
