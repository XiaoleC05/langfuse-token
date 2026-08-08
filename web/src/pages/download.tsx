import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { SiteHeader } from "@/src/features/oxelia51/components/site/SiteHeader";
import { SiteFooter } from "@/src/features/oxelia51/components/site/SiteFooter";
import { Reveal } from "@/src/features/oxelia51/components/landing/Reveal";
import { DownloadCard } from "@/src/features/oxelia51/components/download/DownloadCard";

/**
 * Oxelia51 独立下载页（/download）。
 * 桌面应用发布后从 GitHub v* Release 动态拉取真实下载链接；
 * 尚无版本时显示「即将推出」；云平台现可用。
 * skipAppLayout 绕过应用外壳，全匿名可访问；顶栏「免费下载」与 Hero 徽章跳转至此。
 */

export default function DownloadPage() {
  return (
    <>
      <Head>
        <title>免费下载 · Oxelia51</title>
        <meta
          name="description"
          content="下载 Oxelia51 桌面应用（Windows / macOS / Linux）——本地优先的个人 Token 记账本；也可以直接使用云平台。"
        />
      </Head>
      <div className="ox-site-page flex min-h-screen flex-col">
        <SiteHeader />
        <main className="grow">
          <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            {/* 标题 */}
            <Reveal>
              <div className="text-center">
                <span className="text-xs font-semibold tracking-widest text-(--ox-accent) uppercase">
                  下载
                </span>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-(--ox-text-h) sm:text-4xl">
                  免费下载
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-(--ox-text-muted)">
                  桌面应用正在开发中，发布后本站与 GitHub 提供下载；云平台现可用。
                </p>
              </div>
            </Reveal>

            {/* 平台下载卡片（动态拉取真实发布） */}
            <DownloadCard />

            {/* 云平台 CTA */}
            <Reveal delay={150}>
              <div
                className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border p-6 sm:flex-row"
                style={{
                  borderColor: "var(--ox-border)",
                  backgroundColor: "var(--ox-bg-alt)",
                }}
              >
                <div>
                  <h3 className="text-sm font-semibold text-(--ox-text-h)">
                    等不及？先用云平台
                  </h3>
                  <p className="mt-1 text-xs text-(--ox-text-muted)">
                    在线体验全部功能：注册 → 创建项目 → 复制代理地址 → 改一行环境变量。
                  </p>
                </div>
                <Button asChild>
                  <Link href="/auth/sign-up">
                    云平台在线使用
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Reveal>
          </section>
        </main>
        <SiteFooter />

        {/* 平台卡片锚点高亮（顶栏/首页徽章跳转后闪烁提示） */}
        <style>{`
          #windows:target,
          #macos:target,
          #linux:target {
            border-color: var(--ox-accent) !important;
            animation: oxTargetFlash 1.6s ease-out;
          }
          @keyframes oxTargetFlash {
            0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--ox-accent) 45%, transparent); }
            100% { box-shadow: 0 0 0 14px transparent; }
          }
        `}</style>
      </div>
    </>
  );
}

DownloadPage.skipAppLayout = true;
