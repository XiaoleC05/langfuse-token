import { deleteDatasetRunByIdForApi } from "@/src/features/datasets/server/publicDatasetService";
import { DeleteDatasetRunV1Response } from "@/src/features/public-api/types/datasets";
import { defineTool } from "../../../core/define-tool";
import { runMcpTool } from "../../../core/run-mcp-tool";
import { rejectDatasetRunToolsInEventsOnlyMode } from "../events-only-guard";
import { DeleteDatasetRunMcpInput } from "../schema";

export const [deleteDatasetRunTool, handleDeleteDatasetRun] = defineTool({
  name: "deleteDatasetRun",
  description:
    "按数据集 ID 和运行 ID 删除数据集运行,并将其运行条目的删除加入队列。",
  baseSchema: DeleteDatasetRunMcpInput,
  inputSchema: DeleteDatasetRunMcpInput,
  handler: async (input, context) =>
    runMcpTool({
      spanName: "mcp.dataset_runs.delete",
      context,
      attributes: {
        "mcp.dataset_id": input.datasetId,
        "mcp.dataset_run_id": input.datasetRunId,
      },
      fn: async () => {
        rejectDatasetRunToolsInEventsOnlyMode();
        const result = await deleteDatasetRunByIdForApi({
          projectId: context.projectId,
          orgId: context.orgId,
          apiKeyId: context.apiKeyId,
          datasetId: input.datasetId,
          datasetRunId: input.datasetRunId,
        });

        return DeleteDatasetRunV1Response.parse(result);
      },
    }),
  destructiveHint: true,
});
