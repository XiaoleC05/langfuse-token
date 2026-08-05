import { env } from "@/src/env.mjs";

type FilingInfoProps = {
  /** compact：备案 + GitHub 单行（侧栏）；full：备案 + Powered by + GitHub（登录页/管理页） */
  variant?: "compact" | "full";
};

/** Oxelia51 备案信息 + 开源声明（全局页面底部，全站统一）。 */
export function FilingInfo({ variant = "compact" }: FilingInfoProps) {
  const basePath = env.NEXT_PUBLIC_BASE_PATH ?? "";
  const githubUrl = "https://github.com/XiaoleC05/Oxelia51";

  return (
    <div
      className={
        variant === "compact"
          ? "flex flex-wrap items-center justify-center gap-x-1.5 text-[11px] leading-4 text-muted-foreground group-data-[collapsible=icon]:hidden"
          : "flex flex-col items-center gap-1 text-center text-xs leading-4 text-muted-foreground group-data-[collapsible=icon]:hidden"
      }
    >
      {/* 备案 */}
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

      {/* Powered by + GitHub（full 才显示） */}
      {variant === "full" && (
        <div className="flex flex-wrap items-center justify-center gap-x-1.5">
          <span>
            Powered by{" "}
            <a
              href="https://github.com/langfuse/langfuse"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground underline underline-offset-2"
            >
              Langfuse
            </a>
          </span>
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
    </div>
  );
}
