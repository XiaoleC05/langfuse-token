import { getServerSession } from "next-auth";

import { getAuthOptions } from "@/src/server/auth";
import { isProjectMemberOrAdmin } from "@/src/server/utils/checkProjectMembershipOrAdmin";
import { ForbiddenError, UnauthorizedError } from "@langfuse/shared";
import { hasProjectAccess } from "../../rbac/utils/checkProjectAccess";

export type AuthorizeRequestResult = {
  userId: string;
};

export const authorizeRequestOrThrow = async (
  projectId: string,
): Promise<AuthorizeRequestResult> => {
  const authOptions = await getAuthOptions();
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new UnauthorizedError("未登录");

  if (!isProjectMemberOrAdmin(session.user, projectId))
    throw new ForbiddenError("用户不是该项目的成员");

  if (!hasProjectAccess({ session, projectId, scope: "playground:execute" }))
    throw new ForbiddenError("权限不足，无法使用试验场。");

  return { userId: session.user.id };
};
