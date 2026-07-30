import { listDatasetRunItemsByRunIdForApi } from "@/src/features/datasets/server/publicDatasetService";
import { GetDatasetRunItemsV1Response } from "@/src/features/public-api/types/datasets";
import { defineTool } from "../../../core/define-tool";
import { buildDatasetRunUrl } from "@/src/utils/product-url";
import { runMcpTool } from "../../../core/run-mcp-tool";
import { paginationMeta } from "../../publicApi";
import { rejectDatasetRunToolsInEventsOnlyMode } from "../events-only-guard";
import { GetDatasetRunItemsMcpInput } from "../schema";

export const [listDatasetRunItemsTool, handleListDatasetRunItems] = defineTool({
  name: "listDatasetRunItems",
  description:
    "按数据集 ID 和运行 ID 列出数据集运行条目,每个条目在数据集运行中将一个数据集条目关联到追踪或观测。",
  baseSchema: GetDatasetRunItemsMcpInput,
  inputSchema: GetDatasetRunItemsMcpInput,
  handler: async (input, context) =>
    runMcpTool({
      spanName: "mcp.dataset_run_items.list",
      context,
      attributes: {
        "mcp.dataset_id": input.datasetId,
        "mcp.dataset_run_id": input.datasetRunId,
      },
      fn: async () => {
        rejectDatasetRunToolsInEventsOnlyMode();
        const result = await listDatasetRunItemsByRunIdForApi({
          datasetId: input.datasetId,
          datasetRunId: input.datasetRunId,
          projectId: context.projectId,
          limit: input.limit,
          page: input.page,
        });

        const parsed = GetDatasetRunItemsV1Response.parse({
          data: result.data,
          meta: paginationMeta(result.meta),
        });

        return {
          ...parsed,
          data: parsed.data.map((datasetRunItem) => ({
            ...datasetRunItem,
            url: buildDatasetRunUrl({
              projectId: context.projectId,
              datasetId: input.datasetId,
              datasetRunId: datasetRunItem.datasetRunId,
            }),
          })),
        };
      },
    }),
  readOnlyHint: true,
});
