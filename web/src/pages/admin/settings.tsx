import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { StringNoHTML } from "@langfuse/shared";
import { api } from "@/src/utils/api";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/src/components/ui/form";
import { AdminShell } from "@/src/features/oxelia51/components/admin/AdminShell";
import { AdminGate } from "@/src/features/oxelia51/components/admin/AdminGate";
import {
  AdminCard,
  useIsSuperAdmin,
} from "@/src/features/oxelia51/components/admin/shared";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";

// 与 /account/settings 的修改名称表单同一 schema / mutation / 提示文案，保持一致体验
const displayNameSchema = z.object({
  name: StringNoHTML.min(1, "名称不能为空").max(100, "名称最多 100 个字符"),
});

function UpdateDisplayNameForm() {
  const { data: session, update: updateSession } = useSession();
  const utils = api.useUtils();

  const form = useForm({
    resolver: zodResolver(displayNameSchema),
    defaultValues: {
      name: "",
    },
  });

  const updateDisplayName = api.userAccount.updateDisplayName.useMutation({
    onSuccess: async () => {
      await updateSession();
      await utils.invalidate();
      form.reset();
      showSuccessToast({
        title: "名称已更新",
        description: "您的名称已成功更新。",
      });
    },
    onError: (error) => form.setError("name", { message: error.message }),
  });

  function onSubmit(values: z.infer<typeof displayNameSchema>) {
    updateDisplayName.mutate({ name: values.name });
  }

  return (
    <>
      <p className="text-muted-foreground text-sm">
        当前名称：&quot;<b>{session?.user?.name ?? ""}</b>&quot;
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder={session?.user?.name ?? ""}
                    {...field}
                    className="max-w-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            variant="secondary"
            type="submit"
            loading={updateDisplayName.isPending}
            disabled={form.getValues().name === ""}
            className="mt-4"
          >
            保存
          </Button>
        </form>
      </Form>
    </>
  );
}

/**
 * 管理台专属设置页（/admin/settings）：账户信息 + 修改姓名 + 修改密码。
 * 与 /admin 同一 AdminShell / AdminGate；布局由 pathClassification 的
 * /admin 前缀命中 withoutNavigation，自动走 MinimalLayout。
 */
export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const isSuperAdmin = useIsSuperAdmin();

  return (
    <>
      <Head>
        <title>设置 | Oxelia51 管理台</title>
      </Head>
      <AdminShell>
        <AdminGate>
          <div className="flex max-w-2xl flex-col gap-4">
            <AdminCard title="账户信息">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">当前邮箱</span>
                <span className="font-mono text-xs sm:text-sm">
                  {session?.user?.email ?? "—"}
                </span>
                <Badge variant="secondary">
                  {isSuperAdmin ? "超级管理员" : "管理员"}
                </Badge>
              </div>
            </AdminCard>

            <AdminCard title="修改姓名">
              <UpdateDisplayNameForm />
            </AdminCard>

            <AdminCard title="修改密码">
              <p className="text-muted-foreground text-sm">
                我们将向您的邮箱发送安全链接，点击下方按钮开始重置密码流程。
              </p>
              <Button asChild variant="secondary" className="self-start">
                <Link href="/auth/reset-password">修改密码</Link>
              </Button>
            </AdminCard>
          </div>
        </AdminGate>
      </AdminShell>
    </>
  );
}
