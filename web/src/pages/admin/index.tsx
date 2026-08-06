import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Bell,
  LayoutDashboard,
  MessageSquare,
  Server,
  Shield,
  Users,
  Wrench,
} from "lucide-react";
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

const NAV_ITEMS = [
  { value: "overview", label: "总览", icon: LayoutDashboard },
  { value: "feedback", label: "用户反馈", icon: MessageSquare },
  { value: "users", label: "用户管理", icon: Users },
  { value: "system", label: "系统状态", icon: Server },
  { value: "security", label: "安全", icon: Shield },
  { value: "tools", label: "工具", icon: Wrench },
  { value: "alerts", label: "告警", icon: Bell },
] as const;

/**
 * Oxelia51 独立管理台（/admin）。
 * 三态门控：加载中 → 引导登录 / 无访问权限 / 管理台内容。
 * 所有数据 procedure 服务端另有 adminProcedure 拦截，双保险。
 * 布局：桌面端左侧纵向导航（sticky），移动端回落为顶部横向滚动 tabs。
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
          <Tabs
            defaultValue="overview"
            className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6"
          >
            {/* 导航：移动端顶部横向滚动，桌面端左侧纵向 sticky */}
            <TabsList className="flex h-auto w-full shrink-0 flex-row items-stretch justify-start gap-1 overflow-x-auto rounded-none bg-transparent p-0 md:sticky md:top-20 md:w-52 md:flex-col">
              {NAV_ITEMS.map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="text-muted-foreground h-9 shrink-0 justify-start gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap data-[state=active]:bg-[var(--ox-bg-alt)] data-[state=active]:font-semibold data-[state=active]:text-[var(--ox-accent)] data-[state=active]:shadow-none md:data-[state=active]:shadow-[inset_3px_0_0_0_var(--ox-accent)]"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="min-w-0 flex-1">
              <TabsContent value="overview" className="mt-0">
                <OverviewTab />
              </TabsContent>
              <TabsContent value="feedback" className="mt-0">
                <FeedbackTab />
              </TabsContent>
              <TabsContent value="users" className="mt-0">
                <UsersTab />
              </TabsContent>
              <TabsContent value="system" className="mt-0">
                <SystemTab />
              </TabsContent>
              <TabsContent value="security" className="mt-0">
                <SecurityTab />
              </TabsContent>
              <TabsContent value="tools" className="mt-0">
                <ToolsTab />
              </TabsContent>
              <TabsContent value="alerts" className="mt-0">
                <AlertsTab />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </AdminShell>
    </>
  );
}
