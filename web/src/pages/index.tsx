import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { OrganizationProjectOverview } from "@/src/features/organizations/components/ProjectOverview";
import { Spinner } from "@/src/components/layouts/spinner";

/**
 * Oxelia51：登录后落地页直达第一个项目首页（含欢迎引导），
 * 而不是停留在组织列表。组织列表仍可通过侧边栏「组织」访问。
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
