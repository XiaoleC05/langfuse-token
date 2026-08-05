import Image from "next/image";
import { useState } from "react";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/utils/tailwind";

import filterSearchBarDarkIllustration from "../assets/filter-search-bar-dark.svg";
import filterSearchBarLightIllustration from "../assets/filter-search-bar-light.svg";
import modernSessionDarkIllustration from "../assets/modern-session-dark.svg";
import modernSessionLightIllustration from "../assets/modern-session-light.svg";

/** Flags the Feature Preview modal can toggle. Keep in sync with the
 *  userAccount.setFeaturePreviewEnabled allowlist and available-flags.ts.
 *  `searchBar` is retired and no longer renders a tile — see
 *  ControlledFeaturePreviewModal. It remains as rollback plumbing.
 *  TODO(remove ~2026-06-19): drop "searchBar" once GA is confirmed. */
export type PreviewFlag = "modernSession" | "searchBar";

type PreviewIllustration = {
  light: React.ComponentProps<typeof Image>["src"];
  dark: React.ComponentProps<typeof Image>["src"];
  alt: string;
};

type PreviewRegistryItem = {
  flag: PreviewFlag;
  title: string;
  sidebarLabel: string;
  description: string;
  details: string;
  feedbackUrl: string;
  illustration: PreviewIllustration;
};

/** Per-preview dynamic state, supplied by ControlledFeaturePreviewModal (which
 *  owns the session + the toggle mutation). The static content lives here. */
export type PreviewState = {
  enabled: boolean;
  disabled?: boolean;
  warningReason?: string;
  onToggle: (enabled: boolean) => void;
  isToggling?: boolean;
};

// Static registry — one entry per preview. Order = sidebar order; each
// preview ships separate light/dark illustrations.
const PREVIEW_REGISTRY: PreviewRegistryItem[] = [
  {
    flag: "modernSession",
    title: "紧凑会话视图",
    sidebarLabel: "紧凑会话视图",
    description:
      "在一个连续的会话对话流中浏览会话内的所有追踪，并按需查看工具调用和结构化数据。",
    details:
      "紧凑会话视图以紧凑的缩略图和虚拟化列表取代独立的追踪卡片。您可以在追踪之间跳转、保持当前追踪可见，或临时显示内联的工具调用和系统提示词。",
    feedbackUrl: "https://github.com/orgs/langfuse/discussions",
    illustration: {
      light: modernSessionLightIllustration,
      dark: modernSessionDarkIllustration,
      alt: "紧凑会话视图：在连续的会话对话流旁显示追踪缩略图。",
    },
  },
  // TODO(remove ~2026-06-19): dead registry entry — "searchBar" is GA on the v4
  // events tables and no longer surfaced in the dialog (no state entry in
  // ControlledFeaturePreviewModal), so this is filtered out and never renders.
  // Kept for a safe rollback; delete with the rest of the searchBar plumbing.
  {
    flag: "searchBar",
    title: "筛选搜索栏",
    sidebarLabel: "筛选搜索栏",
    description:
      "观测表和追踪表上的键盘驱动查询栏——可输入类似 level:ERROR -env:dev latency:>2 的筛选条件并获得内联建议，与现有筛选侧边栏并存。",
    details:
      "搜索栏让您通过输入带自动补全的简洁查询语言来构建和编辑筛选条件，而无需在侧边栏中逐项点击。它与侧边栏保持同步（两者读写同一套筛选状态），并支持字段筛选、比较、任意组合分组、取反、元数据/评分路径以及跨输入/输出的全文搜索。该功能在新版（v4）观测表和追踪表上可用。",
    feedbackUrl: "https://github.com/orgs/langfuse/discussions/14196",
    illustration: {
      light: filterSearchBarLightIllustration,
      dark: filterSearchBarDarkIllustration,
      alt: "筛选搜索栏将 level:ERROR -env:dev 之类的输入查询转换为观测表和追踪表的筛选条件，并提供内联建议。",
    },
  },
];

