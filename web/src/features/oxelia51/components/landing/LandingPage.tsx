"use client";

import Head from "next/head";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpen,
  Check,
  ChevronDown,
  Code,
  Download,
  FolderKanban,
  Github,
  MessageSquare,
  Monitor,
  ShieldCheck,
  Terminal,
  Apple,
  Users,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { CopyCodeBlock } from "@/src/features/oxelia51/components/landing/CopyCodeBlock";
import { DashboardMock } from "@/src/features/oxelia51/components/landing/DashboardMock";
import { CommunityStats } from "@/src/features/oxelia51/components/landing/CommunityStats";
import { SiteHeader } from "@/src/features/oxelia51/components/site/SiteHeader";
import { SiteFooter } from "@/src/features/oxelia51/components/site/SiteFooter";
import { Reveal } from "@/src/features/oxelia51/components/landing/Reveal";
import { BackToTop } from "@/src/features/oxelia51/components/landing/BackToTop";

/**
 * Oxelia51 落地页 v2（2026-08-08 设计定稿）。
 * 结构仿 reasonix / CC Switch：Hero + 三步上手 + 特性 + 下载 + 社区 + FAQ + 页脚。
 * 主 CTA = 免费下载；登录/注册不再是前台；配色黑/白/心跳红。
 * 未实现功能（桌面应用/本地代理等）一律标注「即将推出」，不虚构。
 */
const GITHUB_URL = "https://github.com/XiaoleC05/Oxelia51";

const LOCAL_PROXY_CMD = `export ANTHROPIC_BASE_URL="http://localhost:17800/anthropic"`;
const CLOUD_PROXY_CMD = `export ANTHROPIC_BASE_URL="https://oxelia51.com/api/proxy/anthropic"`;

