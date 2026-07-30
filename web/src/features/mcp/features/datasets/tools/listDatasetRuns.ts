import { GetDatasetRunsV1Response } from "@/src/features/public-api/types/datasets";
import { listDatasetRunsByDatasetIdForApi } from "@/src/features/datasets/server/publicDatasetService";
import { defineTool } from "../../../core/define-tool";
import { buildDatasetRunUrl } from "@/src/utils/product-url";
import { runMcpTool } from "../../../core/run-mcp-tool";
import { rejectDatasetRunToolsInEventsOnlyMode } from "../events-only-guard";
import { GetDatasetRunsMcpInput } from "../schema";

export const [listDatasetRunsTool, handleListDatasetRuns] = defineTool({
  name: "listDatasetRuns",
  description:
    "按数据集 ID 列出数据集运行(对数据集的每次实验或评估执行)。",
  baseSchema: GetDatasetRunsMcpInput,
  inputSchema: GetDatasetRunsMcpInput,
  handler: async (input, context) =>
    runMcpTool({
      spanName: "mcp.dataset_runs.list",
      context,
      attributes: { "mcp.dataset_id": input.datasetId },
      fn: async () => {
        rejectDatasetRunToolsInEventsOnlyMode();
        const result = await listDatasetRunsByDatasetIdForApi({
          projectId: context.projectId,
          datasetId: input.datasetId,
          page: input.page,
          limit: input.limit,
        });

        const parsed = GetDatasetRunsV1Response.parse(result);

        return {
          ...parsed,
          data: parsed.data.map((datasetRun) => ({
            ...datasetRun,
            url: buildDatasetRunUrl({
              projectId: context.projectId,
              datasetId: datasetRun.datasetId,
              datasetRunId: datasetRun.id,
            }),
          })),
        };
      },
    }),
  readOnlyHint: true,
});
