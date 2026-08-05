"use client";
import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/src/components/ui/sidebar";
import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { type RouteGroup } from "@/src/components/layouts/routes";
import { cn } from "@/src/utils/tailwind";

export type NavMainItem = {
  title: string;
  menuNode?: ReactNode;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  label?: string | ReactNode;
  newTab?: boolean;
  group?: RouteGroup;
  /** Oxelia51：高级功能条目，渲染时收进默认折叠的「高级功能」组 */
  advanced?: boolean;
  items?: {
    title: string;
    url: string;
    isActive?: boolean;
    newTab?: boolean;
  }[];
};

function NavItemContent({ item }: { item: NavMainItem }) {
  return (
    <>
      {item.icon && <item.icon />}
      <span>{item.title}</span>
      {item.label &&
        (typeof item.label === "string" ? (
          <span className="-my-0.5 self-center rounded-sm border px-1 py-0.5 text-xs leading-none break-keep whitespace-nowrap">
            {item.label}
          </span>
        ) : (
          // ReactNode
          item.label
        ))}
    </>
  );
}

function NavItem({ item }: { item: NavMainItem }) {
  return (
    <SidebarMenuItem>
      {item.menuNode || (
        <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
          <Link href={item.url} target={item.newTab ? "_blank" : undefined}>
            <NavItemContent item={item} />
          </Link>
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );
}

/**
 * 渲染块：连续的无分组条目合成一个块，同名分组连续出现合成一个分组块，
 * 首个高级功能条目的位置插入「高级功能」折叠组。
 * 顺序完全由 ROUTES 声明顺序（flattened）驱动。
 */
type NavBlock =
  | { kind: "items"; items: NavMainItem[] }
  | { kind: "group"; group: RouteGroup; items: NavMainItem[] }
  | { kind: "advanced" };

function buildNavBlocks(flattened: NavMainItem[]): NavBlock[] {
  const blocks: NavBlock[] = [];
  let advancedEmitted = false;

  for (const item of flattened) {
    if (item.advanced) {
      if (!advancedEmitted) {
        blocks.push({ kind: "advanced" });
        advancedEmitted = true;
      }
      continue;
    }
    const last = blocks[blocks.length - 1];
    if (item.group) {
      if (last?.kind === "group" && last.group === item.group) {
        last.items.push(item);
      } else {
        blocks.push({ kind: "group", group: item.group, items: [item] });
      }
    } else {
      if (last?.kind === "items") {
        last.items.push(item);
      } else {
        blocks.push({ kind: "items", items: [item] });
      }
    }
  }

  return blocks;
}

/* Oxelia51：「高级功能」折叠状态持久化。
   与 theming/oxelia51-theme.ts 相同的 useSyncExternalStore + 自定义事件模式，
   SSR 快照固定为折叠，避免水合不一致。 */
const ADVANCED_NAV_STORAGE_KEY = "oxelia51-nav-advanced-open";
const ADVANCED_NAV_EVENT = "oxelia51-nav-advanced-change";

function getAdvancedNavOpen(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ADVANCED_NAV_STORAGE_KEY) === "true";
}

function subscribeAdvancedNav(callback: () => void) {
  window.addEventListener(ADVANCED_NAV_EVENT, callback);
  return () => window.removeEventListener(ADVANCED_NAV_EVENT, callback);
}

/** 「高级功能」折叠组：组内按条目原属 RouteGroup 再分小节展示。 */
function AdvancedNavGroup({ items }: { items: NavMainItem[] }) {
  const open = useSyncExternalStore(
    subscribeAdvancedNav,
    getAdvancedNavOpen,
    () => false,
  );
  // 侧栏图标折叠态下分组标签不可见，高级条目直接以图标呈现
  const { state } = useSidebar();
  const showItems = open || state === "collapsed";

  const toggle = () => {
    window.localStorage.setItem(ADVANCED_NAV_STORAGE_KEY, String(!open));
    window.dispatchEvent(new Event(ADVANCED_NAV_EVENT));
  };

  const subgroups: { label: string; items: NavMainItem[] }[] = [];
  for (const item of items) {
    const label = item.group ?? "";
    const last = subgroups[subgroups.length - 1];
    if (last && last.label === label) {
      last.items.push(item);
    } else {
      subgroups.push({ label, items: [item] });
    }
  }

  const hasActiveChild = items.some((item) => item.isActive);

  return (
    <SidebarGroup>
      <SidebarGroupLabel asChild>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="w-full cursor-pointer justify-between hover:text-sidebar-foreground"
        >
          <span className="flex items-center gap-1.5">
            高级功能
            {hasActiveChild && !open && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-(--ox-accent)"
                aria-hidden
              />
            )}
          </span>
          <ChevronRight
            className={cn(
              "transition-transform duration-200",
              open && "rotate-90",
            )}
          />
        </button>
      </SidebarGroupLabel>
      {showItems && (
        <SidebarGroupContent>
          {subgroups.map((sub) => (
            <div key={sub.label}>
              {sub.label && (
                <div className="text-muted-foreground px-[9px] pt-1 pb-0.5 text-[11px] group-data-[collapsible=icon]:hidden">
                  {sub.label}
                </div>
              )}
              <SidebarMenu>
                {sub.items.map((item) => (
                  <NavItem key={item.title} item={item} />
                ))}
              </SidebarMenu>
            </div>
          ))}
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
}

export function NavMain({
  items,
}: {
  items: {
    grouped: Partial<Record<RouteGroup, NavMainItem[]>> | null;
    ungrouped: NavMainItem[];
    flattened: NavMainItem[];
  };
}) {
  const blocks = buildNavBlocks(items.flattened);
  const advancedItems = items.flattened.filter((item) => item.advanced);

  return (
    <>
      {blocks.map((block) => {
        switch (block.kind) {
          case "items":
            return (
              <SidebarGroup key={`items:${block.items[0]?.title ?? ""}`}>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {block.items.map((item) => (
                      <NavItem key={item.title} item={item} />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          case "group":
            return (
              <SidebarGroup key={block.group}>
                <SidebarGroupLabel>{block.group}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {block.items.map((item) => (
                      <NavItem key={item.title} item={item} />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          case "advanced":
            return <AdvancedNavGroup key="advanced" items={advancedItems} />;
        }
      })}
    </>
  );
}
