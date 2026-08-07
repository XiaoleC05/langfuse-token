import { type Flag } from "@/src/features/feature-flags/types";
import { type ProjectScope } from "@/src/features/rbac/constants/projectAccessRights";
import {
  BellRing,
  Database,
  LayoutDashboard,
  LifeBuoy,
  ListTree,
  type LucideIcon,
  Settings,
  UsersIcon,
  TerminalIcon,
  Lightbulb,
  Grid2X2,
  Sparkle,
  FileJson,
  Search,
  Home,
  SquarePercent,
  ClipboardPen,
  Clock,
  Beaker,
  BarChart3,
  Coins,
  Siren,
} from "lucide-react";
import { type ReactNode } from "react";
import { type Entitlement } from "@/src/features/entitlements/constants/entitlements";
import { type Session } from "next-auth";
import { type OrganizationScope } from "@/src/features/rbac/constants/organizationAccessRights";
// Oxelia51：「快速预览」(V4SidebarToggle) 与「更新」(V4MigrationNavItem) 入口已隐藏，
// 上游组件文件保留以减少合并冲突
import { SidebarMenuButton } from "@/src/components/ui/sidebar";
import { KeyboardShortcut } from "@/src/components/ui/keyboard-shortcut";
import { useCommandMenu } from "@/src/features/command-k-menu/CommandMenuProvider";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { type ProductModule } from "@/src/ee/features/ui-customization/productModuleSchema";

export enum RouteSection {
  Main = "main",
  Secondary = "secondary",
}

export enum RouteGroup {
  // Oxelia51：原「可观测性」收敛为「观测」，仅保留追踪/会话/用户
  Observability = "观测",
  PromptManagement = "提示词管理",
  Evaluation = "评估",
  TokenStats = "Token 统计",
  // Oxelia51：管理台已迁出业务侧栏（独立 /admin 区域），不再设导航分组
}

export type Route = {
  title: string;
  menuNode?: ReactNode;
  featureFlag?: Flag;
  label?: string | ReactNode;
  projectRbacScopes?: ProjectScope[]; // array treated as OR
  organizationRbacScope?: OrganizationScope;
  icon?: LucideIcon; // ignored for nested routes
  pathname: string; // link
  items?: Array<Route>; // folder
  section?: RouteSection; // which section of the sidebar (top/main/bottom)
  newTab?: boolean; // open in new tab
  entitlements?: Entitlement[]; // entitlements required, array treated as OR
  productModule?: ProductModule; // Product module this route belongs to. Used to show/hide modules via ui customization.
  show?: (p: {
    organization:
      | NonNullable<Session["user"]>["organizations"][number]
      | undefined;
    projectId: string | undefined;
    isLangfuseCloud: boolean;
    v4WriteMode: undefined | "legacy" | "dual" | "events_only"; // undefined until the session has loaded
  }) => boolean;
  group?: RouteGroup; // group this route belongs to (within a section)
  // Oxelia51：高级功能标记。标记的条目在侧栏收进默认折叠的「高级功能」组，
  // 路由本身不删除，随时可恢复。
  advanced?: boolean;
};

