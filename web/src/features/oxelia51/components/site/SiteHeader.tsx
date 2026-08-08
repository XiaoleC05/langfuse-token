"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Github, ArrowRight } from "lucide-react";
import { Oxelia51ThemeToggle } from "@/src/features/theming/Oxelia51ThemeToggle";
import { SiteLogo } from "./SiteLogo";

/**
 * Oxelia51 公开站点顶栏（落地页 / 文档站 / 下载页 / 社区页 / 更新日志页共用）。
 * 左侧导航：首页 · 免费下载（独立路由）· 文档 · 社区（独立路由）· 更新日志（独立路由）。
 * 未登录显示弱化的「登录 / 我是管理员」，已登录显示「进入工作台」。
 * 顶栏固定实色显示，滑动时不隐藏。
 */
const GITHUB_URL = "https://github.com/XiaoleC05/Oxelia51";

export function SiteHeader() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const authenticated = status === "authenticated";

  const firstProjectId = session?.user?.organizations?.[0]?.projects?.[0]?.id;
  const workspaceHref = firstProjectId
    ? `/project/${firstProjectId}`
    : "/organization";

  const linkClass = (active: boolean, accent = false) =>
    `text-sm transition-colors ${
      active
        ? accent
          ? "font-medium text-(--ox-accent)"
          : "font-medium text-(--ox-text-h)"
        : accent
          ? "font-semibold text-(--ox-accent) hover:text-(--ox-accent-hover)"
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
        <div className="flex min-w-0 items-center gap-6 md:gap-8">
          <Link href="/" aria-label="Oxelia51 首页" className="shrink-0">
            <SiteLogo
              wordartClassName="h-5 sm:h-6"
              glyphClassName="h-5 sm:h-6"
            />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className={linkClass(isActive("/", true))}>
              首页
            </Link>
            <Link
              href="/download"
              className={linkClass(isActive("/download"), true)}
            >
              免费下载
            </Link>
            <Link href="/docs" className={linkClass(isActive("/docs"))}>
              文档
            </Link>
            <Link href="/community" className={linkClass(isActive("/community"))}>
              社区
            </Link>
            <Link href="/changelog" className={linkClass(isActive("/changelog"))}>
              更新日志
            </Link>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 md:gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="hidden text-(--ox-text-muted) transition-colors hover:text-(--ox-text-h) sm:block"
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
                className="hidden text-xs text-(--ox-text-muted) transition-colors hover:text-(--ox-text-h) sm:block"
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