export function LandingPage() {
  return (
    <>
      <Head>
        <title>Oxelia51 | 只需要改一行环境变量，所有 Token 消耗一目了然</title>
        <meta
          name="description"
          content="Oxelia51 是本地优先的个人 Token 记账本：本地部署、安全简洁、多维统计。改一行环境变量，所有模型调用的 Token 消耗一目了然。"
        />
      </Head>
      <div className="ox-site-page flex min-h-screen flex-col">
        <SiteHeader />
        <main className="grow">
          <HeroSection />
          <HowItWorksSection />
          <FeaturesSection />
          <DownloadSection />
          <CommunitySection />
          <FaqSection />
        </main>
        <SiteFooter />
        <BackToTop />
        {/* 平台下载卡片锚点高亮（顶栏徽章点击跳转后闪烁提示） */}
        <style>{`
          #download-windows:target,
          #download-macos:target,
          #download-linux:target {
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

/* ---------------- Hero ---------------- */

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* 背景辉光 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-96"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, color-mix(in srgb, var(--ox-accent) 12%, transparent), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-14 text-center sm:px-6 sm:pt-20">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-(--ox-text-muted)"
          style={{ borderColor: "var(--ox-border)" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-(--ox-accent)" />
          本地优先 · 开源 MIT
        </span>

        <h1 className="mx-auto mt-6 max-w-3xl text-3xl leading-[1.3] font-bold tracking-tight text-(--ox-text-h) sm:text-5xl">
          只需要改一行环境变量，所有 Token 消耗一目了然
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-(--ox-text-muted) sm:text-lg">
          本地部署 · 安全简洁 · 多维统计。Claude Code、Cursor，以及 DeepSeek、Moonshot、智谱等
          国内模型，用量、成本、异常自动落账。
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <a href="/#download">
              免费下载
              <Download className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/docs">
              <BookOpen className="mr-2 h-4 w-4" />
              查看文档
            </Link>
          </Button>
        </div>

        {/* 平台徽章：可点击跳转到下载区对应平台卡片 */}
        <div className="mt-5 flex items-center justify-center gap-4 text-xs text-(--ox-text-muted)">
          <a
            href="/#download-windows"
            className="flex items-center gap-1 transition-colors hover:text-(--ox-accent)"
          >
            <Monitor className="h-3.5 w-3.5" /> Windows
          </a>
          <a
            href="/#download-macos"
            className="flex items-center gap-1 transition-colors hover:text-(--ox-accent)"
          >
            <Apple className="h-3.5 w-3.5" /> macOS
          </a>
          <a
            href="/#download-linux"
            className="flex items-center gap-1 transition-colors hover:text-(--ox-accent)"
          >
            <Terminal className="h-3.5 w-3.5" /> Linux
          </a>
        </div>

        {/* 产品截图 mock */}
        <div className="mx-auto mt-12 max-w-4xl">
          <DashboardMock />
        </div>
      </div>
    </section>
  );
}

/* ---------------- 三步上手 ---------------- */

function HowItWorksSection() {
  return (
    <section className="border-t py-16 sm:py-20" style={{ borderColor: "var(--ox-border)" }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="三步上手"
          title="从一行环境变量，到一目了然"
          desc="不装 SDK，不改代码，不碰 API Key。"
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Reveal delay={0}>
            <StepCard
              index={1}
              title="指向本地代理"
              desc="把模型工具的 API 地址指向应用内置代理，一行环境变量即可。"
            >
              <CopyCodeBlock code={LOCAL_PROXY_CMD} />
              <p className="mt-2 text-xs text-(--ox-text-muted)">
                端口可在应用设置中修改。本地代理即将推出；云代理现可用：
              </p>
              <CopyCodeBlock code={CLOUD_PROXY_CMD} />
            </StepCard>
          </Reveal>
          <Reveal delay={120}>
            <StepCard
              index={2}
              title="自动落账"
              desc="之后的每一次模型调用，Token 与成本自动记录，无需任何操作。"
            />
          </Reveal>
          <Reveal delay={240}>
            <StepCard
              index={3}
              title="打开仪表盘"
              desc="按时间、模型、项目、会话多维度查看，成本、异常一目了然。"
            />
          </Reveal>
        </div>

        {/* 数据流 */}
        <div
          className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-2 rounded-xl border px-5 py-4 text-sm"
          style={{ borderColor: "var(--ox-border)", backgroundColor: "var(--ox-bg-alt)" }}
        >
          <span className="text-(--ox-text-h)">你的模型工具</span>
          <ArrowRight className="h-4 w-4 text-(--ox-accent)" />
          <span className="text-(--ox-text-h)">本地代理</span>
          <ArrowRight className="h-4 w-4 text-(--ox-accent)" />
          <span className="text-(--ox-text-h)">自动落账</span>
          <ArrowRight className="h-4 w-4 text-(--ox-accent)" />
          <span className="text-(--ox-text-h)">仪表盘</span>
        </div>
      </div>
    </section>
  );
}

function StepCard({
  index,
  title,
  desc,
  children,
}: {
  index: number;
  title: string;
  desc: string;
  children?: ReactNode;
}) {
  return (
    <div
      className="flex h-full flex-col rounded-xl border p-6"
      style={{ borderColor: "var(--ox-border)", backgroundColor: "var(--ox-bg-alt)" }}
    >
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white"
        style={{ backgroundColor: "var(--ox-accent)" }}
      >
        {index}
      </span>
      <h3 className="mt-4 text-base font-semibold text-(--ox-text-h)">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-(--ox-text-muted)">{desc}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

/* ---------------- 特性 ---------------- */

const FEATURES: { icon: ReactNode; title: string; desc: string }[] = [
  {
    icon: <Code className="h-4 w-4" />,
    title: "零代码代理",
    desc: "不装 SDK、不改代码，改一行环境变量即接入；API Key 只转发不落库。",
  },
  {
    icon: <BarChart3 className="h-4 w-4" />,
    title: "多维统计",
    desc: "按时间、模型、项目、会话拆解用量与成本，从多角度看清 Token 花在哪。",
  },
  {
    icon: <FolderKanban className="h-4 w-4" />,
    title: "会话与项目",
    desc: "以项目和会话为轴心记录每笔调用，项目可引用本地文件夹（Cursor 式）。",
  },
  {
    icon: <BellRing className="h-4 w-4" />,
    title: "预算与告警",
    desc: "设定预算阈值，超限或异常消耗及时提醒，支持站内与邮件。",
  },
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    title: "本地部署 · 安全简洁",
    desc: "桌面应用数据全部存本地；自托管一条命令，数据不离开你的设备。",
  },
  {
    icon: <Terminal className="h-4 w-4" />,
    title: "国内模型适配",
    desc: "DeepSeek、Moonshot、智谱等开箱即用，内置 20+ 模型定价自动核算。",
  },
];

function FeaturesSection() {
  return (
    <section className="border-t py-16 sm:py-20" style={{ borderColor: "var(--ox-border)" }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="特性" title="为个人打造的 Token 记账本" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <div
                className="group flex h-full flex-col gap-3 rounded-xl border p-5 transition-colors hover:border-(--ox-accent)/50"
                style={{ borderColor: "var(--ox-border)" }}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg text-(--ox-accent)" style={{ backgroundColor: "color-mix(in srgb, var(--ox-accent) 10%, transparent)" }}>
                  {f.icon}
                </span>
                <h3 className="text-sm font-semibold text-(--ox-text-h)">{f.title}</h3>
                <p className="text-xs leading-5 text-(--ox-text-muted)">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- 下载 ---------------- */

const PLATFORMS = [
  {
    id: "download-windows",
    name: "Windows",
    icon: <Monitor className="h-5 w-5" />,
    methods: [
      { label: "安装包 (.exe)", hint: "日常使用，开始菜单/桌面快捷方式" },
      { label: "便携版 (.zip)", hint: "免安装，U 盘 / 绿色使用" },
    ],
  },
  {
    id: "download-macos",
    name: "macOS",
    icon: <Apple className="h-5 w-5" />,
    methods: [
      { label: ".dmg（Apple Silicon）", hint: "新款 M 系列 Mac" },
      { label: ".dmg（Intel）", hint: "老款 Intel Mac" },
    ],
  },
  {
    id: "download-linux",
    name: "Linux",
    icon: <Terminal className="h-5 w-5" />,
    methods: [
      { label: ".AppImage", hint: "通用发行版，免安装" },
      { label: ".deb", hint: "Debian / Ubuntu 包管理" },
      { label: ".rpm", hint: "Fedora / RHEL 包管理" },
    ],
  },
];

function DownloadSection() {
  return (
    <section
      id="download"
      className="border-t py-16 sm:py-20"
      style={{ borderColor: "var(--ox-border)" }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="下载"
          title="免费下载"
          desc="桌面应用正在开发中，发布后本站与 GitHub 提供下载；云平台现可用。"
        />

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
                  <span className="rounded-full border px-2 py-0.5 text-[10px] text-(--ox-text-muted)" style={{ borderColor: "var(--ox-border)" }}>
                    即将推出
                  </span>
                </div>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {p.methods.map((m) => (
                    <li
                      key={m.label}
                      className="flex items-start gap-2 rounded-lg border px-3 py-2"
                      style={{ borderColor: "var(--ox-border)", backgroundColor: "var(--ox-bg-alt)" }}
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-(--ox-accent)" />
                      <span className="text-xs">
                        <span className="block font-medium text-(--ox-text-h)">{m.label}</span>
                        <span className="text-(--ox-text-muted)">{m.hint}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <div
          className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border p-6 sm:flex-row"
          style={{ borderColor: "var(--ox-border)", backgroundColor: "var(--ox-bg-alt)" }}
        >
          <div>
            <h3 className="text-sm font-semibold text-(--ox-text-h)">等不及？先用云平台</h3>
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
      </div>
    </section>
  );
}

/* ---------------- 社区 ---------------- */

const PARTICIPATE = [
  {
    icon: <Code className="h-4 w-4" />,
    title: "贡献代码",
    desc: "Fork 仓库、提 Pull Request，一起把它打磨得更好。",
    href: `${GITHUB_URL}`,
  },
  {
    icon: <MessageSquare className="h-4 w-4" />,
    title: "提需求 / 报问题",
    desc: "遇到的问题、想要的功能，通过 Issues 或站内反馈告诉我们。",
    href: `${GITHUB_URL}/issues`,
  },
  {
    icon: <Users className="h-4 w-4" />,
    title: "讨论交流",
    desc: "分享用法与心得，写信给我们：receive@oxelia51.com。",
    href: "mailto:receive@oxelia51.com",
  },
];

function CommunitySection() {
  return (
    <section
      id="community"
      className="border-t py-16 sm:py-20"
      style={{ borderColor: "var(--ox-border)" }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="社区"
          title="开源 · 共建"
          desc="MIT 开源，欢迎每个人参与。"
        />

        <div className="mt-10">
          <CommunityStats />
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PARTICIPATE.map((p, i) => (
            <Reveal key={p.title} delay={i * 100}>
              <a
                href={p.href}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full flex-col gap-3 rounded-xl border p-5 transition-colors hover:border-(--ox-accent)/50"
                style={{ borderColor: "var(--ox-border)" }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-(--ox-accent)"
                  style={{ backgroundColor: "color-mix(in srgb, var(--ox-accent) 10%, transparent)" }}
                >
                  {p.icon}
                </span>
                <h3 className="text-sm font-semibold text-(--ox-text-h)">{p.title}</h3>
                <p className="text-xs leading-5 text-(--ox-text-muted)">{p.desc}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-xs text-(--ox-accent) opacity-0 transition-opacity group-hover:opacity-100">
                  前往 <ArrowRight className="h-3 w-3" />
                </span>
              </a>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild variant="outline">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              <Github className="mr-2 h-4 w-4" />
              前往 GitHub
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */

const FAQ_ITEMS: { q: string; a: ReactNode }[] = [
  {
    q: "需要注册才能用吗？",
    a: "不需要。桌面应用全功能本地使用；云平台浏览不受限。登录仅用于跨设备同步、云托管与管理员管理（同步正在开发中）。",
  },
  {
    q: "数据存在哪里？",
    a: "桌面应用的数据全部存在本地；使用云平台时数据存储在云端服务器。本地优先，数据由你掌控。",
  },
  {
    q: "需要 API Key 吗？",
    a: "不需要。只改代理地址即可，API Key 仍由你保管，请求只转发、不落库。",
  },
  {
    q: "支持哪些模型？",
    a: "Anthropic、OpenAI 以及 DeepSeek、Moonshot、智谱等国内模型，内置 20+ 模型定价表，成本自动换算。",
  },
  {
    q: "桌面应用什么时候发布？",
    a: "正在开发中，将支持 Windows / macOS / Linux 三平台。发布后在本站与 GitHub 提供下载。",
  },
  {
    q: "怎么自托管？",
    a: "一条 docker compose up -d 命令即可部署云平台，数据不离开你的服务器。",
  },
  {
    q: "和云平台是什么关系？",
    a: "本地为主，云平台是可选托管。用桌面应用或自托管，都可以；云平台为不想自己部署的用户提供在线体验。",
  },
  {
    q: "怎么反馈问题？",
    a: "通过站内反馈、邮箱 receive@oxelia51.com 或 GitHub Issues。",
  },
  {
    q: "跨设备同步什么时候有？",
    a: "正在规划中。登录账户后即可在多设备间同步数据（开发中）。",
  },
  {
    q: "看文档 / 下载需要登录吗？",
    a: "都不需要。文档、下载、社区全部匿名开放。",
  },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="border-t py-16 sm:py-20" style={{ borderColor: "var(--ox-border)" }}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading eyebrow="FAQ" title="常见问题" />
        <div className="mt-10 flex flex-col gap-2">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={i * 40}>
                <div
                  className="overflow-hidden rounded-xl border"
                  style={{ borderColor: "var(--ox-border)", backgroundColor: "var(--ox-bg-alt)" }}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-(--ox-text-h)"
                  >
                    {item.q}
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-(--ox-text-muted) transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t px-5 py-4 text-sm leading-6 text-(--ox-text-muted)" style={{ borderColor: "var(--ox-border)" }}>
                      {item.a}
                    </div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- 通用 ---------------- */

function SectionHeading({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <Reveal>
      <div className="text-center">
        <span className="text-xs font-semibold tracking-widest text-(--ox-accent) uppercase">
          {eyebrow}
        </span>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-(--ox-text-h) sm:text-3xl">
          {title}
        </h2>
        {desc && <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-(--ox-text-muted)">{desc}</p>}
      </div>
    </Reveal>
  );
}
