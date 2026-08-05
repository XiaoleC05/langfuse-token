import { DatasetItemDiffView } from "./DatasetItemDiffView";
import type { DatasetItemDomain } from "@langfuse/shared";
import {
  stringifyDatasetItemData,
  type DatasetSchema,
} from "../utils/datasetItemUtils";
import { DatasetItemFields } from "@/src/features/datasets/components/DatasetItemFields";

type DatasetItemVersionedContentProps = {
  itemAtVersion: DatasetItemDomain | null;
  latestItem: DatasetItemDomain | null;
  isLoadingVersioned: boolean;
  isLoadingLatest: boolean;
  showDiffMode: boolean;
  itemChangedAtVersion: boolean;
  dataset: DatasetSchema | null;
};

/**
 * Renders a dataset item at a specific historical version.
 * Supports diff view comparison with the latest version.
 * Handles loading states and cases where item doesn't exist at that version.
 */
export const DatasetItemVersionedContent = ({
  itemAtVersion,
  latestItem,
  isLoadingVersioned,
  isLoadingLatest,
  showDiffMode,
  itemChangedAtVersion,
  dataset,
}: DatasetItemVersionedContentProps) => {
  // Loading states
  if (isLoadingVersioned) {
    return <div className="text-muted-foreground text-sm">加载中...</div>;
  }

  // Item doesn't exist at this version
  if (itemAtVersion === null) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="text-muted-foreground">
          <p className="text-lg font-bold">
            此版本不存在该数据项
          </p>
          <p className="mt-2 text-sm">
            该数据项在所选版本的时点可能尚未创建，也可能已被删除。
          </p>
        </div>
      </div>
    );
  }

  // Show diff mode if enabled and item changed at this version
  if (showDiffMode && itemChangedAtVersion) {
    if (isLoadingLatest) {
      return <div className="text-muted-foreground text-sm">加载中...</div>;
    }

    // Can't show diff if latest doesn't exist
    if (latestItem === null) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="text-muted-foreground">
            <p className="text-lg font-bold">无法显示差异</p>
            <p className="mt-2 text-sm">
              该数据项的最新版本不存在（已被删除）。
            </p>
          </div>
        </div>
      );
    }

    return (
      <DatasetItemDiffView
        selectedVersion={itemAtVersion}
        latestVersion={latestItem}
      />
    );
  }

  // Show normal view of selected version
  return (
    <DatasetItemFields
      values={{
        input: stringifyDatasetItemData(itemAtVersion.input),
        expectedOutput: stringifyDatasetItemData(itemAtVersion.expectedOutput),
        metadata: stringifyDatasetItemData(itemAtVersion.metadata),
      }}
      dataset={dataset}
      editable={false}
      projectId={itemAtVersion.projectId}
      datasetItemId={itemAtVersion.id}
      datasetItemValidFrom={itemAtVersion.validFrom}
    />
  );
};
