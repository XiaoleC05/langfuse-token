"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { FilingInfo } from "@/src/components/FilingInfo";
import { SiteLogo } from "./SiteLogo";

/**
 * Oxelia51 公开站点页脚（落地页 / 文档站共用）。
 * 与顶栏不重复：顶栏是 首页/文档/社区/更新日志/下载；页脚是 云平台登录注册/反馈/许可证/备案。
 */
const GITHUB_URL = "https://github.com/XiaoleC05/Oxelia51";

export function SiteFooter() {
  const { status } = useSession();
  const showAuth = status !== "authenticated";

  const headingClass = "text-sm font-medium text-(--ox-text-h)";
  const linkClass =
    "text-sm text-(--ox-text-muted) transition-colors hover:text-(--ox-text-h)";

  return (
    <footer
      className="w-full border-t"
      style={{ borderColor: "var(--ox-border)" }}
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* 品牌 + 一句话 */}
          <div className="max-w-xs">
            <SiteLogo
              wordartClassName="h-5 sm:h-6"
              glyphClassName="h-5 sm:h-6"
            />
            <p className="mt-4 text-sm leading-6 text-(--ox-text-muted)">
              只需要改一行环境变量，所有 Token 消耗一目了然。本地部署，开源 MIT。
            </p>
          </div>

          {/* 链接列：不与顶栏重复 */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div className="flex flex-col gap-3">
              <h4 className={headingClass}>云平台</h4>
              {showAuth && (
                <>
                  <Link href="/auth/sign-in" className={linkClass}>
                    登录
                  </Link>
                  <Link href="/auth/sign-up" className={linkClass}>
                    注册
                  </Link>
                </>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <h4 className={headingClass}>支持</h4>
              <a href="mailto:receive@oxelia51.com" className={linkClass}>
                用户反馈
              </a>
              <a
                href={`${GITHUB_URL}/issues`}
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                GitHub Issues
              </a>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className={headingClass}>资源</h4>
              <Link href="/docs" className={linkClass}>
                使用文档
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                GitHub
              </a>
              <a
                href="https://github.com/XiaoleC05/Oxelia51/blob/master/LICENSE"
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                MIT 许可证
              </a>
            </div>
          </div>
        </div>

        {/* 备案 */}
        <div
          className="mt-12 border-t pt-6"
          style={{ borderColor: "var(--ox-border)" }}
        >
          <FilingInfo variant="compact" />
        </div>
      </div>
    </footer>
  );
}
