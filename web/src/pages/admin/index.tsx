import Head from "next/head";
import Link from "next/link";
import {
  Bell,
  LayoutDashboard,
  MessageSquare,
  Server,
  Settings,
  Shield,
  Users,
  Wrench,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { AdminShell } from "@/src/features/oxelia51/components/admin/AdminShell";
import { AdminGate } from "@/src/features/oxelia51/components/admin/AdminGate";
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
 * 三态门控见 AdminGate（与 /admin/settings 共用）。
 * 布局：桌面端左侧纵向导航（sticky），移动端回落为顶部横向滚动 tabs。
 * 「设置」为独立页面（/admin/settings），在导航末尾以链接形式入口。
 */
export default function AdminConsolePage() {
  return (
    <>
      <Head>
        <title>管理台 | Oxelia51</title>
      </Head>
      <AdminShell>
        <AdminGate>
          <Tabs
            defaultValue="overview"
            className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6"
          >
            {/* 导航：移动端顶部横向滚动，桌面端左侧纵向 sticky */}
            <TabsList className="flex h-auto w-full shrink-0 flex-row items-stretch justify-start gap-1 overflow-x-auto rounded-none bg-transparent p-0 md:sticky md:top-14 md:w-52 md:flex-col">
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
              {/* 独立设置页入口：样式与上方 tab 触发器一致，点击跳转 /admin/settings */}
              <Link
                href="/admin/settings"
                className="text-muted-foreground inline-flex h-9 shrink-0 items-center justify-start gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors hover:bg-[var(--ox-bg-alt)] hover:text-[var(--ox-accent)]"
              >
                <Settings className="h-4 w-4" />
                设置
              </Link>
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
        </AdminGate>
      </AdminShell>
    </>
  );
}
