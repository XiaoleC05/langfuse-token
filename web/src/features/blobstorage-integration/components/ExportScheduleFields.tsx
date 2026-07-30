import { useWatch } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  BlobStorageExportMode,
  BlobStorageIntegrationFileType,
} from "@langfuse/shared";
import { type BlobStorageFormControl } from "@/src/features/blobstorage-integration/components/formValues";

// Frequency, file type, and export mode (with the custom start date when the
// mode requires one).
export const ExportScheduleFields = ({
  control,
}: {
  control: BlobStorageFormControl;
}) => {
  const watchedExportMode = useWatch({ control, name: "exportMode" });

  return (
    <>
      <FormField
        control={control}
        name="exportFrequency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>导出频率</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="选择频率" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="every_20_minutes">
                    每20分钟
                  </SelectItem>
                  <SelectItem value="hourly">每小时</SelectItem>
                  <SelectItem value="daily">每天</SelectItem>
                  <SelectItem value="weekly">每周</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>
              数据导出频率。更改将从下次运行时起生效。
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="fileType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>文件类型</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="选择文件类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARQUET">Parquet</SelectItem>
                  <SelectItem value="JSONL">JSONL</SelectItem>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="JSON">JSON</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>
              {field.value === BlobStorageIntegrationFileType.PARQUET
                ? "Apache Parquet — 由ClickHouse编码和压缩的列式二进制格式。Gzip压缩不适用。"
                : "导出数据的文件格式。"}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="exportMode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>导出模式</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="选择导出模式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BlobStorageExportMode.FULL_HISTORY}>
                    完整历史
                  </SelectItem>
                  <SelectItem value={BlobStorageExportMode.FROM_TODAY}>
                    今日
                  </SelectItem>
                  <SelectItem value={BlobStorageExportMode.FROM_CUSTOM_DATE}>
                    自定义日期
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>
              选择从何时开始导出数据。&quot;今日&quot;和
              &quot;自定义日期&quot;模式将不包含指定日期之前的历史数据。
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {watchedExportMode === BlobStorageExportMode.FROM_CUSTOM_DATE && (
        <FormField
          control={control}
          name="exportStartDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>导出开始日期</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  max={(() => {
                    const t = new Date();
                    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
                  })()}
                  value={
                    field.value instanceof Date
                      ? field.value.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    const date = e.target.value
                      ? new Date(e.target.value)
                      : null;
                    field.onChange(date);
                  }}
                  placeholder="选择开始日期"
                />
              </FormControl>
              <FormDescription>
                此日期之前的数据将不会包含在导出中
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
};
