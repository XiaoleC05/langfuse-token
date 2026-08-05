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
import { ActionButton } from "@/src/components/ActionButton";
import { planLabels } from "@langfuse/shared";
import { api } from "@/src/utils/api";
import { toast } from "sonner";
import { nanoid } from "nanoid";

export const StripeSwitchPlanButton = ({
  orgId,
  currentPlan,
  newPlanTitle,
  isLegacySubscription,
  isUpgrade,
  stripeProductId,
  onProcessing,
  processing,
}: {
  orgId: string | undefined;
  currentPlan: keyof typeof planLabels | undefined;
  newPlanTitle: string | undefined;
  isLegacySubscription: boolean;
  isUpgrade: boolean;
  stripeProductId: string;
  onProcessing: (id: string | null) => void;
  processing: boolean;
}) => {
  const [_opId, setOpId] = useState<string | null>(null);

  const mutChangePlan =
    api.cloudBilling.changeStripeSubscriptionProduct.useMutation({
      onSuccess: () => {
        toast.success("套餐变更成功");
        onProcessing(null);
        setOpId(null);
        setTimeout(() => window.location.reload(), 500);
      },
      onError: () => {
        onProcessing(null);
        setOpId(null);
        toast.error("套餐变更失败");
      },
    });

  if (!orgId) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">更换套餐</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg">
            确认您的变更：{planLabels[currentPlan ?? "cloud:hobby"]} →{" "}
            {newPlanTitle}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="text-sm">
          {isLegacySubscription ? (
            <>
              <p>我们将立即结束您当前的订阅并开始新的订阅。</p>
              <p>
                您今天将收到一张发票，包含 (1)
                新套餐从今天开始的全新计费周期的基本费用，以及 (2)
                上一订阅中截至目前的费用和用量。
              </p>
              <p>确认即表示您接受立即出账以及从此刻开始激活新套餐。</p>
            </>
          ) : isUpgrade ? (
            <>
              <p>
                今天将按比例收取本计费周期剩余部分的基本费用。功能将立即更新；基于用量的费用将在本计费周期剩余时间内继续计费。
              </p>
              <p>
                示例：如果您的套餐为每月 $199，并在月中升级为每月 $499
                的套餐，则按比例收取的费用约为 $99.5 +
                $249.5（另加税费）。确切金额取决于时间和税费。
              </p>
              <p>确认即表示您接受按比例收取的费用和立即生效的套餐变更。</p>
            </>
          ) : (
            <>
              <p>
                今天不会产生任何费用。您将继续使用当前套餐直到本计费周期结束，之后我们会为您切换到新套餐。您可以随时切回。
              </p>
              <p>
                在切换之前，用量将继续按当前套餐计费。确认即表示您计划在周期结束时进行变更，并了解届时功能将相应调整。
              </p>
            </>
          )}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">取消</Button>
          </DialogClose>
          <ActionButton
            onClick={() => {
              onProcessing(stripeProductId);
              // idempotency key for mutation operations with the stripe api
              let opId = _opId;
              if (!opId) {
                opId = nanoid();
                setOpId(opId);
              }
              mutChangePlan.mutate({ orgId, stripeProductId, opId });
            }}
            loading={processing}
          >
            确认
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
