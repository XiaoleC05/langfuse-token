import { deleteDatasetItemForApi } from "@/src/features/datasets/server/publicDatasetService";
import {
  DeleteDatasetItemV1Query,
  DeleteDatasetItemV1Response,
} from "@/src/features/public-api/types/datasets";
import { defineTool } from "../../../core/define-tool";
import { runMcpTool } from "../../../core/run-mcp-tool";

export const [deleteDatasetItemTool, handleDeleteDatasetItem] = defineTool({
  name: "deleteDatasetItem",
  description:
    "删除数据集条目(数据集中的一个示例)及其所有运行条目。",
  baseSchema: DeleteDatasetItemV1Query,
  inputSchema: DeleteDatasetItemV1Query,
  handler: async (input, context) =>
    runMcpTool({
      spanName: "mcp.dataset_items.delete",
      context,
      attributes: { "mcp.dataset_item_id": input.datasetItemId },
      fn: async () => {
        const result = await deleteDatasetItemForApi({
          datasetItemId: input.datasetItemId,
          projectId: context.projectId,
          orgId: context.orgId,
          apiKeyId: context.apiKeyId,
        });

        return DeleteDatasetItemV1Response.parse(result);
      },
    }),
  destructiveHint: true,
});
