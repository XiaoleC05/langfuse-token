import Head from "next/head";
import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, BellRing, Code } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { FilingInfo } from "@/src/components/FilingInfo";
import { env } from "@/src/env.mjs";
import { CopyCodeBlock } from "@/src/features/oxelia51/components/landing/CopyCodeBlock";

/**
 * Oxelia51 品牌落地页：未登录访问 `/` 时展示（useAuthGuard 对根路径放行）。
 * 单屏滚动：Hero → 三步上手 → 特性 → Footer。取色一律走 --ox-* 变量。
 */
export function LandingPage() {
  return (
    <>
      <Head>
        <title>Oxelia51 | Token 消耗统计平台</title>
        <meta
          name="description"
          content="Oxelia51 是模型 API 的代理与统计平台：改一行环境变量，Token 消耗、成本与异常一目了然。"
        />
      </Head>
      <div className="mx-auto flex max-w-4xl flex-col">
        <HeroSection />
        <StepsSection />
        <FeaturesSection />
        <LandingFooter />
      </div>
    </>
  );
}

/** 竖版品牌 logo：浅底用深色版，深底（dark）用浅色版。透明背景，适配各主题底色预设。 */
function StackedBrandLogo() {
  const basePath = env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${basePath}/logo-stacked-light.svg`}
        alt="Oxelia51"
        className="h-36 w-auto dark:hidden sm:h-44"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${basePath}/logo-stacked-dark.svg`}
        alt="Oxelia51"
        className="hidden h-36 w-auto dark:block sm:h-44"
      />
    </>
  );
}

function HeroSection() {
  return (
    <section className="flex flex-col items-center pt-14 pb-12 text-center sm:pt-20">
      <StackedBrandLogo />
      <h1 className="mt-8 max-w-2xl text-2xl leading-snug font-bold tracking-tight text-(--ox-text-h) sm:text-3xl">
        改一行环境变量，Token 消耗一目了然
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-(--ox-text-muted) sm:text-base">
        Oxelia51 是模型 API 的代理与统计平台。请求照常发出，用量、成本与异常自动落账。
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Button asChild size="lg">
          <Link href="/auth/sign-up">开始使用</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/auth/sign-in">登录</Link>
        </Button>
      </div>
    </section>
  );
}

const STEPS: { title: string; desc: ReactNode }[] = [
  {
    title: "复制代理地址",
    desc: "注册并创建项目后，复制与你的模型服务商对应的代理地址。",
  },
  {
    title: "改一行环境变量",
    desc: (
      <>
        <span className="mb-2 block">
          在你的 AI 工具里把 API 地址指向代理，其余配置不变。
        </span>
        <span className="flex flex-col gap-2">
          <CopyCodeBlock code='export ANTHROPIC_BASE_URL="https://oxelia51.com/api/proxy/anthropic"' />
          <CopyCodeBlock code='export OPENAI_BASE_URL="https://oxelia51.com/api/proxy/openai"' />
        </span>
      </>
    ),
  },
  {
    title: "打开仪表盘看统计",
    desc: "Token 用量、模型成本与告警状态，在仪表盘即时可见。",
  },
];

function StepsSection() {
  return (
    <section className="border-t border-(--ox-border) py-12">
      <h2 className="text-center text-lg font-semibold text-(--ox-text-h)">
        三步上手
      </h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <div key={step.title} className="flex flex-col">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-(--ox-accent-border) text-xs font-semibold text-(--ox-accent)">
              {index + 1}
            </span>
            <h3 className="mt-3 text-sm font-medium text-(--ox-text-h)">
              {step.title}
            </h3>
            <div className="mt-2 text-xs leading-5 text-(--ox-text-muted)">
              {step.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: <Code className="h-4 w-4" />,
    title: "代理接入零侵入",
    desc: "只改环境变量，不改业务代码；请求经代理转发，密钥仍由你保管。",
  },
  {
    icon: <BarChart3 className="h-4 w-4" />,
    title: "多维 Token 统计",
    desc: "按模型、用户、会话拆解用量与成本，支持 CNY/USD 查看。",
  },
  {
    icon: <BellRing className="h-4 w-4" />,
    title: "预算与异常告警",
    desc: "设定预算阈值，异常消耗通过邮件及时提醒。",
  },
];

function FeaturesSection() {
  return (
    <section className="border-t border-(--ox-border) py-12">
      <div className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col gap-2 rounded-lg border border-(--ox-border) bg-(--ox-bg-alt) p-5"
          >
            <span className="text-(--ox-accent)">{feature.icon}</span>
            <h3 className="text-sm font-medium text-(--ox-text-h)">
              {feature.title}
            </h3>
            <p className="text-xs leading-5 text-(--ox-text-muted)">
              {feature.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="flex flex-col items-center gap-4 border-t border-(--ox-border) py-10">
      <div className="flex items-center gap-4 text-xs text-(--ox-text-muted)">
        <a
          href="https://oxelia51.com"
          target="_blank"
          rel="noreferrer"
          className="hover:text-(--ox-text-h)"
        >
          官网
        </a>
        <span>·</span>
        <a
          href="mailto:receive@oxelia51.com"
          className="hover:text-(--ox-text-h)"
        >
          反馈邮箱 receive@oxelia51.com
        </a>
      </div>
      <FilingInfo variant="full" />
    </footer>
  );
}
