import { useState } from "react";
import { env } from "@/src/env.mjs";

/**
 * Oxelia51 加载图标：优先品牌 PNG，加载失败时内联 SVG 兜底
 * （SVG 零网络请求，保证加载界面图标永不缺失）。
 * 颜色继承 CSS 变量 --ox-accent，双主题自适应。
 */
function OxeliaLogo({ size = 42 }: { size?: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        <rect x="5" y="5" width="54" height="54" rx="16" fill="currentColor" opacity="0.13" />
        <circle cx="32" cy="32" r="14.5" stroke="currentColor" strokeWidth="5.5" fill="none" />
        <circle cx="32" cy="17.5" r="4" fill="currentColor" />
        <circle cx="46.5" cy="32" r="3" fill="currentColor" opacity="0.55" />
        <circle cx="17.5" cy="32" r="3" fill="currentColor" opacity="0.55" />
      </svg>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${env.NEXT_PUBLIC_BASE_PATH ?? ""}/icon-glyph-64.png`}
      width={size}
      height={size}
      alt="Oxelia51"
      onError={() => setFailed(true)}
    />
  );
}

export function Spinner(props: { message: string }) {
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-(--ox-accent) mx-auto w-fit motion-safe:animate-spin">
          <OxeliaLogo size={42} />
        </div>
        <h2 className="text-primary mt-5 text-center text-2xl leading-9 font-bold tracking-tight">
          {props.message}
          <span className="animate-pulse">…</span>
        </h2>
      </div>
    </div>
  );
}
