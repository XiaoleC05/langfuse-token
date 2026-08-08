"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Github, ArrowRight, Menu, X } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const authenticated = status === "authenticated";

  const firstProjectId = session?.user?.organizations?.[0]?.projects?.[0]?.id;
  const workspaceHref = firstProjectId
    ? `/project/${firstProjectId}`
    : "/organization";

  const NAV_LINKS: {
    href: string;
    label: string;
    exact?: boolean;
    accent?: boolean;
  }[] = [
    { href: "/", label: "首页", exact: true },
    { href: "/download", label: "免费下载", accent: true },
    { href: "/docs", label: "文档" },
    { href: "/community", label: "社区" },
    { href: "/changelog", label: "更新日志" },
  ];

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
              wordartClassName="h-7 sm:h-8"
              glyphClassName="h-7 sm:h-8"
            />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={linkClass(isActive(l.href, l.exact), "accent" in l && l.accent)}
              >
                {l.label}
              </Link>
            ))}
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
          {/* 移动端菜单按钮 */}
          <button
            type="button"
            aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-md border text-(--ox-text-muted) transition-colors hover:text-(--ox-text-h) md:hidden"
            style={{ borderColor: "var(--ox-border)" }}
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* 移动端菜单面板 */}
      {menuOpen && (
        <div className="border-t md:hidden" style={{ borderColor: "var(--ox-border)", backgroundColor: "var(--ox-bg)" }}>
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-2 py-2.5 text-sm"
                style={
                  isActive(l.href, l.exact)
                    ? { color: "var(--ox-accent)" }
                    : { color: "var(--ox-text-h)" }
                }
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
