import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/src/utils/api";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { AdminShell } from "@/src/features/oxelia51/components/admin/AdminShell";
import { OverviewTab } from "@/src/features/oxelia51/components/admin/OverviewTab";
import { FeedbackTab } from "@/src/features/oxelia51/components/admin/FeedbackTab";
import { UsersTab } from "@/src/features/oxelia51/components/admin/UsersTab";
import { SystemTab } from "@/src/features/oxelia51/components/admin/SystemTab";
import { SecurityTab } from "@/src/features/oxelia51/components/admin/SecurityTab";
import { ToolsTab } from "@/src/features/oxelia51/components/admin/ToolsTab";
import { AlertsTab } from "@/src/features/oxelia51/components/admin/AlertsTab";

/**
 * Oxelia51 独立管理台（/admin）。
 * 三态门控：加载中 → 引导登录 / 无访问权限 / 管理台内容。
 * 所有数据 procedure 服务端另有 adminProcedure 拦截，双保险。
 */
export default function AdminConsolePage() {
  const { data: session, status } = useSession();
  const authed = status === "authenticated" && Boolean(session?.user);

  const whoami = api.oxelia51Admin.whoami.useQuery(undefined, {
    enabled: authed,
    staleTime: Infinity,
  });

  return (
    <>
      <Head>
        <title>管理台 | Oxelia51</title>
      </Head>
      <AdminShell>
        {status === "loading" || (authed && whoami.isLoading) ? (
          <p className="text-muted-foreground text-sm">加载中…</p>
        ) : !authed ? (
          <Card className="flex max-w-lg flex-col gap-3 p-6">
            <h2 className="font-heading text-lg font-semibold">需要登录</h2>
            <p className="text-muted-foreground text-sm">
              管理台与平台账户统一认证，请先登录您的 Oxelia51 账户。
            </p>
            <Button asChild className="self-start">
              <Link href="/auth/sign-in">前往登录</Link>
            </Button>
          </Card>
        ) : !whoami.data?.isAdmin ? (
          <Card className="flex max-w-lg flex-col gap-3 p-6">
            <h2 className="font-heading text-lg font-semibold">无访问权限</h2>
            <p className="text-muted-foreground text-sm">
              管理台仅对管理员开放。当前账户（{session?.user?.email}
              ）没有管理权限，如需开通请联系平台管理员。
            </p>
            <Button asChild variant="ghost" className="self-start">
              <Link href="/">返回首页</Link>
            </Button>
          </Card>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">总览</TabsTrigger>
              <TabsTrigger value="feedback">用户反馈</TabsTrigger>
              <TabsTrigger value="users">用户管理</TabsTrigger>
              <TabsTrigger value="system">系统状态</TabsTrigger>
              <TabsTrigger value="security">安全</TabsTrigger>
              <TabsTrigger value="tools">工具</TabsTrigger>
              <TabsTrigger value="alerts">告警</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <OverviewTab />
            </TabsContent>
            <TabsContent value="feedback">
              <FeedbackTab />
            </TabsContent>
            <TabsContent value="users">
              <UsersTab />
            </TabsContent>
            <TabsContent value="system">
              <SystemTab />
            </TabsContent>
            <TabsContent value="security">
              <SecurityTab />
            </TabsContent>
            <TabsContent value="tools">
              <ToolsTab />
            </TabsContent>
            <TabsContent value="alerts">
              <AlertsTab />
            </TabsContent>
          </Tabs>
        )}
      </AdminShell>
    </>
  );
}
