import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { z } from "zod";
import { parseCsvClient } from "@/src/features/datasets/lib/csv/helpers";
import { DialogBody } from "@/src/components/ui/dialog";
import {
  Dropzone,
  DropzoneEmptyState,
} from "@/src/components/ui/shadcn-io/dropzone";
import type { CsvPreviewResult } from "@/src/features/datasets/lib/csv/types";

export const MAX_FILE_SIZE_BYTES = 1024 * 1024 * 1 * 10; // 10MB
const ACCEPTED_FILE_TYPES = ["text/csv"] as const;

const FileSchema = z.object({
  type: z.enum([...ACCEPTED_FILE_TYPES]),
  size: z.number().min(1),
});

export const UploadDatasetCsv = ({
  setPreview,
  setCsvFile,
}: {
  setPreview: (preview: CsvPreviewResult | null) => void;
  setCsvFile: (file: File | null) => void;
}) => {
  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    const result = FileSchema.safeParse(file);
    if (!result.success) {
      showErrorToast("文件类型无效", "请选择有效的 CSV 文件");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      showErrorToast("文件过大", "最大文件大小为 10MB");
      return;
    }

    try {
      setCsvFile(file);
      const preview = await parseCsvClient(file, {
        isPreview: true,
        collectSamples: true,
      });

      if (!Boolean(preview.columns.length)) {
        showErrorToast("CSV 无效", "CSV 必须至少包含 1 列");
        return;
      }

      setPreview(preview);
    } catch (error) {
      showErrorToast(
        "解析 CSV 失败",
        error instanceof Error ? error.message : "未知错误",
      );
    }
  };

  return (
    <DialogBody className="border-t">
      <Card className="h-full items-center justify-center border-none">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">向数据集添加数据项</CardTitle>
          <CardDescription>
            通过上传文件、手动添加或使用 SDK/API 向数据集添加数据项
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dropzone
            onDrop={handleFiles}
            accept={{ "text/csv": [".csv"] }}
            maxFiles={1}
            maxSize={MAX_FILE_SIZE_BYTES}
            className="bg-secondary/50 border-dashed"
          >
            <DropzoneEmptyState />
          </Dropzone>
        </CardContent>
      </Card>
    </DialogBody>
  );
};
