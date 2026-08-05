import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { api } from "@/src/utils/api";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { toast } from "sonner";
import { Info } from "lucide-react";

const spendAlertSchema = z.object({
  title: z
    .string()
    .min(1, "标题为必填项")
    .max(100, "标题不能超过 100 个字符"),
  limit: z.coerce
    .number()
    .positive("限额必须为正数")
    .max(1000000, "限额必须小于 $1,000,000"),
});

type SpendAlertFormInput = z.input<typeof spendAlertSchema>;
type SpendAlertFormOutput = z.output<typeof spendAlertSchema>;

interface SpendAlertDialogProps {
  orgId: string;
  alert?: {
    id: string;
    title: string;
    threshold: { toString(): string };
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SpendAlertDialog({
  orgId,
  alert,
  open,
  onOpenChange,
  onSuccess,
}: SpendAlertDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const capture = usePostHogClientCapture();

  const form = useForm<SpendAlertFormInput, undefined, SpendAlertFormOutput>({
    resolver: zodResolver(spendAlertSchema),
    defaultValues: {
      title: alert?.title ?? "",
      limit: alert ? parseFloat(alert.threshold.toString()) : undefined,
    },
  });

  const createMutation = api.spendAlerts.createSpendAlert.useMutation();
  const updateMutation = api.spendAlerts.updateSpendAlert.useMutation();

  const onSubmit = async (data: SpendAlertFormOutput) => {
    setIsSubmitting(true);
    try {
      if (alert) {
        // Update existing alert
        await updateMutation.mutateAsync({
          orgId,
          id: alert.id,
          title: data.title,
          threshold: data.limit,
        });
        capture("spend_alert:updated", {
          orgId,
          alertId: alert.id,
          limit: data.limit,
        });
        toast.success("消费提醒已更新");
      } else {
        // Create new alert
        await createMutation.mutateAsync({
          orgId,
          title: data.title,
          threshold: data.limit,
        });
        capture("spend_alert:created", {
          orgId,
          limit: data.limit,
        });
        toast.success("消费提醒已创建");
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save spend alert:", error);
      toast.error(
        `${alert ? "更新" : "创建"}消费提醒失败，请重试。`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 sm:max-w-[425px]">
        <DialogTitle>
          {alert ? "编辑消费提醒" : "创建消费提醒"}
        </DialogTitle>
        <DialogDescription className="text-muted-foreground pt-1 pb-2 text-sm">
          当您组织的消费超过限额时收到通知。
        </DialogDescription>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>提醒标题</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：生产环境提醒" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>限额（USD）</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      max="1000000"
                      placeholder="100.00"
                      name={field.name}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      onChange={field.onChange}
                      value={
                        typeof field.value === "number" ||
                        typeof field.value === "string"
                          ? field.value
                          : ""
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-muted-foreground text-xs">
              <div className="flex flex-row items-center">
                <Info className="mr-2 h-3 w-3" />
                <span className="font-bold">工作原理</span>
              </div>
              <ul className="list-disc pl-5">
                <li>
                  限额将对照您即将收到的发票总额进行评估，包括基础费用、实时用量
                  费用、折扣和税费。
                </li>
                <li>每个计费周期触发一次提醒。</li>
                <li>提醒触发时，您将收到一封邮件。</li>
                <li>提醒评估存在 90 分钟的延迟。</li>
              </ul>
            </div>
            <div className="flex flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? alert
                    ? "正在更新..."
                    : "正在创建..."
                  : alert
                    ? "更新提醒"
                    : "创建提醒"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
