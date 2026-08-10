"use client";

import { useEffect, useState } from "react";
import { Apple, Download, Monitor, Terminal } from "lucide-react";

/**
 * 下载区：动态拉取 GitHub Releases 里的 v* 版本资产，渲染真实下载链接。
 * 尚无 v* 版本时各平台显示「即将推出」，不虚构下载项。
 */

type Asset = { name: string; browser_download_url: string };

type PlatformMethod = {
  key: string;
  label: string;
  hint: string;
  match: (name: string) => boolean;
};

const PLATFORMS: {
  id: string;
  name: string;
  icon: "windows" | "macos" | "linux";
  methods: PlatformMethod[];
}[] = [
  {
    id: "windows",
    name: "Windows",
    icon: "windows",
    methods: [
      { key: "installer", label: "安装包 (.exe)", hint: "日常使用，开始菜单/桌面快捷方式", match: (n) => n.endsWith(".exe") },
      { key: "portable", label: "便携版 (.zip)", hint: "免安装，U 盘 / 绿色使用", match: (n) => n.endsWith(".zip") },
    ],
  },
  {
    id: "macos",
    name: "macOS",
    icon: "macos",
    methods: [
      { key: "dmg", label: ".dmg", hint: "Apple Silicon / Intel 安装包", match: (n) => n.endsWith(".dmg") },
    ],
  },
  {
    id: "linux",
    name: "Linux",
    icon: "linux",
    methods: [
      { key: "appimage", label: ".AppImage", hint: "通用发行版，免安装", match: (n) => n.endsWith(".AppImage") },
      { key: "deb", label: ".deb", hint: "Debian / Ubuntu 包管理", match: (n) => n.endsWith(".deb") },
      { key: "rpm", label: ".rpm", hint: "Fedora / RHEL 包管理", match: (n) => n.endsWith(".rpm") },
    ],
  },
];

const ICONS = { windows: <Monitor className="h-5 w-5" />, macos: <Apple className="h-5 w-5" />, linux: <Terminal className="h-5 w-5" /> };

export function DownloadCard() {
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [latestTag, setLatestTag] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("https://api.github.com/repos/XiaoleC05/Oxelia51/releases?per_page=30")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((releases: { tag_name: string; assets: Asset[] }[]) => {
        if (cancelled) return;
        // 只认语义化版本（v*），自动 release-* 是 CI commit 噪声
        const rel = releases.find((x) => /^v?\d+\.\d+\.\d+$/.test(x.tag_name));
        if (!rel) return;
        setLatestTag(rel.tag_name);
        setAssets(rel.assets);
      })
      .catch(() => {
        if (!cancelled) setAssets([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mt-12 grid gap-4 md:grid-cols-3">
      {PLATFORMS.map((p) => {
        const hasRelease = assets !== null && latestTag !== null;
        return (
          <div
            key={p.id}
            id={p.id}
            className="scroll-mt-28 h-full rounded-xl border p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            style={{
              borderColor: "var(--ox-border)",
              backgroundColor: "var(--ox-bg)",
              boxShadow: "0 0 0 0 transparent",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-(--ox-text-h)">
                <span className="text-(--ox-accent)">{ICONS[p.icon]}</span>
                {p.name}
              </span>
              {hasRelease ? (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium text-(--ox-ok)"
                  style={{ backgroundColor: "color-mix(in srgb, var(--ox-ok) 12%, transparent)" }}
                >
                  v{latestTag?.replace(/^v/, "")}
                </span>
              ) : (
                <span
                  className="rounded-full border px-2 py-0.5 text-[10px] text-(--ox-text-muted)"
                  style={{ borderColor: "var(--ox-border)" }}
                >
                  {assets === null ? "检查中…" : "即将推出"}
                </span>
              )}
            </div>
            <ul className="mt-4 flex flex-col gap-2.5">
              {p.methods.map((m) => {
                const hit = hasRelease ? assets?.find((a) => m.match(a.name)) : undefined;
                return (
                  <li key={m.key}>
                    {hit ? (
                      <a
                        href={hit.browser_download_url}
                        download
                        className="group flex items-start gap-2 rounded-lg border px-3 py-2 transition-colors hover:border-(--ox-accent)/60"
                        style={{
                          borderColor: "var(--ox-border)",
                          backgroundColor: "var(--ox-bg-alt)",
                        }}
                      >
                        <Download className="mt-0.5 h-3.5 w-3.5 shrink-0 text-(--ox-accent)" />
                        <span className="text-xs">
                          <span className="block font-medium text-(--ox-text-h)">
                            {m.label}
                          </span>
                          <span className="text-(--ox-text-muted)">{hit.name}</span>
                        </span>
                      </a>
                    ) : (
                      <span
                        className="flex items-start gap-2 rounded-lg border px-3 py-2"
                        style={{
                          borderColor: "var(--ox-border)",
                          backgroundColor: "var(--ox-bg-alt)",
                        }}
                      >
                        <Download className="mt-0.5 h-3.5 w-3.5 shrink-0 text-(--ox-text-muted)/40" />
                        <span className="text-xs">
                          <span className="block font-medium text-(--ox-text-h)">
                            {m.label}
                          </span>
                          <span className="text-(--ox-text-muted)">{m.hint}</span>
                        </span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
