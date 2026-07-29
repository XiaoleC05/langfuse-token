import { Html, Head, Main, NextScript } from "next/document";

import { LAYER_ORDER } from "@/src/components/ui/layer";

// The app renders inside #__next (<Main />), which is isolated into its own
// stacking context (globals.css). The overlay layer containers are declared
// here as <body> siblings AFTER #__next, so they paint above the whole app by
// DOM order — no z-index needed. They are static HTML (present at SSR), ordered
// by LAYER_ORDER (later = on top); <Layer> (components/ui/layer.tsx) finds its
// container and portals into it. Styling lives in globals.css.
export default function Document() {
  return (
    // lang is set explicitly (not left to the i18n config, which is being
    // phased out in App Router) so screen readers always get the document
    // language — WCAG 2.1 SC 3.1.1.
    // next-themes mutates class/style on <html> before hydration; suppress the
    // expected mismatch one level deep (React 19 logs it and can re-render).
    <Html lang="zh-CN" suppressHydrationWarning>
      <Head>
        {/* Oxelia51 双主题防闪烁：首帧渲染前从 localStorage 恢复 data-theme，
            与 theming/oxelia51-theme.ts 的存储键保持一致。 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.dataset.theme=localStorage.getItem("oxelia51-theme")==="cosmos"?"cosmos":"cozy"}catch(e){document.documentElement.dataset.theme="cozy"}`,
          }}
        />
      </Head>
      <body>
        <Main />
        <div data-overlay-root>
          {LAYER_ORDER.map((name) => (
            <div key={name} data-layer={name} />
          ))}
        </div>
        <NextScript />
      </body>
    </Html>
  );
}
