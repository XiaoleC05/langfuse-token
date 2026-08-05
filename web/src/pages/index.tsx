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

  // 未登录：品牌落地页
  if (status === "unauthenticated") {
    return <LandingPage />;
  }

  if (status === "loading" || firstProject) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner message="正在进入项目" />
      </div>
    );
  }

  // 无项目时回退到组织列表（引导创建项目）
  return <OrganizationProjectOverview />;
}
