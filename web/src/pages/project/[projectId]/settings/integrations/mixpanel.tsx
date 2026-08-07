import { MixpanelLogo } from "@/src/components/MixpanelLogo";
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
import {
  mixpanelIntegrationFormSchema,
  MIXPANEL_REGIONS,
  type MixpanelRegion,
} from "@/src/features/mixpanel-integration/types";
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

export default function MixpanelIntegrationSettings() {
  const router = useRouter();
  const projectId = router.query.projectId as string;

  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "integrations:CRUD",
  });
  const state = api.mixpanelIntegration.get.useQuery(
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
        title: "Mixpanel 集成",
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
        与{" "}
        <Link href="https://mixpanel.com" className="underline">
          Mixpanel
        </Link>{" "}
        集成，同步您的 Langfuse 追踪、生成和评分数据，以进行高级产品分析。激活后，您项目的所有历史数据将被同步。初始同步后，新数据将每小时自动同步，以保持您的 Mixpanel 仪表板为最新状态。
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
            <MixpanelLogo className="text-foreground mb-4 w-20" />
            <MixpanelIntegrationSettingsForm
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

const MixpanelIntegrationSettingsForm = ({
  state,
  projectId,
  isLoading,
  legacyWritesActive,
}: {
  state?: NonNullable<RouterOutput["mixpanelIntegration"]["get"]["config"]>;
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
      mixpanelIntegrationFormSchema.superRefine((data, ctx) => {
        // The credential is write-only: blank keeps the saved token, so it is
        // only required when no integration exists yet (LFE-14384).
        if (!state && !data.mixpanelProjectToken) {
          ctx.addIssue({
            code: "custom",
            path: ["mixpanelProjectToken"],
            message: "Mixpanel 项目令牌为必填项",
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

  const mixpanelForm = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mixpanelRegion:
        (state?.mixpanelRegion as MixpanelRegion) ??
        MIXPANEL_REGIONS[0].subdomain,
      mixpanelProjectToken: "",
      enabled: state?.enabled ?? false,
      exportSource: defaultExportSource,
    },
    disabled: isLoading,
  });

  useEffect(() => {
    mixpanelForm.reset({
      mixpanelRegion:
        (state?.mixpanelRegion as MixpanelRegion) ??
        MIXPANEL_REGIONS[0].subdomain,
      mixpanelProjectToken: "",
      enabled: state?.enabled ?? false,
      exportSource: defaultExportSource,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const watchedExportSource = mixpanelForm.watch("exportSource");
  const watchedValidation =
    watchedExportSource != null
      ? validateExportSource(watchedExportSource, exportSourceCtx)
      : ({ ok: true } as const);

  const utils = api.useUtils();
  const mut = api.mixpanelIntegration.update.useMutation({
    onSuccess: () => {
      utils.mixpanelIntegration.invalidate();
    },
  });
  const mutDelete = api.mixpanelIntegration.delete.useMutation({
    onSuccess: () => {
      utils.mixpanelIntegration.invalidate();
    },
  });

  async function onSubmit(
    values: z.infer<typeof mixpanelIntegrationFormSchema>,
  ) {
    capture("integrations:mixpanel_form_submitted");
    mut.mutate({
      projectId,
      ...values,
    });
  }

  return (
    <Form {...mixpanelForm}>
      <form
        className="space-y-3"
        onSubmit={mixpanelForm.handleSubmit(onSubmit)}
      >
        <FormField
          control={mixpanelForm.control}
          name="mixpanelRegion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mixpanel 区域</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择区域" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MIXPANEL_REGIONS.map((region) => (
                    <SelectItem key={region.subdomain} value={region.subdomain}>
                      {region.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                选择您的项目所在的 Mixpanel 区域
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={mixpanelForm.control}
          name="mixpanelProjectToken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mixpanel 项目令牌</FormLabel>
              <FormControl>
                <PasswordInput
                  {...field}
                  placeholder={state?.mixpanelProjectTokenDisplay}
                />
              </FormControl>
              <FormDescription>
                {state
                  ? "留空以保留当前令牌。"
                  : "您可以在 Mixpanel 项目设置中找到您的项目令牌"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {showExportSourceField && (
          <FormField
            control={mixpanelForm.control}
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
                  选择要导出到 Mixpanel 的数据源。评分始终包含在内。
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
          control={mixpanelForm.control}
          name="enabled"
          render={({ field }) => (
            <FormItem>
              <FormLabel>启用</FormLabel>
              <FormControl>
                <div className="mt-1 ml-4">
                  <Switch
                    id="mixpanel-integration-enabled"
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
          onClick={mixpanelForm.handleSubmit(onSubmit)}
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
                "确定要重置此项目的 Mixpanel 集成吗？",
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
