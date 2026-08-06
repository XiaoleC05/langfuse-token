import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Role } from "@langfuse/shared/src/db";
import {
  createTRPCRouter,
  protectedProjectProcedure,
} from "@/src/server/api/trpc";
import { goFetch } from "@/src/features/oxelia51/server/goClient";

/** 代理网关项目密钥（Go 后端 proxy_keys 表，服务端 admin JWT 代理）。 */

const projectIdInput = z.object({ projectId: z.string() });

/** 密钥管理（生成明文网关密钥/删除）仅限项目 OWNER/ADMIN，viewer/member 无权变更。 */
function requireKeyManagerRole(role?: string) {
  if (role !== Role.OWNER && role !== Role.ADMIN) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "仅项目管理员（Owner/Admin）可管理代理网关密钥",
    });
  }
}

export type ProxyKeyItem = {
  id: number;
  projectId: string;
  keyPrefix: string;
  enabled: boolean;
  createdAt: string;
  lastUsedAt?: string | null;
};

export const proxyKeyRouter = createTRPCRouter({
  list: protectedProjectProcedure
    .input(projectIdInput)
    .query(async ({ input }) => {
      const res = await goFetch(
        `/api/admin/proxy-keys?project_id=${encodeURIComponent(input.projectId)}`,
        "GET",
      );
      return res as { items: ProxyKeyItem[] };
    }),

  /** 生成密钥：返回含明文 key（仅此一次）。仅 Owner/Admin 可调。 */
  create: protectedProjectProcedure
    .input(projectIdInput)
    .mutation(async ({ ctx, input }) => {
      requireKeyManagerRole(ctx.session.projectRole);
      const res = await goFetch("/api/admin/proxy-keys", "POST", {
        project_id: input.projectId,
      });
      return res as {
        id: number;
        projectId: string;
        key: string;
        keyPrefix: string;
        createdAt: string;
      };
    }),

  remove: protectedProjectProcedure
    .input(z.object({ projectId: z.string(), id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireKeyManagerRole(ctx.session.projectRole);
      await goFetch(`/api/admin/proxy-keys/${input.id}`, "DELETE");
      return { success: true };
    }),
});
