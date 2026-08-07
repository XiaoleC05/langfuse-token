import { PostHogLogo } from "@/src/components/PosthogLogo";
import Header from "@/src/components/layouts/header";
import ContainerPage from "@/src/components/layouts/container-page";
import { StatusBadge } from "@/src/components/layouts/status-badge";
import { Button } from "@/src/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { PasswordInput } from "@/src/components/ui/password-input";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { posthogIntegrationFormSchema } from "@/src/features/posthog-integration/types";
import {
  AnalyticsIntegrationExportSource,
  validateExportSource,
  type ExportSourceContext,
} from "@langfuse/shared";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
// Shared export-source UI adapters; policy in export-source-policy.ts.
import {
  getExportSourceOptions,
  getExportSourceUnavailableMessage,
  isExportSourceSelectable,
  shouldHideExportSourceSelector,
} from "@/src/features/analytics-integrations/exportSource";
import { useV4Beta } from "@/src/features/events/hooks/useV4Beta";
import { useLangfuseCloudRegion } from "@/src/features/organizations/hooks";
import { useQueryProject } from "@/src/features/projects/hooks";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { api } from "@/src/utils/api";
import { type RouterOutput } from "@/src/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/src/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import { Info, ExternalLink } from "lucide-react";
import { OXELIA_DOCS_URL } from "@/src/features/oxelia51/constants";

export default function PosthogIntegrationSettings() {
  const router = useRouter();
  const projectId = router.query.projectId as string;

  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "integrations:CRUD",
  });
  const state = api.posthogIntegration.get.useQuery(
    { projectId },
    {
      enabled: hasAccess,
    },
  );

  const status =
    state.isLoading || !hasAccess
      ? undefined
      : state.data?.config?.enabled
        ? "active"
        : "inactive";

  return (
    <ContainerPage
      headerProps={{
        title: "PostHog 集成",
        breadcrumb: [
          { name: "设置", href: `/project/${projectId}/settings` },
        ],
        actionButtonsLeft: <>{status && <StatusBadge type={status} />}</>,
        actionButtonsRight: (
          <Button asChild variant="secondary">
            <Link href={OXELIA_DOCS_URL}>
              集成文档 ↗
            </Link>
          </Button>
        ),
      }}
    >
      <p className="text-primary mb-4 text-sm">
        我们已与{" "}
        <Link href="https://posthog.com" className="underline">
          PostHog
        </Link>{" "}
        （开源产品分析）合作，使 Langfuse 的事件/指标可用于您的 PostHog 仪表板。激活后，您项目的所有历史数据将被同步。初始同步后，新数据将每小时自动同步，以保持您的 PostHog 仪表板为最新状态。
      </p>
      {!hasAccess && (
        <p className="text-sm">
          您当前的角色无权访问这些设置，请联系您的项目管理员或所有者。
        </p>
      )}
      {hasAccess && (
        <>
          <Header title="配置" />
          <Card className="p-3">
            <PostHogLogo className="text-foreground mb-4 w-36" />
            <PostHogIntegrationSettings
              state={state.data?.config ?? undefined}
              projectId={projectId}
              isLoading={state.isLoading}
              legacyWritesActive={state.data?.legacyWritesActive ?? true}
            />
          </Card>
        </>
      )}
      {state.data?.config?.enabled && (
        <>
          <Header title="状态" className="mt-8" />
          <p className="text-primary text-sm">
            数据已同步至：{" "}
            {state.data?.config?.lastSyncAt
              ? new Date(state.data.config.lastSyncAt).toLocaleString()
              : "从未（待处理）"}
          </p>
        </>
      )}
    </ContainerPage>
  );
}

