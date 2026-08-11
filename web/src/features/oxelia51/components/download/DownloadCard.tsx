"use client";

import { useEffect, useState } from "react";
import { Apple, Download, Monitor, RotateCw, Terminal } from "lucide-react";
import { api } from "@/src/utils/api";

/**
 * 下载区：动态拉取 GitHub Releases 里的 v* 版本资产，渲染真实下载链接。
 * 尚无 v* 版本时各平台显示「即将推出」，不虚构下载项；
 * 拉取失败（限流/网络）显示「获取失败」+ 重试，不伪装成未发布。
 * 总下载量由服务端 siteStats.downloadStats 提供（GitHub 失败时为 null，不渲染）。
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
  /** GitHub 拉取失败（限流/网络）——与「尚无 v* 版本」区分，不伪装成未发布 */
  const [fetchFailed, setFetchFailed] = useState(false);
  /** 重试计数：自增触发 useEffect 重新拉取 */
  const [retryCount, setRetryCount] = useState(0);

  // 总下载量：服务端代理 GitHub（内存缓存 1h）；失败返回 null → 不渲染数字
  const statsQ = api.siteStats.downloadStats.useQuery(undefined, {
    staleTime: 5 * 60_000,
  });
  const stats = statsQ.data ?? null;

  useEffect(() => {
    let cancelled = false;
    setFetchFailed(false);
    fetch("https://api.github.com/repos/XiaoleC05/Oxelia51/releases?per_page=30")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((releases: { tag_name: string; assets: Asset[] }[]) => {
        if (cancelled) return;
        // 只认语义化版本（v*），自动 release-* 是 CI commit 噪声
        const rel = releases.find((x) => /^v?\d+\.\d+\.\d+$/.test(x.tag_name));
        if (!rel) {
          // 尚无正式发布版本：空资产 → 各平台显示「即将推出」
          setLatestTag(null);
          setAssets([]);
          return;
        }
        setLatestTag(rel.tag_name);
        setAssets(rel.assets);
      })
      .catch(() => {
        if (!cancelled) {
          setLatestTag(null);
          setAssets([]);
          setFetchFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  return (
    <>
      {/* 汇总行：总下载量（服务端数据，失败不渲染）或客户端拉取失败提示 */}
      <div className="mt-8 flex min-h-6 items-center justify-center gap-3 text-xs text-(--ox-text-muted)">
        {stats && (
          <span>
            累计下载 {stats.totalDownloads.toLocaleString("zh-CN")} 次
          </span>
        )}
        {fetchFailed && (
          <>
            <span style={{ color: "var(--ox-warn)" }}>
              发布信息获取失败，可能是 GitHub 访问受限
            </span>
            <button
              type="button"
              onClick={() => setRetryCount((c) => c + 1)}
              className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition-colors hover:border-(--ox-accent)/60 hover:text-(--ox-accent)"
              style={{ borderColor: "var(--ox-border)" }}
            >
              <RotateCw className="h-3 w-3" />
              重试
            </button>
          </>
        )}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
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
                  className="rounded-full px-2 py-0.5 text-xs font-medium text-(--ox-ok)"
                  style={{ backgroundColor: "color-mix(in srgb, var(--ox-ok) 12%, transparent)" }}
                >
                  v{latestTag?.replace(/^v/, "")}
                </span>
              ) : (
                <span
                  className="rounded-full border px-2 py-0.5 text-xs text-(--ox-text-muted)"
                  style={{ borderColor: "var(--ox-border)" }}
                >
                  {fetchFailed
                    ? "获取失败"
                    : assets === null
                      ? "检查中…"
                      : "即将推出"}
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
    </>
  );
}
