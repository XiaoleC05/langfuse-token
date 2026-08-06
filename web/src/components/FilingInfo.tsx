import { env } from "@/src/env.mjs";

type FilingInfoProps = {
  /** compact：备案单行（侧栏）；full：品牌与链接 + 备案两行（登录页/落地页/布局底部） */
  variant?: "compact" | "full";
};

/** Oxelia51 备案信息（全局页面底部，全站统一）。 */
export function FilingInfo({ variant = "compact" }: FilingInfoProps) {
  const basePath = env.NEXT_PUBLIC_BASE_PATH ?? "";
  const githubUrl = "https://github.com/XiaoleC05/Oxelia51";

  return (
    <div
      className={
        variant === "compact"
          ? "flex flex-wrap items-center justify-center gap-x-1.5 text-[11px] leading-4 text-muted-foreground group-data-[collapsible=icon]:hidden"
          : "flex flex-col items-center gap-1.5 text-center text-xs leading-4 text-muted-foreground group-data-[collapsible=icon]:hidden"
      }
    >
      {variant === "full" && (
        /* 行 1：品牌 + 链接 */
        <div className="flex flex-wrap items-center justify-center gap-x-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${basePath}/icon-glyph-64.png`}
            alt="Oxelia51"
            width={16}
            height={16}
            className="dark:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${basePath}/icon-glyph-64-dark.png`}
            alt="Oxelia51"
            width={16}
            height={16}
            className="hidden dark:block"
          />
          <span className="font-medium text-foreground">Oxelia51</span>
          <span>·</span>
          <a
            href="https://oxelia51.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            官网
          </a>
          <span>·</span>
          <a
            href="mailto:receive@oxelia51.com"
            className="hover:text-foreground"
          >
            反馈邮箱 receive@oxelia51.com
          </a>
          <span>·</span>
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground underline underline-offset-2"
          >
            GitHub
          </a>
        </div>
      )}

      {/* 备案（full 为行 2） */}
      <div className="flex flex-wrap items-center justify-center gap-x-1.5">
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noreferrer"
          className="hover:text-foreground"
        >
          鲁ICP备2026038838号-1
        </a>
        <span>·</span>
        <a
          href="https://beian.mps.gov.cn/#/query/webSearch?code=37028202001309"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 hover:text-foreground"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${basePath}/gongan.png`}
            alt=""
            width={variant === "compact" ? 10 : 12}
            height={variant === "compact" ? 10 : 12}
          />
          鲁公网安备37028202001309号
        </a>
      </div>
    </div>
  );
}
