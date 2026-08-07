"use client";

import { env } from "@/src/env.mjs";

/**
 * Oxelia51 站点 logo：伴星图标 + 「oxelia51」字标。
 * 字标独立使用大尺寸 wordart，保证「oxelia51」清晰可读（用户要求 logo 不能太小）。
 * 浅色主题用黑字（wordart-black），深色主题用白字（wordart-white）。
 */
export function SiteLogo({
  height = 26,
  glyphSize = 24,
}: {
  /** 字标「oxelia51」高度（px） */
  height?: number;
  /** 伴星图标尺寸（px） */
  glyphSize?: number;
}) {
  const basePath = env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <span className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${basePath}/icon-glyph-64.png`}
        alt=""
        width={glyphSize}
        height={glyphSize}
        className="shrink-0 dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${basePath}/icon-glyph-64-dark.png`}
        alt=""
        width={glyphSize}
        height={glyphSize}
        className="hidden shrink-0 dark:block"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${basePath}/wordart-black.svg`}
        alt="oxelia51"
        style={{ height }}
        className="dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${basePath}/wordart-white.svg`}
        alt="oxelia51"
        style={{ height }}
        className="hidden dark:block"
      />
    </span>
  );
}
