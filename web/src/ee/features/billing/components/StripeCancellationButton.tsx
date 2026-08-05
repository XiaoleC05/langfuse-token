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
import { useBillingInformation } from "./useBillingInformation";
import { api } from "@/src/utils/api";
import { useState } from "react";
import { toast } from "sonner";
import { nanoid } from "nanoid";

export const StripeCancellationButton = ({
  orgId,
  variant,
  className,
}: {
  orgId: string | undefined;
  variant: "secondary" | "default";
  className?: string;
}) => {
  const { cancellation } = useBillingInformation();
  const [loading, setLoading] = useState(false);
  const [_opId, setOpId] = useState<string | null>(null);

  const cancelMutation = api.cloudBilling.cancelStripeSubscription.useMutation({
    onSuccess: () => {
      toast.success("订阅将在计费周期结束时取消");
      setLoading(false);
      setOpId(null);
      setTimeout(() => window.location.reload(), 500);
    },
    onError: () => {
      setLoading(false);
      setOpId(null);
      toast.error("取消订阅失败");
    },
  });

  const reactivateMutation =
    api.cloudBilling.reactivateStripeSubscription.useMutation({
      onSuccess: () => {
        toast.success("订阅已重新激活");
        setLoading(false);
        setOpId(null);
        setTimeout(() => window.location.reload(), 500);
      },
      onError: () => {
        setLoading(false);
        setOpId(null);
        toast.error("重新激活订阅失败");
      },
    });

  if (!orgId) return null;

  const onReactivate = async () => {
    try {
      setLoading(true);
      // idempotency key for mutation operations with the stripe api
      let opId = _opId;
      if (!opId) {
        opId = nanoid();
        setOpId(opId);
      }
      await reactivateMutation.mutateAsync({ orgId, opId });
    } catch (_e) {
      toast.error("重新激活订阅失败");
    }
  };

  const onCancel = async () => {
    try {
      setLoading(true);
      // idempotency key for mutation operations with the stripe api
      let opId = _opId;
      if (!opId) {
        opId = nanoid();
        setOpId(opId);
      }
      await cancelMutation.mutateAsync({ orgId, opId });
    } catch (_e) {
      toast.error("取消订阅失败");
    }
  };

  // Reactivate with confirm dialog
  if (cancellation?.isCancelled) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant={variant}
            disabled={loading}
            title="重新激活订阅"
            className={className}
          >
            {loading ? "处理中…" : "重新激活订阅"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg">
              确认重新激活：保留您的订阅
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="text-sm">
            <p>
              重新激活将取消已安排的订阅取消。您的订阅将在当前计费周期结束后
              继续，并在您再次取消前自动续费。
            </p>
            <p>
              您的功能与用量计费保持不变。确认即表示您同意未来的续费与扣费。
            </p>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">取消</Button>
            </DialogClose>
            <Button variant="default" onClick={onReactivate} disabled={loading}>
              {loading ? "正在重新激活…" : "确认重新激活"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Cancel with confirm dialog
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          disabled={loading}
          title="取消订阅"
        >
          取消订阅
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg">确认取消</DialogTitle>
        </DialogHeader>
        <DialogBody className="text-sm">
          <p>
            您的订阅将不会续费。您在当前计费周期结束前仍可继续访问。
          </p>
          <p>
            周期剩余期间产生的用量仍按您当前套餐计费。确认后，订阅将在周期结束时
            取消。如果您改变主意，可在该日期前重新激活。
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">保留订阅</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onCancel} disabled={loading}>
            {loading ? "正在取消…" : "确认取消"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
