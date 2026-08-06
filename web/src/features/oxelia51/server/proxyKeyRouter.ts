import { z } from "zod";
import {
  createTRPCRouter,
  protectedProjectProcedure,
} from "@/src/server/api/trpc";
import { goFetch } from "@/src/features/oxelia51/server/goClient";

/** 代理网关项目密钥（Go 后端 proxy_keys 表，服务端 admin JWT 代理）。 */

const projectIdInput = z.object({ projectId: z.string() });

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

  /** 生成密钥：返回含明文 key（仅此一次）。 */
  create: protectedProjectProcedure
    .input(projectIdInput)
    .mutation(async ({ input }) => {
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
    .mutation(async ({ input }) => {
      await goFetch(`/api/admin/proxy-keys/${input.id}`, "DELETE");
      return { success: true };
    }),
});