const PostHogIntegrationSettings = ({
  state,
  projectId,
  isLoading,
  legacyWritesActive,
}: {
  state?: NonNullable<RouterOutput["posthogIntegration"]["get"]["config"]>;
  projectId: string;
  isLoading: boolean;
  legacyWritesActive: boolean;
}) => {
  const capture = usePostHogClientCapture();
  const { isBetaEnabled } = useV4Beta();
  const { isLangfuseCloud } = useLangfuseCloudRegion();
  const { project } = useQueryProject();

  // Policy context; EVENTS is always accepted by this router, hence
  // enrichedAvailable: true (see export-source-policy.ts).
  const projectCreatedAt = project?.createdAt;
  const exportSourceCtx: ExportSourceContext = useMemo(
    () => ({
      isCloud: isLangfuseCloud,
      enrichedAvailable: true,
      legacyWritesActive,
      projectCreatedAt: projectCreatedAt
        ? new Date(projectCreatedAt)
        : undefined,
    }),
    [isLangfuseCloud, legacyWritesActive, projectCreatedAt],
  );
  const legacyValidation = validateExportSource(
    AnalyticsIntegrationExportSource.TRACES_OBSERVATIONS,
    exportSourceCtx,
  );
  // Post-cutoff Cloud projects: field hidden, form value pinned to EVENTS via
  // the default below (LFE-9688 / 9830 behavior, unchanged).
  const isPostCutoffCloud =
    !legacyValidation.ok && legacyValidation.reason === "cloud-cutoff";
  const exportSourceOptions = getExportSourceOptions(
    state?.exportSource ?? null,
    exportSourceCtx,
  );
  // Selector is beta-gated, except a persisted source blocked by capability
  // forces it visible so the blocked-save alert has something to point at.
  const persistedBlockedByCapability =
    state?.exportSource != null &&
    !isPostCutoffCloud &&
    !isExportSourceSelectable(state.exportSource, exportSourceCtx);
  const showExportSourceField =
    ((isBetaEnabled && !isPostCutoffCloud) || persistedBlockedByCapability) &&
    !shouldHideExportSourceSelector(exportSourceOptions);

  // Blocked-save validation instead of silent rewrite (LFE-10296).
  const formSchema = useMemo(
    () =>
      posthogIntegrationFormSchema.superRefine((data, ctx) => {
        // The credential is write-only: blank keeps the saved key, so it is
        // only required when no integration exists yet (LFE-14384).
        if (!state && !data.posthogProjectApiKey) {
          ctx.addIssue({
            code: "custom",
            path: ["posthogProjectApiKey"],
            message: "PostHog 项目 API 密钥为必填项",
          });
        }
        if (!isExportSourceSelectable(data.exportSource, exportSourceCtx)) {
          ctx.addIssue({
            code: "custom",
            path: ["exportSource"],
            message:
              "此导出源在此部署中不可用。请选择可用的导出源以保存。",
          });
        }
      }),
    [exportSourceCtx, state],
  );

  const defaultExportSource = isPostCutoffCloud
    ? AnalyticsIntegrationExportSource.EVENTS
    : (state?.exportSource ??
      (isBetaEnabled || !legacyWritesActive
        ? AnalyticsIntegrationExportSource.EVENTS
        : AnalyticsIntegrationExportSource.TRACES_OBSERVATIONS));

  const posthogForm = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      posthogHostname: state?.posthogHostName ?? "",
      posthogProjectApiKey: "",
      enabled: state?.enabled ?? false,
      exportSource: defaultExportSource,
    },
    disabled: isLoading,
  });

  useEffect(() => {
    posthogForm.reset({
      posthogHostname: state?.posthogHostName ?? "",
      posthogProjectApiKey: "",
      enabled: state?.enabled ?? false,
      exportSource: defaultExportSource,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const watchedExportSource = posthogForm.watch("exportSource");
  const watchedValidation =
    watchedExportSource != null
      ? validateExportSource(watchedExportSource, exportSourceCtx)
      : ({ ok: true } as const);

  const utils = api.useUtils();
  const mut = api.posthogIntegration.update.useMutation({
    onSuccess: () => {
      utils.posthogIntegration.invalidate();
    },
  });
  const mutDelete = api.posthogIntegration.delete.useMutation({
    onSuccess: () => {
      utils.posthogIntegration.invalidate();
    },
  });

  async function onSubmit(
    values: z.infer<typeof posthogIntegrationFormSchema>,
  ) {
    capture("integrations:posthog_form_submitted");
    mut.mutate({
      projectId,
      ...values,
    });
  }

  return (
    <Form {...posthogForm}>
      <form className="space-y-3" onSubmit={posthogForm.handleSubmit(onSubmit)}>
        <FormField
          control={posthogForm.control}
          name="posthogHostname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PostHog 主机名</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                美国区域：https://us.posthog.com；欧盟区域：
                https://eu.posthog.com
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={posthogForm.control}
          name="posthogProjectApiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PostHog 项目 API 密钥</FormLabel>
              <FormControl>
                <PasswordInput
                  {...field}
                  placeholder={state?.posthogApiKeyDisplay}
                />
              </FormControl>
              {state && (
                <FormDescription>
                  留空以保留当前 API 密钥。
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        {showExportSourceField && (
          <FormField
            control={posthogForm.control}
            name="exportSource"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5 pt-2">
                  导出源
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="text-muted-foreground h-3.5 w-3.5" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="max-w-[350px] space-y-2 p-3"
                    >
                      {exportSourceOptions.map((option) => (
                        <div key={option.value} className="space-y-0.5">
                          <div className="font-bold">{option.label}</div>
                          <div className="text-muted-foreground text-xs">
                            {option.description}
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-2">
                        <a
                          href={OXELIA_DOCS_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-xs hover:underline"
                        >
                          了解更多信息，请参阅
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择要导出的数据" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {exportSourceOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={option.unavailable}
                      >
                        {option.unavailable
                          ? `${option.label}（此部署不可用）`
                          : option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  选择要导出到 PostHog 的数据源。评分始终包含在内。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {!watchedValidation.ok && (
          <Alert variant="destructive">
            <AlertTitle>已保存的导出源不再可用</AlertTitle>
            <AlertDescription>
              {getExportSourceUnavailableMessage(watchedValidation.reason)}
            </AlertDescription>
          </Alert>
        )}
        <FormField
          control={posthogForm.control}
          name="enabled"
          render={({ field }) => (
            <FormItem>
              <FormLabel>启用</FormLabel>
              <FormControl>
                <div className="mt-1 ml-4">
                  <Switch
                    id="posthog-integration-enabled"
                    checked={field.value}
                    onCheckedChange={() => {
                      field.onChange(!field.value);
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
      <div className="mt-8 flex gap-2">
        <Button
          loading={mut.isPending}
          onClick={posthogForm.handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          保存
        </Button>
        <Button
          variant="ghost"
          loading={mutDelete.isPending}
          disabled={isLoading || !!!state}
          onClick={() => {
            if (
              confirm(
                "确定要重置此项目的 PostHog 集成吗？",
              )
            )
              mutDelete.mutate({ projectId });
          }}
        >
          重置
        </Button>
      </div>
    </Form>
  );
};