const FEATURE_PREVIEW_MODAL_TITLE = "功能预览";
const FEATURE_PREVIEW_MODAL_SUBTITLE =
  "在正式发布前体验即将推出和实验性的产品功能。";

export type FeaturePreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dynamic state per preview flag. Only previews with an entry here render. */
  state: Partial<Record<PreviewFlag, PreviewState>>;
};

export function FeaturePreviewModal({
  open,
  onOpenChange,
  state,
}: FeaturePreviewModalProps) {
  const items = PREVIEW_REGISTRY.filter((item) => state[item.flag]);
  const [selectedFlag, setSelectedFlag] = useState<PreviewFlag | null>(
    items[0]?.flag ?? null,
  );
  // A removed preview falls back without synchronizing derived props into state.
  const selected = items.find((i) => i.flag === selectedFlag) ?? items[0];
  const selectedState = selected ? state[selected.flag] : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        closeOnInteractionOutside
        overlayMode="blocking"
        className="border-border bg-background text-foreground max-h-[88vh] p-0 shadow-2xl sm:rounded-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg font-bold">
            {FEATURE_PREVIEW_MODAL_TITLE}
          </DialogTitle>
          <DialogDescription className="mt-0">
            {FEATURE_PREVIEW_MODAL_SUBTITLE}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="grid min-h-0 gap-0 overflow-hidden p-0 md:grid-cols-[220px_1fr]">
          <aside className="border-border bg-muted/20 border-b p-3 md:border-r md:border-b-0">
            <div className="flex gap-2 overflow-x-auto md:flex-col md:overflow-x-visible">
              {items.map((item) => {
                const isSelected = item.flag === selected?.flag;
                return (
                  <button
                    key={item.flag}
                    type="button"
                    onClick={() => setSelectedFlag(item.flag)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex min-w-48 items-start rounded-md border px-3 py-3 text-left transition-colors md:min-w-0",
                      isSelected
                        ? "bg-muted text-foreground border-transparent"
                        : "text-muted-foreground hover:bg-muted/50 border-transparent",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">
                        {item.sidebarLabel}
                      </span>
                      <span className="text-muted-foreground mt-1 line-clamp-2 block text-xs">
                        {state[item.flag]?.disabled
                          ? "不可用"
                          : state[item.flag]?.enabled
                            ? "已启用"
                            : "可用"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="bg-background min-h-0 overflow-y-auto p-6">
            {selected && selectedState ? (
              <>
                {selectedState.warningReason ? (
                  <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-800 dark:text-yellow-200">
                    {selectedState.warningReason}
                  </div>
                ) : null}

                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h2 className="text-foreground text-xl font-bold">
                      {selected.title}
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-5">
                      {selected.description}
                    </p>
                    <Button asChild className="mt-4">
                      <a
                        href={selected.feedbackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        提供反馈
                      </a>
                    </Button>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Switch
                      checked={selectedState.enabled}
                      disabled={
                        selectedState.disabled === true ||
                        selectedState.isToggling === true
                      }
                      onCheckedChange={selectedState.onToggle}
                      aria-label={`切换 ${selected.title}`}
                    />
                  </div>
                </div>

                <PreviewMockupPanel illustration={selected.illustration} />

                <p className="text-muted-foreground mt-5 text-sm leading-5">
                  {selected.details}
                </p>
              </>
            ) : null}
          </section>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function PreviewMockupPanel({
  illustration,
}: {
  illustration: PreviewIllustration;
}) {
  return (
    <div className="border-border bg-muted/30 mt-6 overflow-hidden rounded-2xl border shadow-inner">
      <Image
        src={illustration.light}
        alt={illustration.alt}
        className="block h-auto w-full dark:hidden"
      />
      <Image
        src={illustration.dark}
        alt={illustration.alt}
        className="hidden h-auto w-full dark:block"
      />
    </div>
  );
}
