"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Github, ArrowRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Oxelia51ThemeToggle } from "@/src/features/theming/Oxelia51ThemeToggle";
import { SiteLogo } from "./SiteLogo";

/**
 * Oxelia51 公开站点顶栏（落地页 / 文档站共用）。
 * 主 CTA = 免费下载；未登录显示弱化的「登录 / 我是管理员」，
 * 已登录显示「进入工作台」（不再自动跳转，改显式入口）。
 * 顶栏始终固定（实色背景），滑动时不隐藏。
 */
const GITHUB_URL = "https://github.com/XiaoleC05/Oxelia51";

export function SiteHeader() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const authenticated = status === "authenticated";

  const firstProjectId =
    session?.user?.organizations?.[0]?.projects?.[0]?.id;
  const workspaceHref = firstProjectId
    ? `/project/${firstProjectId}`
    : "/organization";

  const linkClass = (active: boolean) =>
    `text-sm transition-colors ${
      active
        ? "font-medium text-(--ox-text-h)"
        : "text-(--ox-text-muted) hover:text-(--ox-text-h)"
    }`;

  const isActive = (href: string, exact = false) => {
    if (exact) return router.pathname === href;
    return router.pathname === href || router.pathname.startsWith(href + "/");
  };

  return (
    <header
      className="sticky top-0 z-40 w-full border-b"
      style={{
        borderColor: "var(--ox-border)",
        backgroundColor: "var(--ox-bg)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6 md:gap-10">
          <Link href="/" aria-label="Oxelia51 首页" className="shrink-0">
            <SiteLogo height={26} glyphSize={26} />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className={linkClass(isActive("/", true))}>
              首页
            </Link>
            <Link href="/docs" className={linkClass(isActive("/docs"))}>
              文档
            </Link>
            <a
              href="/#community"
              className="text-(--ox-text-muted) transition-colors hover:text-(--ox-text-h)"
            >
              社区
            </a>
            <Link
              href="/docs/changelog"
              className={linkClass(isActive("/docs/changelog"))}
            >
              更新日志
            </Link>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 md:gap-3">
          <Button asChild size="sm">
            <a href="/#download">免费下载</a>
          </Button>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="text-(--ox-text-muted) transition-colors hover:text-(--ox-text-h)"
          >
            <Github className="h-4 w-4" />
          </a>
          <Oxelia51ThemeToggle />
          {authenticated ? (
            <Link
              href={workspaceHref}
              className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium text-(--ox-text-h) transition-colors hover:border-(--ox-accent)/60 hover:text-(--ox-accent)"
              style={{ borderColor: "var(--ox-border)" }}
            >
              进入工作台
              <ArrowRight className="h-3 w-3" />
            </Link>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className="text-xs text-(--ox-text-muted) transition-colors hover:text-(--ox-text-h)"
              >
                登录
              </Link>
              <Link
                href="/auth/admin"
                className="hidden text-[11px] text-(--ox-text-muted)/60 transition-colors hover:text-(--ox-text-h) lg:inline"
              >
                我是管理员
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
