import type { DatasetItemDomain } from "@langfuse/shared";
import DiffViewer from "@/src/components/DiffViewer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import { stringifyDatasetItemData } from "../utils/datasetItemUtils";

type DatasetItemDiffViewProps = {
  selectedVersion: DatasetItemDomain;
  latestVersion: DatasetItemDomain;
};

export const DatasetItemDiffView = ({
  selectedVersion,
  latestVersion,
}: DatasetItemDiffViewProps) => {
  return (
    <div className="space-y-4">
      <Accordion
        type="multiple"
        defaultValue={["input", "output"]}
        className="w-full"
      >
        <AccordionItem value="input">
          <AccordionTrigger>输入</AccordionTrigger>
          <AccordionContent>
            <DiffViewer
              oldString={stringifyDatasetItemData(selectedVersion.input)}
              newString={stringifyDatasetItemData(latestVersion.input)}
              oldLabel="所选版本"
              newLabel="最新版本"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="output">
          <AccordionTrigger>预期输出</AccordionTrigger>
          <AccordionContent>
            <DiffViewer
              oldString={stringifyDatasetItemData(
                selectedVersion.expectedOutput,
              )}
              newString={stringifyDatasetItemData(latestVersion.expectedOutput)}
              oldLabel="所选版本"
              newLabel="最新版本"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="metadata">
          <AccordionTrigger>元数据</AccordionTrigger>
          <AccordionContent>
            <DiffViewer
              oldString={stringifyDatasetItemData(selectedVersion.metadata)}
              newString={stringifyDatasetItemData(latestVersion.metadata)}
              oldLabel="所选版本"
              newLabel="最新版本"
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
