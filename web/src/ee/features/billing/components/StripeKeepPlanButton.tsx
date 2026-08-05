import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { api } from "@/src/utils/api";
import { toast } from "sonner";
import { nanoid } from "nanoid";

export const StripeKeepPlanButton = ({
  orgId,
  stripeProductId,
  onProcessing,
  processing,
}: {
  orgId: string | undefined;
  stripeProductId: string;
  onProcessing: (id: string | null) => void;
  processing: boolean;
}) => {
  const [_opId, setOpId] = useState<string | null>(null);

  const clearSchedule = api.cloudBilling.clearPlanSwitchSchedule.useMutation({
    onSuccess: () => {
      toast.success("已保留当前套餐");
      onProcessing(null);
      setOpId(null);
      setTimeout(() => window.location.reload(), 500);
    },
    onError: () => {
      onProcessing(null);
      setOpId(null);
      toast.error("保留当前套餐失败");
    },
  });

  if (!orgId) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full" variant="default">
          保留套餐
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg">
            确认保留当前套餐
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="text-sm">
          <p>
            您的当前订阅已安排了一次套餐变更。保留当前套餐将取消该安排，您将继续
            使用现有的套餐。
          </p>
          <p>
            您的功能和价格保持不变；用量仍按当前套餐计费。您是否要保留当前套餐并
            取消已安排的变更？
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">返回</Button>
          </DialogClose>
          <Button
            variant="default"
            onClick={() => {
              onProcessing(stripeProductId);
              // idempotency key for mutation operations with the stripe api
              let opId = _opId;
              if (!opId) {
                opId = nanoid();
                setOpId(opId);
              }
              clearSchedule.mutate({ orgId, opId });
            }}
            disabled={processing}
          >
            {processing ? "正在保留…" : "确认保留套餐"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
