import { env } from "@/src/env.mjs";

/** Oxelia51 备案信息 + 开源声明（全局页面底部）。 */
export function FilingInfo() {
  const basePath = env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <div className="flex flex-col items-center gap-1 text-center text-[10px] leading-4 text-muted-foreground group-data-[collapsible=icon]:hidden">
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
          <img src={`${basePath}/gongan.png`} alt="" width={12} height={12} />
          鲁公网安备37028202001309号
        </a>
      </div>
      <div>基于 Langfuse (MIT) 二次开发 · Powered by Langfuse</div>
    </div>
  );
}
