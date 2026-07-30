import { GetDatasetItemsV1Response } from "@/src/features/public-api/types/datasets";
import { listDatasetItemsForApi } from "@/src/features/datasets/server/publicDatasetService";
import { defineTool } from "../../../core/define-tool";
import { buildDatasetItemUrl } from "@/src/utils/product-url";
import { runMcpTool } from "../../../core/run-mcp-tool";
import {
  GetDatasetItemsMcpBaseSchema,
  GetDatasetItemsMcpInput,
} from "../schema";

export const [listDatasetItemsTool, handleListDatasetItems] = defineTool({
  name: "listDatasetItems",
  description:
    "列出数据集条目(包含输入及可选期望输出的单个示例),可按数据集 ID、来源追踪、来源观测或版本筛选。",
  baseSchema: GetDatasetItemsMcpBaseSchema,
  inputSchema: GetDatasetItemsMcpInput,
  handler: async (input, context) =>
    runMcpTool({
      spanName: "mcp.dataset_items.list",
      context,
      attributes: {
        "mcp.dataset_id": input.datasetId,
        "mcp.pagination_page": input.page,
        "mcp.pagination_limit": input.limit,
      },
      fn: async () => {
        const result = await listDatasetItemsForApi({
          ...input,
          projectId: context.projectId,
        });

        const parsed = GetDatasetItemsV1Response.parse(result);

        return {
          ...parsed,
          data: parsed.data.map((datasetItem) => ({
            ...datasetItem,
            url: buildDatasetItemUrl({
              projectId: context.projectId,
              datasetId: datasetItem.datasetId,
              datasetItemId: datasetItem.id,
            }),
          })),
        };
      },
    }),
  readOnlyHint: true,
});
