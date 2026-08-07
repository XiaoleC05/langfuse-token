import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  type availableDatasetEvalVariables,
  type availableTraceEvalVariables,
  type EvalTemplate,
  eventTargetEvalVariableColumns,
  experimentTargetEvalVariableColumns,
} from "@langfuse/shared";
import { Card } from "@/src/components/ui/card";
import { JSONView } from "@/src/components/ui/CodeJsonViewer";
import DocPopup from "@/src/components/layouts/doc-popup";
import { cn } from "@/src/utils/tailwind";
import {
  type EvalFormType,
  fieldHasJsonSelectorOption,
} from "@/src/features/evals/utils/evaluator-form-utils";
import { EvalTargetObject } from "@langfuse/shared";
import { VariableMappingDescription } from "@/src/features/evals/components/eval-form-descriptions";
import {
  EvaluationPromptPreview,
  getVariableColor,
} from "@/src/features/evals/components/evaluation-prompt-preview";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  isEventTarget,
  isExperimentTarget,
  isLegacyEvalTarget,
  isTraceTarget,
  isTraceOrDatasetObject,
} from "@/src/features/evals/utils/typeHelpers";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/src/components/ui/form";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { DetailPageNav } from "@/src/features/navigate-detail-pages/DetailPageNav";
import { useEvalConfigMappingData } from "@/src/features/evals/hooks/useEvalConfigMappingData";
import { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/src/components/ui/alert";
import { AlertCircle, ExternalLink } from "lucide-react";
import { useVariableMappingSync } from "@/src/features/evals/hooks/useVariableMappingSync";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/router";
import { useV4Beta } from "@/src/features/events/hooks/useV4Beta";
import {
  type EvalPreviewPointer,
  buildEvalPreviewNavigationPath,
  getEvalPreviewDetailPageListKey,
  getEvalPreviewPointerFromDetailPageEntry,
} from "@/src/features/evals/hooks/useEvalPreviewNavigation";
import { OXELIA_DOCS_URL } from "@/src/features/oxelia51/constants";

export const VariableMappingCard = ({
  projectId,
  availableVariables,
  evalTemplate,
  form,
  oldConfigId,
  disabled = false,
  shouldWrapVariables = false,
  hideAdvancedSettings = false,
  isNewCompatible = true,
  compatibilityCheckWasPerformed = false,
}: {
  projectId: string;
  availableVariables:
    | typeof availableTraceEvalVariables
    | typeof availableDatasetEvalVariables;
  evalTemplate: EvalTemplate;
  form: UseFormReturn<EvalFormType>;
  oldConfigId?: string;
  disabled?: boolean;
  shouldWrapVariables?: boolean;
  hideAdvancedSettings?: boolean;
  isNewCompatible?: boolean;
  compatibilityCheckWasPerformed?: boolean;
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPreviewPointer, setSelectedPreviewPointer] =
    useState<EvalPreviewPointer>();
  const router = useRouter();
  const { isBetaEnabled } = useV4Beta();
  const peekId =
    typeof router.query.peek === "string" ? router.query.peek : undefined;
  const isPeekView = Boolean(peekId);
  const target = form.watch("target");
  const shouldShowPreviewForTarget =
    isTraceTarget(target) ||
    isEventTarget(target) ||
    (isExperimentTarget(target) && isBetaEnabled);

  const { fields } = useFieldArray({
    control: form.control,
    name: "mapping",
  });

  const syncStatus = useVariableMappingSync({
    templateVars: evalTemplate?.vars,
    currentMapping: fields,
  });

  const { namesByObject, isLoading, previewData } = useEvalConfigMappingData(
    projectId,
    form,
    disabled,
    isPeekView ? selectedPreviewPointer : undefined,
  );

  const nonOtelCompatible = compatibilityCheckWasPerformed && !isNewCompatible;
  const shouldDisablePreviewForNonOtel =
    nonOtelCompatible && (isEventTarget(target) || isExperimentTarget(target));

  useEffect(() => {
    if (
      shouldShowPreviewForTarget &&
      !disabled &&
      !shouldDisablePreviewForNonOtel
    ) {
      setShowPreview(true);
    } else {
      setShowPreview(false);
    }

    if (isPeekView) {
      setSelectedPreviewPointer(undefined);
    }
  }, [
    target,
    disabled,
    isPeekView,
    shouldShowPreviewForTarget,
    shouldDisablePreviewForNonOtel,
  ]);

  useEffect(() => {
    if (isPeekView) {
      setSelectedPreviewPointer(undefined);
    }
  }, [isPeekView, peekId]);

  const shouldShowPreviewControls =
    shouldShowPreviewForTarget && !disabled && !shouldDisablePreviewForNonOtel;
  const previewNavigationListKey = getEvalPreviewDetailPageListKey(
    target,
    isBetaEnabled,
  );
  const evalPreviewBasePath = hideAdvancedSettings
    ? `/project/${projectId}/evals/remap?evaluator=${oldConfigId}`
    : `/project/${projectId}/evals/new?evaluator=${evalTemplate.id}`;

  const mappingControlButtons = (
    <div className="flex items-center gap-2">
      {shouldShowPreviewControls && (
        <>
          <span className="text-muted-foreground text-xs">预览</span>
          <Switch
            checked={showPreview}
            onCheckedChange={setShowPreview}
            disabled={disabled}
          />
          {showPreview &&
            (previewData && previewNavigationListKey ? (
              <DetailPageNav
                currentId={
                  previewData.type === EvalTargetObject.EVENT
                    ? previewData.observationId
                    : previewData.traceId
                }
                listKey={previewNavigationListKey}
                onNavigate={
                  isPeekView
                    ? (entry) => {
                        setSelectedPreviewPointer(
                          getEvalPreviewPointerFromDetailPageEntry(
                            entry,
                            target,
                          ),
                        );
                      }
                    : undefined
                }
                path={(entry) =>
                  buildEvalPreviewNavigationPath({
                    basePath: evalPreviewBasePath,
                    entry,
                    target,
                  })
                }
              />
            ) : (
              <div className="flex flex-row gap-1">
                <Skeleton className="h-8 w-[54px]" />
                <Skeleton className="h-8 w-[54px]" />
              </div>
            ))}
        </>
      )}
    </div>
  );

  return (
    <Card className="max-w-full min-w-0 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg font-bold">变量映射</span>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {evalTemplate.projectId ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/project/${projectId}/evals/templates/${evalTemplate.id}?mode=edit`}
                target="_blank"
                rel="noopener noreferrer"
              >
                编辑提示词
                <ExternalLink className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
              title="只有用户管理的模板可以编辑"
            >
              编辑提示词
              <ExternalLink className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {isTraceTarget(form.watch("target")) && !disabled && (
        <FormDescription>
          评估提示词预览，其中的变量将被替换为根据筛选条件匹配到的第一条追踪数据。
        </FormDescription>
      )}
      <div className="flex max-w-full flex-col gap-4">
        <FormField
          control={form.control}
          name="mapping"
          render={() => (
            <>
              <div
                className={cn(
                  "my-2 flex max-w-full flex-col gap-2",
                  !shouldWrapVariables && "lg:flex-row",
                )}
              >
                {showPreview ? (
                  previewData ? (
                    <EvaluationPromptPreview
                      projectId={projectId}
                      previewData={previewData}
                      evalTemplate={evalTemplate}
                      variableMapping={form.watch("mapping")}
                      isLoading={isLoading}
                      className={cn(
                        "bg-muted/50 min-h-48",
                        !shouldWrapVariables && "lg:w-2/3",
                      )}
                      controlButtons={mappingControlButtons}
                    />
                  ) : (
                    <div className="bg-muted/50 flex max-h-full min-h-48 w-full flex-col gap-1 lg:w-2/3">
                      <div className="flex flex-row items-center justify-between py-0 text-sm font-bold capitalize">
                        <div className="flex flex-row items-center gap-2">
                          评估提示词预览
                          <Skeleton className="h-[25px] w-[63px]" />
                        </div>
                        <div className="flex justify-end">
                          {mappingControlButtons}
                        </div>
                      </div>
                      <div className="flex h-full w-full flex-1 items-center justify-center rounded border">
                        <p className="text-muted-foreground text-center text-sm">
                          未找到追踪数据，请调整筛选条件或关闭预览。
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <JSONView
                    title="评估提示词"
                    json={evalTemplate.prompt ?? null}
                    className={cn(
                      "bg-muted/50 min-h-48",
                      !shouldWrapVariables && "lg:w-2/3",
                    )}
                    codeClassName="flex-1"
                    collapseStringsAfterLength={null}
                    controlButtons={mappingControlButtons}
                  />
                )}
                <div
                  className={cn(
                    "flex flex-col gap-2",
                    !shouldWrapVariables && "lg:w-1/3",
                  )}
                >
                  {disabled && !syncStatus.inSync && (
                    <Alert className="text-sm" variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-base">
                        变量映射已不同步
                      </AlertTitle>
                      <AlertDescription>
                        模板有 {syncStatus.added.length} 个新增变量和{" "}
                        {syncStatus.removed.length} 个已移除变量。请切换编辑模式以更新映射。
                      </AlertDescription>
                    </Alert>
                  )}
                  {isLegacyEvalTarget(form.watch("target")) // Complex variable mapping for trace/dataset targets (legacy)
                    ? fields.map((mappingField, index) => (
                        <Card className="flex flex-col gap-2 p-4" key={index}>
                          <div
                            className={cn(
                              "text-sm font-bold",
                              getVariableColor(index),
                            )}
                          >
                            {"{{"}
                            {mappingField.templateVariable}
                            {"}}"}
                            <DocPopup
                              description="模板中的变量，将被映射数据替换。"
                              href={OXELIA_DOCS_URL}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            key={`${mappingField.id}-langfuseObject`}
                            name={`mapping.${index}.langfuseObject`}
                            render={({ field }) => (
                              <div className="flex items-center gap-2">
                                <VariableMappingDescription
                                  title="对象"
                                  description="用于获取数据的 Langfuse 对象。"
                                  href={OXELIA_DOCS_URL}
                                />
                                <FormItem className="w-2/3">
                                  <FormControl>
                                    <Select
                                      disabled={disabled}
                                      defaultValue={field.value}
                                      onValueChange={(value) => {
                                        field.onChange(value);
                                        form.setValue(
                                          `mapping.${index}.objectName`,
                                          undefined,
                                        );
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableVariables.map(
                                          (evalObject) => (
                                            <SelectItem
                                              value={evalObject.id}
                                              key={evalObject.id}
                                            >
                                              {evalObject.display}
                                            </SelectItem>
                                          ),
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              </div>
                            )}
                          />

                          {!isTraceOrDatasetObject(
                            form.watch(`mapping.${index}.langfuseObject`) ?? "",
                          ) ? (
                            <FormField
                              control={form.control}
                              key={`${mappingField.id}-objectName`}
                              name={`mapping.${index}.objectName`}
                              render={({ field }) => {
                                const type = String(
                                  form.watch(`mapping.${index}.langfuseObject`),
                                ).toUpperCase();
                                const nameOptions = Array.from(
                                  namesByObject.get(type) ?? [],
                                );
                                const isCustomOption =
                                  field.value === "custom" ||
                                  (field.value &&
                                    !nameOptions.includes(field.value));
                                return (
                                  <div className="flex items-center gap-2">
                                    <VariableMappingDescription
                                      title="对象名称"
                                      description="用于获取数据的 Langfuse 对象的名称。"
                                      href={OXELIA_DOCS_URL}
                                    />
                                    <FormItem className="w-2/3">
                                      <FormControl>
                                        {isCustomOption ? (
                                          <div className="flex flex-col gap-2">
                                            <Select
                                              onValueChange={(value) => {
                                                if (value !== "custom") {
                                                  field.onChange(value);
                                                }
                                              }}
                                              value="custom"
                                              disabled={disabled}
                                            >
                                              <SelectTrigger>
                                                <SelectValue>
                                                  输入名称...
                                                </SelectValue>
                                              </SelectTrigger>
                                              <SelectContent>
                                                {nameOptions?.map((name) => (
                                                  <SelectItem
                                                    key={name}
                                                    value={name}
                                                  >
                                                    {name}
                                                  </SelectItem>
                                                ))}
                                                <SelectItem
                                                  key="custom"
                                                  value="custom"
                                                >
                                                  输入名称...
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <Input
                                              value={
                                                field.value === "custom"
                                                  ? ""
                                                  : field.value || ""
                                              }
                                              onChange={(e) =>
                                                field.onChange(e.target.value)
                                              }
                                              placeholder="输入 Langfuse 对象名称"
                                              disabled={disabled}
                                            />
                                          </div>
                                        ) : (
                                          <Select
                                            {...field}
                                            value={field.value ?? ""}
                                            onValueChange={field.onChange}
                                            disabled={disabled}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {nameOptions?.map((name) => (
                                                <SelectItem
                                                  key={name}
                                                  value={name}
                                                >
                                                  {name}
                                                </SelectItem>
                                              ))}
                                              <SelectItem
                                                key="custom"
                                                value="custom"
                                              >
                                                输入名称...
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                        )}
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  </div>
                                );
                              }}
                            />
                          ) : undefined}

                          <FormField
                            control={form.control}
                            key={`${mappingField.id}-selectedColumnId`}
                            name={`mapping.${index}.selectedColumnId`}
                            render={({ field }) => (
                              <div className="flex items-center gap-2">
                                <VariableMappingDescription
                                  title="对象字段"
                                  description="要插入模板的 Langfuse 对象字段。"
                                  href={OXELIA_DOCS_URL}
                                />
                                <FormItem className="w-2/3">
                                  <FormControl>
                                    <Select
                                      disabled={disabled}
                                      defaultValue={field.value ?? undefined}
                                      onValueChange={(value) => {
                                        const availableColumns =
                                          availableVariables.find(
                                            (evalObject) =>
                                              evalObject.id ===
                                              form.watch(
                                                `mapping.${index}.langfuseObject`,
                                              ),
                                          )?.availableColumns;

                                        const column = availableColumns?.find(
                                          (column) => column.id === value,
                                        );

                                        field.onChange(column?.id);
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="对象类型" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableVariables
                                          .find(
                                            (evalObject) =>
                                              evalObject.id ===
                                              form.watch(
                                                `mapping.${index}.langfuseObject`,
                                              ),
                                          )
                                          ?.availableColumns.map((column) => (
                                            <SelectItem
                                              value={column.id}
                                              key={column.id}
                                            >
                                              {column.name}
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              </div>
                            )}
                          />
                          {fieldHasJsonSelectorOption(
                            form.watch(`mapping.${index}.selectedColumnId`),
                          ) ? (
                            <FormField
                              control={form.control}
                              key={`${mappingField.id}-jsonSelector`}
                              name={`mapping.${index}.jsonSelector`}
                              render={({ field }) => (
                                <div className="flex items-center gap-2">
                                  <VariableMappingDescription
                                    title="JsonPath"
                                    description="可选：使用 JsonPath 语法从存储在追踪上的 JSON 对象中选择。如果未选择，我们将把整个对象传入提示词。"
                                    href={OXELIA_DOCS_URL}
                                  />
                                  <FormItem className="w-2/3">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        value={field.value ?? ""}
                                        disabled={disabled}
                                        placeholder="可选"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                </div>
                              )}
                            />
                          ) : undefined}
                        </Card>
                      ))
                    : // Simplified variable mapping for event/experiment targets
                      fields.map((mappingField, index) => (
                        <Card className="flex flex-col gap-2 p-4" key={index}>
                          <div
                            className={cn(
                              "text-sm font-bold",
                              getVariableColor(index),
                            )}
                          >
                            {"{{"}
                            {mappingField.templateVariable}
                            {"}}"}
                            <DocPopup
                              description="模板中的变量，将被映射数据替换。"
                              href={OXELIA_DOCS_URL}
                            />
                          </div>
                          {hideAdvancedSettings && (
                            <div className="flex items-center gap-2">
                              <VariableMappingDescription
                                title="对象"
                                description="用于获取数据的对象类型。"
                                href={OXELIA_DOCS_URL}
                              />
                              <div className="w-2/3">
                                <Input
                                  value={
                                    isEventTarget(form.watch("target"))
                                      ? "观测"
                                      : "实验项"
                                  }
                                  disabled
                                />
                              </div>
                            </div>
                          )}
                          <FormField
                            control={form.control}
                            key={`${mappingField.id}-selectedColumnId`}
                            name={`mapping.${index}.selectedColumnId`}
                            render={({ field }) => {
                              // Filter columns based on target
                              // For observations (event), exclude experiment-specific fields
                              const availableColumns =
                                form.watch("target") === EvalTargetObject.EVENT
                                  ? eventTargetEvalVariableColumns
                                  : experimentTargetEvalVariableColumns;

                              return (
                                <div className="flex items-center gap-2">
                                  <VariableMappingDescription
                                    title="对象字段"
                                    description="要插入模板的观测字段。"
                                    href={OXELIA_DOCS_URL}
                                  />
                                  <FormItem className="w-2/3">
                                    <FormControl>
                                      <Select
                                        disabled={disabled}
                                        defaultValue={field.value ?? undefined}
                                        onValueChange={field.onChange}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="选择字段" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {availableColumns.map((column) => (
                                            <SelectItem
                                              value={column.id}
                                              key={column.id}
                                            >
                                              {column.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                </div>
                              );
                            }}
                          />
                          {fieldHasJsonSelectorOption(
                            form.watch(`mapping.${index}.selectedColumnId`),
                          ) && (
                            <FormField
                              control={form.control}
                              key={`${mappingField.id}-jsonSelector`}
                              name={`mapping.${index}.jsonSelector`}
                              render={({ field }) => (
                                <div className="flex items-center gap-2">
                                  <VariableMappingDescription
                                    title="JsonPath"
                                    description="可选：使用 JsonPath 语法从 JSON 对象中选择。如果未选择，我们将把整个对象传入提示词。"
                                    href={OXELIA_DOCS_URL}
                                  />
                                  <FormItem className="w-2/3">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        value={field.value ?? ""}
                                        disabled={disabled}
                                        placeholder="可选"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                </div>
                              )}
                            />
                          )}
                        </Card>
                      ))}
                </div>
              </div>
              <FormMessage />
            </>
          )}
        />
      </div>
    </Card>
  );
};
