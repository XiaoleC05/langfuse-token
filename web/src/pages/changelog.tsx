import Head from "next/head";
import { SiteHeader } from "@/src/features/oxelia51/components/site/SiteHeader";
import { SiteFooter } from "@/src/features/oxelia51/components/site/SiteFooter";
import { Reveal } from "@/src/features/oxelia51/components/landing/Reveal";

/**
 * Oxelia51 独立更新日志页（/changelog）：版本发布记录。
 * 手工维护：正式版本发布后手动补充新卡片（GitHub Releases 为 CI 自动 commit
 * 噪声，不直接采用）。每条版本以卡片 + 滚动动画呈现。skipAppLayout，全匿名可访问。
 */

type Version = {
  tag: string;
  date: string;
  status?: "planned" | "released";
  summary: string;
  items: string[];
};

const VERSIONS: Version[] = [
  {
    tag: "v4.0",
    date: "2026-08-09",
    status: "released",
    summary: "本地优先的个人 Token 记账本（P1–P4 完成）",
    items: [
      "落地页重构：主入口改为免费下载，弱化登录注册",
      "文档站上线：/docs 使用手册",
      "配色统一为黑 / 白 / 心跳红",
      "个人工作台 /app：总览 / 供应商 / Agent / 分析 / 设置",
      "桌面应用（Tauri 2，Windows/macOS/Linux）：本地代理 + 六屏界面（总览/接入/供应商/Agent/告警/设置）+ 成本核算 + 预算告警",
      "多设备同步：桌面端登录平台账户后上传 / 下载本地账本，多设备按事件去重合并；/app 设置页可查看同步账本与管理同步密钥",
    ],
  },
  {
    tag: "v3.x",
    date: "2026-08",
    status: "released",
    summary: "云平台上线",
    items: [
      "代理网关 + 项目密钥鉴权 + 接入引导",
      "预算告警（站内/邮件）、成本核算（CNY/USD）",
      "管理台 8 Tab：总览/反馈/用户/系统/安全/工具/告警/设置",
      "全站去 Langfuse 化：遥测 opt-in、外链清理、IP 白名单三层修复",
    ],
  },
  {
    tag: "v2.x",
    date: "2026-07",
    status: "released",
    summary: "早期工具与在线工具精简",
    items: [
      "在线工具精简：移除多个旧工具，保留 DormGuard/SecretStore/SmartKB",
      "账号体系、邮箱验证、JWT 认证",
      "API 网关与工具注册机制",
    ],
  },
];

function VersionCard({ v, index }: { v: Version; index: number }) {
  return (
    <Reveal delay={index * 80}>
      <div
        className="rounded-xl border p-6"
        style={{ borderColor: "var(--ox-border)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="text-sm font-semibold text-(--ox-text-h)">
              {v.tag}
            </span>
            <span
              className={
                v.status === "planned"
                  ? "rounded-full bg-(--ox-accent)/10 px-2 py-0.5 text-[10px] font-medium text-(--ox-accent)"
                  : "rounded-full border px-2 py-0.5 text-[10px] text-(--ox-text-muted)"
              }
              style={v.status === "released" ? { borderColor: "var(--ox-border)" } : undefined}
            >
              {v.status === "planned" ? "规划中" : "已发布"}
            </span>
          </span>
          <span className="text-xs text-(--ox-text-muted)">{v.date}</span>
        </div>
        <p className="mt-3 text-sm font-medium text-(--ox-text-h)">{v.summary}</p>
        <ul className="mt-3 flex flex-col gap-1.5">
          {v.items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm leading-6 text-(--ox-text-muted)"
            >
              <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-(--ox-accent)" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

export default function ChangelogPage() {
  return (
    <>
      <Head>
        <title>更新日志 · Oxelia51</title>
        <meta
          name="description"
          content="Oxelia51 更新日志：各版本发布记录与规划路线。"
        />
      </Head>
      <div className="ox-site-page flex min-h-screen flex-col">
        <SiteHeader />
        <main className="grow">
          <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
            <Reveal>
              <h1 className="text-3xl font-bold tracking-tight text-(--ox-text-h) sm:text-4xl">
                更新日志
              </h1>
            </Reveal>

            <div className="mt-12 flex flex-col gap-4">
              {VERSIONS.map((v, i) => (
                <VersionCard key={v.tag} v={v} index={i} />
              ))}
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}

ChangelogPage.skipAppLayout = true;
