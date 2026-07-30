import { useFormState, useWatch } from "react-hook-form";
import { Checkbox } from "@/src/components/design-system/Checkbox/Checkbox";
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import {
  AnalyticsIntegrationExportSource,
  BlobStorageIntegrationFileType,
  EXPORT_FIELD_GROUP_OPTIONS,
  type ObservationFieldGroupFull,
} from "@langfuse/shared";
import { type BlobStorageFormControl } from "@/src/features/blobstorage-integration/components/formValues";

// Field-group checkboxes; descriptions and available groups depend on the
// selected export source and file type.
export const ExportFieldGroupsField = ({
  control,
}: {
  control: BlobStorageFormControl;
}) => {
  const [watchedExportSource, watchedFileType] = useWatch({
    control,
    name: ["exportSource", "fileType"],
  });
  const { errors } = useFormState({ control, name: "exportFieldGroups" });
  const isParquetExport =
    watchedFileType === BlobStorageIntegrationFileType.PARQUET;
  // The legacy observations table contains fewer columns than the enriched
  // observations, so the per-group field lists differ for legacy-only exports.
  const isLegacyOnlyExport =
    watchedExportSource ===
    AnalyticsIntegrationExportSource.TRACES_OBSERVATIONS;
  // Traces and legacy observations are only exported for the legacy and mixed
  // sources; an EVENTS-only export produces scores and enriched observations.
  const includesLegacyExport =
    watchedExportSource ===
      AnalyticsIntegrationExportSource.TRACES_OBSERVATIONS ||
    watchedExportSource ===
      AnalyticsIntegrationExportSource.TRACES_OBSERVATIONS_EVENTS;

  return (
    <FormField
      control={control}
      name="exportFieldGroups"
      render={({ field }) => (
        <FormItem>
          <FormLabel>导出字段组</FormLabel>
          <FormDescription>
            选择要在观测数据导出中包含的字段组。取消选择大型字段组（如输入/输出）以减小导出大小，或取消隐私敏感字段组（如元数据）以避免存储用户数据。
            {includesLegacyExport
              ? isLegacyOnlyExport
                ? " 跟踪和评分始终完整导出。仅存在于增强型观测数据的字段组（如跟踪上下文）不适用于此导出来源。"
                : " 跟踪和评分始终完整导出。仅存在于增强型观测数据的字段（如跟踪上下文）在旧版导出中会被忽略。"
              : " 评分始终完整导出。"}
          </FormDescription>
          <div className="mt-2 space-y-2">
            {EXPORT_FIELD_GROUP_OPTIONS.filter(
              // Hide no-op groups (no legacy columns) for legacy-only
              // exports; a saved selection is kept and applies again if
              // the source is migrated to enriched observations.
              (option) => !isLegacyOnlyExport || option.includedInLegacyExport,
            ).map((option) => {
              const isCore = option.value === "core";
              return (
                <div key={option.value} className="flex items-start gap-2">
                  <Checkbox
                    id={`field-group-${option.value}`}
                    checked={
                      isCore ? true : (field.value ?? []).includes(option.value)
                    }
                    disabled={isCore}
                    onCheckedChange={
                      isCore
                        ? undefined
                        : (checked) => {
                            const current = field.value ?? [];
                            const next =
                              checked === true
                                ? current.includes(option.value)
                                  ? current
                                  : [...current, option.value]
                                : current.filter(
                                    (v: ObservationFieldGroupFull) =>
                                      v !== option.value,
                                  );
                            field.onChange(next);
                          }
                    }
                  />
                  <label
                    htmlFor={`field-group-${option.value}`}
                    className={
                      isCore ? "space-y-0.5" : "cursor-pointer space-y-0.5"
                    }
                  >
                    <div className="text-sm leading-none font-bold">
                      {option.label}
                      {isCore && (
                        <span className="text-muted-foreground ml-1 font-normal">
                          （必填）
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {isParquetExport
                        ? isLegacyOnlyExport
                          ? option.legacyParquetDescription
                          : option.parquetDescription
                        : isLegacyOnlyExport
                          ? option.legacyDescription
                          : option.description}
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
          <FormMessage>{errors.exportFieldGroups?.message}</FormMessage>
        </FormItem>
      )}
    />
  );
};
