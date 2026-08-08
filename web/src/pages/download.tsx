import Head from "next/head";
import Link from "next/link";
import { Apple, ArrowRight, Check, Monitor, Terminal } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/src/components/ui/button";
import { SiteHeader } from "@/src/features/oxelia51/components/site/SiteHeader";
import { SiteFooter } from "@/src/features/oxelia51/components/site/SiteFooter";
import { Reveal } from "@/src/features/oxelia51/components/landing/Reveal";

/**
 * Oxelia51 独立下载页（/download）。
 * 桌面应用正在开发中，各平台下载项标注「即将推出」；云平台现可用。
 * skipAppLayout 绕过应用外壳，全匿名可访问；顶栏「免费下载」与 Hero 徽章跳转至此。
 */

const PLATFORMS: {
  id: string;
  name: string;
  icon: ReactNode;
  methods: { label: string; hint: string }[];
}[] = [
  {
    id: "windows",
    name: "Windows",
    icon: <Monitor className="h-5 w-5" />,
    methods: [
      { label: "安装包 (.exe)", hint: "日常使用，开始菜单/桌面快捷方式" },
      { label: "便携版 (.zip)", hint: "免安装，U 盘 / 绿色使用" },
    ],
  },
  {
    id: "macos",
    name: "macOS",
    icon: <Apple className="h-5 w-5" />,
    methods: [
      { label: ".dmg（Apple Silicon）", hint: "新款 M 系列 Mac" },
      { label: ".dmg（Intel）", hint: "老款 Intel Mac" },
    ],
  },
  {
    id: "linux",
    name: "Linux",
    icon: <Terminal className="h-5 w-5" />,
    methods: [
      { label: ".AppImage", hint: "通用发行版，免安装" },
      { label: ".deb", hint: "Debian / Ubuntu 包管理" },
      { label: ".rpm", hint: "Fedora / RHEL 包管理" },
    ],
  },
];

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

            {/* 平台卡片 */}
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {PLATFORMS.map((p, i) => (
                <Reveal key={p.name} delay={i * 100}>
                  <div
                    id={p.id}
                    className="scroll-mt-28 h-full rounded-xl border p-6 transition-colors"
                    style={{ borderColor: "var(--ox-border)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-semibold text-(--ox-text-h)">
                        <span className="text-(--ox-accent)">{p.icon}</span>
                        {p.name}
                      </span>
                      <span
                        className="rounded-full border px-2 py-0.5 text-[10px] text-(--ox-text-muted)"
                        style={{ borderColor: "var(--ox-border)" }}
                      >
                        即将推出
                      </span>
                    </div>
                    <ul className="mt-4 flex flex-col gap-2.5">
                      {p.methods.map((m) => (
                        <li
                          key={m.label}
                          className="flex items-start gap-2 rounded-lg border px-3 py-2"
                          style={{
                            borderColor: "var(--ox-border)",
                            backgroundColor: "var(--ox-bg-alt)",
                          }}
                        >
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-(--ox-accent)" />
                          <span className="text-xs">
                            <span className="block font-medium text-(--ox-text-h)">
                              {m.label}
                            </span>
                            <span className="text-(--ox-text-muted)">{m.hint}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>

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
