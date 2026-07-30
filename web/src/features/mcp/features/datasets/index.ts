import type { McpFeatureModule } from "../../server/registry";
import { upsertDatasetTool, handleUpsertDataset } from "./tools/upsertDataset";
import {
  upsertDatasetItemTool,
  handleUpsertDatasetItem,
} from "./tools/upsertDatasetItem";
import {
  createDatasetRunItemTool,
  handleCreateDatasetRunItem,
} from "./tools/createDatasetRunItem";
import {
  deleteDatasetItemTool,
  handleDeleteDatasetItem,
} from "./tools/deleteDatasetItem";
import {
  deleteDatasetRunTool,
  handleDeleteDatasetRun,
} from "./tools/deleteDatasetRun";
import { getDatasetTool, handleGetDataset } from "./tools/getDataset";
import {
  getDatasetItemTool,
  handleGetDatasetItem,
} from "./tools/getDatasetItem";
import { getDatasetRunTool, handleGetDatasetRun } from "./tools/getDatasetRun";
import {
  handleListDatasetItems,
  listDatasetItemsTool,
} from "./tools/listDatasetItems";
import {
  handleListDatasetRunItems,
  listDatasetRunItemsTool,
} from "./tools/listDatasetRunItems";
import {
  handleListDatasetRuns,
  listDatasetRunsTool,
} from "./tools/listDatasetRuns";
import { handleListDatasets, listDatasetsTool } from "./tools/listDatasets";

export const datasetsFeature = {
  name: "datasets",
  description:
    "管理数据集(用于实验和评估的、命名的数据集条目集合),以及运行和运行条目",
  tools: [
    { definition: upsertDatasetTool, handler: handleUpsertDataset },
    {
      definition: listDatasetsTool,
      handler: handleListDatasets,
    },
    {
      definition: getDatasetTool,
      handler: handleGetDataset,
    },
    { definition: upsertDatasetItemTool, handler: handleUpsertDatasetItem },
    {
      definition: listDatasetItemsTool,
      handler: handleListDatasetItems,
    },
    {
      definition: getDatasetItemTool,
      handler: handleGetDatasetItem,
    },
    { definition: deleteDatasetItemTool, handler: handleDeleteDatasetItem },
    {
      definition: createDatasetRunItemTool,
      handler: handleCreateDatasetRunItem,
    },
    {
      definition: listDatasetRunItemsTool,
      handler: handleListDatasetRunItems,
    },
    {
      definition: listDatasetRunsTool,
      handler: handleListDatasetRuns,
    },
    {
      definition: getDatasetRunTool,
      handler: handleGetDatasetRun,
    },
    { definition: deleteDatasetRunTool, handler: handleDeleteDatasetRun },
  ],
} as const satisfies McpFeatureModule;
