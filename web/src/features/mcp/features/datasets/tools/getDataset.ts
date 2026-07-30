import { GetDatasetV2Response } from "@/src/features/public-api/types/datasets";
import { defineTool } from "../../../core/define-tool";
import { buildDatasetUrl } from "@/src/utils/product-url";
import { runMcpTool } from "../../../core/run-mcp-tool";
import { getDatasetByIdForApi } from "@/src/features/datasets/server/publicDatasetService";
import { GetDatasetMcpInput } from "../schema";

export const [getDatasetTool, handleGetDataset] = defineTool({
  name: "getDataset",
  description:
    "按 ID 获取数据集,即用于实验和评估的输入及可选期望输出示例的命名集合。",
  baseSchema: GetDatasetMcpInput,
  inputSchema: GetDatasetMcpInput,
  handler: async (input, context) =>
    runMcpTool({
      spanName: "mcp.datasets.get",
      context,
      attributes: { "mcp.dataset_id": input.datasetId },
      fn: async () => {
        const result = await getDatasetByIdForApi({
          projectId: context.projectId,
          datasetId: input.datasetId,
        });

        const dataset = GetDatasetV2Response.parse(result);

        return {
          ...dataset,
          url: buildDatasetUrl({
            projectId: context.projectId,
            datasetId: dataset.id,
          }),
        };
      },
    }),
  readOnlyHint: true,
});
