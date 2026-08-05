import type { DatasetItemDomain } from "@langfuse/shared";
import {
  stringifyDatasetItemData,
  type DatasetSchema,
} from "../utils/datasetItemUtils";
import { DatasetItemFields } from "@/src/features/datasets/components/DatasetItemFields";

type DatasetItemViewModeContentProps = {
  item: DatasetItemDomain | null;
  isLoading: boolean;
  dataset: DatasetSchema | null;
};

/**
 * Renders the latest version of a dataset item in view mode.
 * Handles loading and not-found states.
 */
export const DatasetItemViewModeContent = ({
  item,
  isLoading,
  dataset,
}: DatasetItemViewModeContentProps) => {
  if (isLoading) {
    return <div className="text-muted-foreground text-sm">加载中...</div>;
  }

  if (item === null) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="text-muted-foreground">
          <p className="text-lg font-bold">未找到数据项</p>
          <p className="mt-2 text-sm">
            该数据项不存在或已被删除。
          </p>
        </div>
      </div>
    );
  }

  return (
    <DatasetItemFields
      values={{
        input: stringifyDatasetItemData(item.input),
        expectedOutput: stringifyDatasetItemData(item.expectedOutput),
        metadata: stringifyDatasetItemData(item.metadata),
      }}
      dataset={dataset}
      editable={false}
      projectId={item.projectId}
      datasetItemId={item.id}
    />
  );
};
