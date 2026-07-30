import React, { useState } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/src/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  InputCommandEmpty,
  InputCommandGroup,
  InputCommandInput,
  InputCommandList,
  InputCommand,
  InputCommandItem,
} from "@/src/components/ui/input-command";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Info, CircleCheck, ChevronDown, CheckIcon } from "lucide-react";
import { cn } from "@/src/utils/tailwind";
import { type DatasetStepProps } from "@/src/features/experiments/types/stepProps";
import { StepHeader } from "@/src/features/experiments/components/shared/StepHeader";
import { api } from "@/src/utils/api";
import { format } from "date-fns";

export const DatasetStep: React.FC<DatasetStepProps> = ({
  projectId,
  formState,
  datasetState,
  promptInfo,
}) => {
  const { form } = formState;
  const {
    datasets,
    selectedDatasetId,
    expectedColumnsForDataset: expectedColumns,
    validationResult,
  } = datasetState;
  const { selectedPromptName, selectedPromptVersion } = promptInfo;
  const [datasetPopoverOpen, setDatasetPopoverOpen] = useState(false);

  // Fetch dataset versions when a dataset is selected
  const { data: datasetVersions } = api.datasets.listDatasetVersions.useQuery(
    {
      projectId,
      datasetId: selectedDatasetId || "",
    },
    {
      enabled: !!selectedDatasetId,
    },
  );

  return (
    <div className="space-y-6">
      <StepHeader
        title="数据集选择"
        description="选择用于运行实验的数据集。数据集结构必须与提示词模板变量匹配。"
      />

      <FormField
        control={form.control}
        name="datasetId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>数据集</FormLabel>
            <div className="flex items-center gap-2">
              <Popover
                open={datasetPopoverOpen}
                onOpenChange={setDatasetPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={datasetPopoverOpen}
                    className="flex-1 justify-between px-2 font-normal"
                  >
                    {field.value
                      ? datasets?.find((d) => d.id === field.value)?.name
                      : "选择数据集"}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-(--radix-popover-trigger-width) overflow-auto p-0"
                  align="start"
                >
                  <InputCommand>
                    <InputCommandInput
                      placeholder="搜索数据集…"
                      className="h-9"
                      variant="bottom"
                    />
                    <InputCommandList>
                      <InputCommandEmpty>未找到数据集。</InputCommandEmpty>
                      <InputCommandGroup>
                        {(datasets ?? []).map((dataset) => (
                          <InputCommandItem
                            key={dataset.id}
                            onSelect={() => {
                              field.onChange(dataset.id);
                              form.clearErrors("datasetId");
                              setDatasetPopoverOpen(false);
                            }}
                          >
                            {dataset.name}
                            <CheckIcon
                              className={cn(
                                "ml-auto h-4 w-4",
                                dataset.id === field.value
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                          </InputCommandItem>
                        ))}
                      </InputCommandGroup>
                    </InputCommandList>
                  </InputCommand>
                </PopoverContent>
              </Popover>

              {selectedPromptName && selectedPromptVersion !== null && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-8">
                      期望列
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="leading-none font-bold">
                        期望的数据集结构
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        基于提示词 {selectedPromptName} v
                        {selectedPromptVersion}
                      </p>
                      <div className="space-y-1 pt-2">
                        <p className="text-sm font-bold">输入变量:</p>
                        <ul className="list-inside list-disc text-sm">
                          {expectedColumns.inputVariables.map((variable) => (
                            <li key={variable}>{variable}</li>
                          ))}
                        </ul>
                        <p className="text-sm font-bold">期望输出:</p>
                        <ul className="list-inside list-disc text-sm">
                          <li>
                            {expectedColumns.outputVariableName} (
                            {expectedColumns.outputVariableType})
                          </li>
                        </ul>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedDatasetId && datasetVersions && datasetVersions.length > 0 && (
        <FormField
          control={form.control}
          name="datasetVersion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>数据集版本（可选）</FormLabel>
              <Select
                onValueChange={(value) => {
                  if (value === "latest") {
                    field.onChange(undefined);
                  } else {
                    field.onChange(new Date(value));
                  }
                }}
                value={field.value ? field.value.toISOString() : "latest"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="最新版本" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="latest">
                    最新版本（默认）
                  </SelectItem>
                  {datasetVersions.map((version) => (
                    <SelectItem
                      key={version.toISOString()}
                      value={version.toISOString()}
                    >
                      {format(version, "yyyy-MM-dd HH:mm")} (UTC)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                使用数据集在特定时间点的状态运行实验。默认为最新版本。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {selectedDatasetId && (
        <>
          {validationResult?.isValid === false && (
            <Card className="border-dark-yellow bg-light-yellow relative overflow-hidden rounded-md shadow-none group-data-[collapsible=icon]:hidden">
              <CardHeader className="p-2">
                <CardTitle className="text-dark-yellow flex items-center justify-between text-sm">
                  <span>配置无效</span>
                  <Info className="h-4 w-4" />
                </CardTitle>
                <CardDescription className="text-foreground">
                  {validationResult?.message}
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          {validationResult?.isValid === true && (
            <Card className="border-dark-green bg-light-green relative overflow-hidden rounded-md shadow-none group-data-[collapsible=icon]:hidden">
              <CardHeader className="p-2">
                <CardTitle className="text-dark-green flex items-center justify-between text-sm">
                  <span>配置有效</span>
                  <CircleCheck className="h-4 w-4" />
                </CardTitle>
                <div className="text-sm">
                  数据集条目与提示词变量/占位符的匹配情况
                  <ul className="my-2 ml-2 list-inside list-disc">
                    {Object.entries(validationResult.variablesMap ?? {}).map(
                      ([variable, count]) => (
                        <li key={variable}>
                          <strong>{variable}:</strong> {count} /{" "}
                          {validationResult?.isValid
                            ? validationResult.totalItems
                            : "未知"}
                        </li>
                      ),
                    )}
                  </ul>
                  缺少所有必需变量和占位符的条目将被排除在数据集运行之外。
                </div>
              </CardHeader>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