export const ROUTES: Route[] = [
  {
    title: "前往...",
    pathname: "", // Empty pathname since this is a dropdown
    icon: Search,
    menuNode: <CommandMenuTrigger />,
    section: RouteSection.Main,
  },
  {
    title: "组织",
    pathname: "/",
    icon: Grid2X2,
    show: ({ organization }) => organization === undefined,
    section: RouteSection.Main,
  },
  {
    title: "项目",
    pathname: "/organization/[organizationId]",
    icon: Grid2X2,
    section: RouteSection.Main,
  },
  {
    title: "首页",
    pathname: `/project/[projectId]`,
    icon: Home,
    section: RouteSection.Main,
  },
  {
    title: "仪表盘",
    pathname: `/project/[projectId]/dashboards`,
    icon: LayoutDashboard,
    productModule: "dashboards",
    section: RouteSection.Main,
  },
  {
    title: "Token 概览",
    pathname: `/project/[projectId]/dashboard/tokens`,
    icon: BarChart3,
    group: RouteGroup.TokenStats,
    section: RouteSection.Main,
  },
  {
    title: "成本分析",
    pathname: `/project/[projectId]/dashboard/cost`,
    icon: Coins,
    group: RouteGroup.TokenStats,
    section: RouteSection.Main,
  },
  {
    title: "追踪",
    icon: ListTree,
    productModule: "tracing",
    group: RouteGroup.Observability,
    section: RouteSection.Main,
    pathname: `/project/[projectId]/traces`,
  },
  {
    title: "会话",
    icon: Clock,
    productModule: "tracing",
    group: RouteGroup.Observability,
    section: RouteSection.Main,
    pathname: `/project/[projectId]/sessions`,
  },
  {
    title: "用户",
    pathname: `/project/[projectId]/users`,
    icon: UsersIcon,
    productModule: "tracing",
    group: RouteGroup.Observability,
    section: RouteSection.Main,
  },
  {
    // Oxelia51：告警设置是产品核心卖点之一，从 Token 统计组移出，提升为一级独立条目
    title: "告警设置",
    pathname: `/project/[projectId]/settings/alerts`,
    icon: Siren,
    section: RouteSection.Main,
  },
  {
    title: "提示词",
    pathname: "/project/[projectId]/prompts",
    icon: FileJson,
    projectRbacScopes: ["prompts:read"],
    productModule: "prompt-management",
    group: RouteGroup.PromptManagement,
    section: RouteSection.Main,
    advanced: true,
  },
  {
    title: "演练场",
    pathname: "/project/[projectId]/playground",
    icon: TerminalIcon,
    productModule: "playground",
    group: RouteGroup.PromptManagement,
    section: RouteSection.Main,
    advanced: true,
  },
  {
    title: "评分",
    pathname: `/project/[projectId]/scores`,
    group: RouteGroup.Evaluation,
    section: RouteSection.Main,
    icon: SquarePercent,
    advanced: true,
  },
  {
    title: "评估器",
    icon: Lightbulb,
    productModule: "evaluation",
    projectRbacScopes: ["evalJob:read"],
    group: RouteGroup.Evaluation,
    section: RouteSection.Main,
    pathname: `/project/[projectId]/evals`,
    advanced: true,
  },
  {
    title: "人工标注",
    pathname: `/project/[projectId]/annotation-queues`,
    projectRbacScopes: ["annotationQueues:read"],
    group: RouteGroup.Evaluation,
    section: RouteSection.Main,
    icon: ClipboardPen,
    advanced: true,
  },
  {
    title: "数据集",
    pathname: `/project/[projectId]/datasets`,
    icon: Database,
    productModule: "datasets",
    projectRbacScopes: ["datasets:read"],
    group: RouteGroup.Evaluation,
    section: RouteSection.Main,
    advanced: true,
  },
  {
    title: "实验",
    pathname: `/project/[projectId]/experiments`,
    icon: Beaker,
    featureFlag: "experimentsV4Enabled",
    group: RouteGroup.Evaluation,
    section: RouteSection.Main,
    advanced: true,
  },
  {
    title: "监控",
    pathname: "/project/[projectId]/monitors",
    icon: BellRing,
    projectRbacScopes: ["monitors:read"],
    show: ({ v4WriteMode }) => Boolean(v4WriteMode) && v4WriteMode !== "legacy",
    group: RouteGroup.Observability,
    section: RouteSection.Main,
    advanced: true,
  },
  {
    title: "升级套餐",
    icon: Sparkle,
    pathname: "/project/[projectId]/settings/billing",
    section: RouteSection.Secondary,
    entitlements: ["cloud-billing"],
    organizationRbacScope: "langfuseCloudBilling:CRUD",
    show: ({ organization }) => organization?.plan === "cloud:hobby",
  },
  {
    title: "升级套餐",
    icon: Sparkle,
    pathname: "/organization/[organizationId]/settings/billing",
    section: RouteSection.Secondary,
    entitlements: ["cloud-billing"],
    organizationRbacScope: "langfuseCloudBilling:CRUD",
    show: ({ organization }) => organization?.plan === "cloud:hobby",
  },
  {
    title: "设置",
    pathname: "/project/[projectId]/settings",
    icon: Settings,
    section: RouteSection.Secondary,
    // Oxelia51：项目设置仅在项目上下文显示，避免与组织设置重复
    show: ({ projectId }) => projectId !== undefined,
  },
  {
    title: "设置",
    pathname: "/organization/[organizationId]/settings",
    icon: Settings,
    section: RouteSection.Secondary,
    // 组织设置仅在组织上下文显示
    show: ({ organization }) => organization !== undefined,
  },
];

function CommandMenuTrigger() {
  const { setOpen } = useCommandMenu();
  const capture = usePostHogClientCapture();

  return (
    <SidebarMenuButton
      onClick={() => {
        capture("cmd_k_menu:opened", {
          source: "main_navigation",
        });
        setOpen(true);
      }}
      className="whitespace-nowrap"
    >
      <Search className="h-4 w-4" />
      前往...
      <KeyboardShortcut
        className="ml-auto"
        keys={[navigator.userAgent.includes("Mac") ? "⌘" : "Ctrl", "K"]}
      />
    </SidebarMenuButton>
  );
}
