import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { CheckIcon, ChevronDown, Code2, Cog, Wand2 } from "lucide-react";
import { api } from "@/src/utils/api";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/src/components/ui/card";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/src/components/ui/dialog";
import {
  InputCommand,
  InputCommandEmpty,
  InputCommandGroup,
  InputCommandInput,
  InputCommandItem,
  InputCommandList,
} from "@/src/components/ui/input-command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import Link from "next/link";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { type CreateExperiment } from "@/src/features/experiments/types";
import { MultiStepExperimentForm } from "@/src/features/experiments/components/MultiStepExperimentForm";
import { RemoteExperimentUpsertForm } from "@/src/features/experiments/components/RemoteExperimentUpsertForm";
import { RemoteExperimentTriggerModal } from "@/src/features/experiments/components/RemoteExperimentTriggerModal";
import { useExperimentAccess } from "@/src/features/experiments/hooks/useExperimentAccess";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/utils/tailwind";
import { OXELIA_DOCS_URL } from "@/src/features/oxelia51/constants";

export const CreateExperimentsForm = ({
  projectId,
  setFormOpen,
  defaultValues = {},
  promptDefault,
  handleExperimentSettled,
  handleExperimentSuccess,
  showSDKRunInfoPage = false,
}: {
  projectId: string;
  setFormOpen: (open: boolean) => void;
  defaultValues?: Partial<Pick<CreateExperiment, "promptId" | "datasetId">>;
  promptDefault?: {
    name: string;
    version: number;
  };
  handleExperimentSuccess?: (data?: {
    success: boolean;
    datasetId: string;
    runId: string;
    runName: string;
  }) => Promise<void>;
  handleExperimentSettled?: (data?: {
    success: boolean;
    datasetId: string;
    runId: string;
    runName: string;
  }) => Promise<void>;
  showSDKRunInfoPage?: boolean;
}) => {
  const capture = usePostHogClientCapture();
  const { isExperimentsBetaActive, isInitializing } = useExperimentAccess();
  const [showPromptForm, setShowPromptForm] = useState(false);
  const [showRemoteExperimentUpsertForm, setShowRemoteExperimentUpsertForm] =
    useState(false);
  const [
    showRemoteExperimentTriggerModal,
    setShowRemoteExperimentTriggerModal,
  ] = useState(false);
  const [datasetPopoverOpen, setDatasetPopoverOpen] = useState(false);

  const hasExperimentWriteAccess = useHasProjectAccess({
    projectId,
    scope: "promptExperiments:CUD",
  });
  const fixedDatasetId = defaultValues.datasetId;
  const [remoteExperimentDataset, setRemoteExperimentDataset] = useState<
    { id: string; name?: string } | undefined
  >(fixedDatasetId ? { id: fixedDatasetId } : undefined);
  const datasetId = fixedDatasetId ?? remoteExperimentDataset?.id;
  const remoteExperimentDatasets = api.datasets.allDatasetMeta.useQuery(
    { projectId },
    {
      enabled:
        showSDKRunInfoPage && !fixedDatasetId && hasExperimentWriteAccess,
      trpc: {
        context: {
          skipBatch: true,
        },
      },
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
    },
  );
  const selectedRemoteExperimentDataset = remoteExperimentDatasets.data?.find(
    (dataset) => dataset.id === remoteExperimentDataset?.id,
  );

  const existingRemoteExperiment = api.datasets.getRemoteExperiment.useQuery(
    {
      projectId,
      datasetId: datasetId as string,
    },
    {
      enabled: !!datasetId,
    },
  );
  const isRemoteExperimentLoading =
    !!datasetId &&
    (existingRemoteExperiment.isLoading || existingRemoteExperiment.isFetching);
  const hasRemoteExperiment = !!existingRemoteExperiment.data;
  const isRemoteExperimentEnabled =
    existingRemoteExperiment.data?.enabled !== false;
  const webhookActionLabel = isRemoteExperimentLoading
    ? "加载中..."
    : hasRemoteExperiment
      ? "运行"
      : "配置";

  if (!hasExperimentWriteAccess) {
    return null;
  }

  if (
    existingRemoteExperiment.isLoading &&
    !!datasetId &&
    !showSDKRunInfoPage
  ) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (
    showSDKRunInfoPage &&
    !showPromptForm &&
    !showRemoteExperimentUpsertForm &&
    !showRemoteExperimentTriggerModal
  ) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>运行实验</DialogTitle>
          <DialogDescription>
            实验允许您在数据集上测试应用或提示词的迭代版本。了解更多关于实验的信息{" "}
            <Link
              href={OXELIA_DOCS_URL}
              target="_blank"
              className="underline"
            >
              点击此处
            </Link>
            。
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="pb-8">
          <div className="mt-4 grid grid-cols-2 grid-rows-1 gap-2">
            <Card className="flex flex-1 flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wand2 className="size-4" />
                  通过用户界面
                </CardTitle>
                <CardDescription>
                  通过 Langfuse 界面测试单个提示词和模型配置。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-muted-foreground list-disc space-y-2 pl-4 text-sm">
                  <li>对比提示词版本</li>
                  <li>对比模型配置</li>
                  <li>无需代码</li>
                </ul>
              </CardContent>
              <CardFooter className="mt-auto flex flex-row gap-2">
                <Button
                  className="w-full"
                  onClick={() => {
                    setShowPromptForm(true);
                    setShowRemoteExperimentUpsertForm(false);
                    setShowRemoteExperimentTriggerModal(false);
                  }}
                >
                  配置
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                  onClick={() =>
                    capture("dataset_run:view_prompt_experiment_docs")
                  }
                >
                  <Link href={OXELIA_DOCS_URL}>
                    查看文档
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex flex-1 flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Code2 className="size-4" />
                  通过 Webhook
                </CardTitle>
                <CardDescription>
                  设置实验 Webhook，从 Langfuse 启动远程实验。您的服务会接收选定的数据集和运行配置，执行实验，并将结果返回。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-muted-foreground list-disc space-y-2 pl-4 text-sm">
                  <li>在您的服务中运行自定义评估逻辑</li>
                  <li>将实验结果保存在 Langfuse</li>
                </ul>
                {!fixedDatasetId ? (
                  <div className="mt-4 space-y-2">
                    <div className="text-sm font-bold">数据集</div>
                    <Popover
                      open={datasetPopoverOpen}
                      onOpenChange={setDatasetPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={datasetPopoverOpen}
                          disabled={
                            remoteExperimentDatasets.isPending ||
                            remoteExperimentDatasets.data?.length === 0
                          }
                          className="w-full justify-between px-2 font-normal"
                        >
                          {remoteExperimentDatasets.isPending
                            ? "加载数据集中"
                            : (selectedRemoteExperimentDataset?.name ??
                              remoteExperimentDataset?.name ??
                              "选择数据集")}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-(--radix-popover-trigger-width) overflow-auto p-0"
                        align="start"
                      >
                        <InputCommand>
                          <InputCommandInput
                            placeholder="搜索数据集..."
                            className="h-9"
                            variant="bottom"
                          />
                          <InputCommandList>
                            <InputCommandEmpty>
                              未找到数据集。
                            </InputCommandEmpty>
                            <InputCommandGroup>
                              {remoteExperimentDatasets.data?.map((dataset) => (
                                <InputCommandItem
                                  key={dataset.id}
                                  value={dataset.name}
                                  onSelect={() => {
                                    setRemoteExperimentDataset({
                                      id: dataset.id,
                                      name: dataset.name,
                                    });
                                    setDatasetPopoverOpen(false);
                                  }}
                                >
                                  {dataset.name}
                                  <CheckIcon
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      dataset.id === datasetId
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
                  </div>
                ) : null}
              </CardContent>
              <CardFooter className="mt-auto flex flex-row gap-2">
                {hasRemoteExperiment && !isRemoteExperimentLoading ? (
                  <div className="flex w-full items-start">
                    <Button
                      className="w-full rounded-r-none"
                      disabled={!datasetId || !isRemoteExperimentEnabled}
                      title={
                        isRemoteExperimentEnabled
                          ? undefined
                          : "请编辑并启用 webhook"
                      }
                      onClick={() => {
                        if (!datasetId || !isRemoteExperimentEnabled) return;
                        setShowRemoteExperimentTriggerModal(true);
                      }}
                    >
                      Run
                    </Button>
                    <Button
                      aria-label="编辑远程触发器设置"
                      className="rounded-l-none rounded-r-md border-l-2 px-2"
                      title="编辑远程触发器设置"
                      onClick={() => setShowRemoteExperimentUpsertForm(true)}
                    >
                      <Cog className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    disabled={!datasetId || isRemoteExperimentLoading}
                    onClick={() => {
                      if (!datasetId || isRemoteExperimentLoading) return;
                      setShowRemoteExperimentUpsertForm(true);
                    }}
                  >
                    {webhookActionLabel}
                  </Button>
                )}
                <Button
                  className="w-full"
                  variant="outline"
                  asChild
                  onClick={() =>
                    capture("dataset_run:view_custom_experiment_docs")
                  }
                >
                  <Link
                    href={OXELIA_DOCS_URL}
                    target="_blank"
                  >
                    查看文档
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </DialogBody>
      </>
    );
  }

  if (
    showRemoteExperimentTriggerModal &&
    datasetId &&
    existingRemoteExperiment.data
  ) {
    return (
      <RemoteExperimentTriggerModal
        projectId={projectId}
        datasetId={datasetId}
        remoteExperimentConfig={existingRemoteExperiment.data}
        setShowTriggerModal={setShowRemoteExperimentTriggerModal}
      />
    );
  }

  if (showRemoteExperimentUpsertForm && datasetId) {
    return (
      <RemoteExperimentUpsertForm
        projectId={projectId}
        datasetId={datasetId}
        existingRemoteExperiment={existingRemoteExperiment.data}
        setShowRemoteExperimentUpsertForm={setShowRemoteExperimentUpsertForm}
      />
    );
  }

  return (
    <MultiStepExperimentForm
      projectId={projectId}
      setFormOpen={setFormOpen}
      defaultValues={defaultValues}
      promptDefault={promptDefault}
      handleExperimentSettled={handleExperimentSettled}
      handleExperimentSuccess={handleExperimentSuccess}
      enableLegacyNameValidation={!isInitializing && !isExperimentsBetaActive}
    />
  );
};
