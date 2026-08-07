import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { OrganizationProjectOverview } from "@/src/features/organizations/components/ProjectOverview";
import { Spinner } from "@/src/components/layouts/spinner";
import { LandingPage } from "@/src/features/oxelia51/components/landing/LandingPage";

/**
 * Oxelia51：未登录访问 `/` 展示品牌落地页（useAuthGuard 已对根路径放行）；
 * 已登录用户直达第一个项目首页（含欢迎引导），而不是停留在组织列表。
 * 组织列表仍可通过侧边栏「组织」访问。
 */
export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const firstProject = session?.user?.organizations?.[0]?.projects?.[0];

  useEffect(() => {
    if (status === "authenticated" && firstProject) {
      void router.replace(`/project/${firstProject.id}`);
    }
  }, [status, firstProject, router]);

  // loading 或未登录：展示品牌落地页。
  // loading 也渲染落地页，使落地页首屏直接 SSR、匿名访客不闪 spinner；
  // 已登录用户会在短暂看到落地页后由 useEffect 重定向到项目。
  if (status === "loading" || status === "unauthenticated") {
    return <LandingPage />;
  }

  if (firstProject) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner message="正在进入项目" />
      </div>
    );
  }

  // 无项目时回退到组织列表（引导创建项目）
  return <OrganizationProjectOverview />;
}

// Oxelia51 v4：落地页为全宽品牌页，绕开 AppLayout 的应用外壳（主题/Session 仍由 _app 提供）。
// 未登录 → LandingPage；已登录 → 重定向首个项目，此处仅短暂停留。
Home.skipAppLayout = true;
