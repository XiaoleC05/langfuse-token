import { type GetServerSideProps } from "next";

/**
 * 旧后台管理页（/project/[projectId]/admin）已迁移至独立管理台 /admin。
 * 保留本文件做重定向，避免旧书签 404。
 */
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: "/admin", permanent: false },
});

export default function LegacyAdminRedirect() {
  return null;
}
