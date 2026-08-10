"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, type ReactNode } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  BarChart3,
  ExternalLink,
  FolderKanban,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Oxelia51ThemeToggle } from "@/src/features/theming/Oxelia51ThemeToggle";
import { SiteLogo } from "@/src/features/oxelia51/components/site/SiteLogo";
import { api } from "@/src/utils/api";

/**
 * Oxelia51 个人工作台布局（/app/*，P2）。
 * 认证要求：未登录重定向 /auth/sign-in；已登录渲染「个人工作台」侧边栏。
 * 独立于 AppLayout（skipAppLayout），不触碰现有 /project/* 团队界面。
 */
const NAV = [
  { href: "/app/overview", label: "总览", icon: <LayoutGrid className="h-4 w-4" /> },
  { href: "/app/providers", label: "供应商", icon: <FolderKanban className="h-4 w-4" /> },
  { href: "/app/agents", label: "Agent", icon: <MessageSquare className="h-4 w-4" /> },
  { href: "/app/analytics", label: "分析", icon: <BarChart3 className="h-4 w-4" /> },
  { href: "/app/settings", label: "设置", icon: <Settings className="h-4 w-4" /> },
];

export function WorkspaceLayout({
  active,
  children,
}: {
  active: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();

  // 管理员专属「管理台」入口：whoami 判定，非管理员不渲染（与主侧栏 AdminSidebarEntry 一致）
  const whoami = api.oxelia51Admin.whoami.useQuery(undefined, {
    staleTime: 60_000,
  });
  const navItems = whoami.data?.isAdmin
    ? [
        ...NAV,
        { href: "/admin", label: "管理台", icon: <ShieldCheck className="h-4 w-4" /> },
      ]
    : NAV;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(
        `/auth/sign-in?targetPath=${encodeURIComponent(router.asPath)}`,
      );
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex h-dvh items-center justify-center text-sm text-(--ox-text-muted)">
        正在加载工作台…
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-(--ox-bg)">
      {/* 顶栏 */}
      <header
        className="flex h-14 shrink-0 items-center justify-between border-b px-4 sm:px-6"
        style={{ borderColor: "var(--ox-border)", backgroundColor: "var(--ox-bg)" }}
      >
        <Link href="/app" className="shrink-0">
          <SiteLogo wordartClassName="h-5" glyphClassName="h-5" />
        </Link>
        <div className="flex items-center gap-2.5">
          <Oxelia51ThemeToggle />
          <span className="hidden text-xs text-(--ox-text-muted) sm:block">
            {session?.user?.email ?? session?.user?.name}
          </span>
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/" })}
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-(--ox-text-muted) transition-colors hover:border-(--ox-accent)/60 hover:text-(--ox-accent)"
            style={{ borderColor: "var(--ox-border)" }}
          >
            退出登录
            <LogOut className="h-3 w-3" />
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-(--ox-text-muted) transition-colors hover:text-(--ox-text-h)"
            style={{ borderColor: "var(--ox-border)" }}
          >
            返回网站
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* 侧边栏 */}
        <aside
          className="hidden w-48 shrink-0 border-r sm:block"
          style={{ borderColor: "var(--ox-border)", backgroundColor: "var(--ox-bg-alt)" }}
        >
          <nav className="flex flex-col gap-1 p-3">
            {navItems.map((item) => {
              const isActive = active === item.href || router.pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
                  style={
                    isActive
                      ? {
                          backgroundColor: "var(--ox-accent)",
                          color: "#fff",
                        }
                      : {
                          color: "var(--ox-text-muted)",
                        }
                  }
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* 移动端顶栏导航条 */}
        <nav
          className="flex shrink-0 items-center gap-1 overflow-x-auto border-b px-3 py-2 sm:hidden"
          style={{ borderColor: "var(--ox-border)", backgroundColor: "var(--ox-bg-alt)" }}
        >
          {navItems.map((item) => {
            const isActive = active === item.href || router.pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors"
                style={
                  isActive
                    ? { backgroundColor: "var(--ox-accent)", color: "#fff" }
                    : { color: "var(--ox-text-muted)" }
                }
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 内容 */}
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
