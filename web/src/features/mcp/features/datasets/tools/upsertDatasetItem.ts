import { createDatasetItemForApi } from "@/src/features/datasets/server/publicDatasetService";
import { PostDatasetItemsV1Response } from "@/src/features/public-api/types/datasets";
import { defineTool } from "../../../core/define-tool";
import { buildDatasetItemUrl } from "@/src/utils/product-url";
import { runMcpTool } from "../../../core/run-mcp-tool";
import { PostDatasetItemMcpInput } from "../schema";

export const [upsertDatasetItemTool, handleUpsertDatasetItem] = defineTool({
  name: "upsertDatasetItem",
  description:
    "按数据集 ID 创建或更新数据集条目(数据集中的一个示例)。条目 ID 在项目内跨所有数据集唯一,因此在一个数据集中使用过的 ID 不能在另一个数据集中重复使用。",
  baseSchema: PostDatasetItemMcpInput,
  inputSchema: PostDatasetItemMcpInput,
  handler: async (input, context) =>
    runMcpTool({
      spanName: "mcp.dataset_items.upsert",
      context,
      attributes: { "mcp.dataset_id": input.datasetId },
      fn: async () => {
        const result = await createDatasetItemForApi({
          input,
          projectId: context.projectId,
          auditScope: context,
        });

        const datasetItem = PostDatasetItemsV1Response.parse(result);

        return {
          ...datasetItem,
          url: buildDatasetItemUrl({
            projectId: context.projectId,
            datasetId: input.datasetId,
            datasetItemId: datasetItem.id,
          }),
        };
      },
    }),
  destructiveHint: true,
});
