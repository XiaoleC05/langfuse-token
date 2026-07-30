import { type ReactNode } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  ChevronRight,
  Copy,
  LibraryBig,
  LifeBuoy,
  TriangleAlert,
} from "lucide-react";
import { useSupportDrawer } from "@/src/features/support-chat/SupportDrawerProvider";
import { Button } from "@/src/components/ui/button";
import { RainbowButton } from "@/src/components/magicui/rainbow-button";
import { Separator } from "@/src/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { cn } from "@/src/utils/tailwind";
import {
  formatSdkUpgradeRequirement,
  formatSdkVersion,
  type V4MigrationSdkState,
} from "@/src/features/v4-migration/sdkVersionStatus";
import { useProjectV4MigrationData } from "@/src/features/v4-migration/hooks/useV4MigrationData";
import {
  V4_MIGRATION_LOOKBACK_DAYS,
  type MigrationCountState,
} from "@/src/features/v4-migration/migrationData";
import { numberFormatter } from "@/src/utils/numbers";
import { formatCompactRelativeTime } from "@/src/utils/dates";
import { useProject } from "@/src/features/projects/hooks";

// Single source of truth for the v4-migration copy and content. Both surfaces
// (side panel and modal) render these components — edit copy here only.

const V4_DOCS_URL = "https://langfuse.com/docs/v4";
const SDK_UPGRADE_URL =
  "https://langfuse.com/docs/observability/sdk/upgrade-path";
const OTEL_V4_MIGRATION_URL =
  "https://langfuse.com/integrations/native/opentelemetry/migration-to-v4";
const DEPRECATED_API_MIGRATION_URL =
  "https://langfuse.com/faq/all/deprecated-api-migration";
const DEPRECATED_INTEGRATION_MIGRATION_URLS: Record<string, string> = {
  PostHog:
    "https://langfuse.com/integrations/analytics/posthog#migrate-export-source",
  Mixpanel:
    "https://langfuse.com/integrations/analytics/mixpanel#migrate-export-source",
  "Blob Storage":
    "https://langfuse.com/docs/api-and-data-platform/features/export-to-blob-storage#upgrade-path",
};

const CODING_AGENT_PROMPT = `Migrate this project's Langfuse setup to v4:
1. Upgrade the Langfuse SDK to the latest major version. Upgrade guide: ${SDK_UPGRADE_URL}
2. Repoint evals that target trace input/output to observations instead.
3. Replace calls to deprecated APIs (GET /api/public/traces, GET /api/public/sessions, GET /api/public/metrics) with their v4 replacements.
Docs: ${V4_DOCS_URL}`;

// Copies the agent migration prompt to the clipboard with toast + analytics;
// shared by the panel/modal header CTA and the status page.
export function useCopyMigrationPrompt() {
  const capture = usePostHogClientCapture();

  return async () => {
    capture("v4_migration:coding_agent_prompt_copied");
    await navigator.clipboard.writeText(CODING_AGENT_PROMPT);
    showSuccessToast({
      title: "提示词已复制",
      description: "将其粘贴到 Cursor、Codex 或其他编程代理中。",
    });
  };
}

function Chip({
  children,
  variant,
}: {
  children: ReactNode;
  variant: "warning" | "success";
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap",
        variant === "warning"
          ? "bg-light-yellow text-dark-yellow"
          : "bg-light-green text-dark-green",
      )}
    >
      {children}
    </span>
  );
}

function Section({
  title,
  chip,
  children,
}: {
  title: string;
  chip: ReactNode;
  children: ReactNode;
}) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="group flex w-full items-center gap-2.5 py-1.5 text-left">
        <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-90" />
        <span className="flex-1 text-sm">{title}</span>
        {chip}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-0.5 pb-3.5 pl-6.5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function MonoValue({ children }: { children: ReactNode }) {
  return <span className="text-foreground font-bold">{children}</span>;
}

function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("text-dark-blue hover:underline", className)}
    >
      {children}
    </a>
  );
}

function MigrationCountChip({
  state,
  affectedLabel,
}: {
  state: MigrationCountState;
  affectedLabel: string;
}) {
  if (state.status === "loading") {
    return <Chip variant="warning">检查中</Chip>;
  }
  if (state.status === "error") {
    return <Chip variant="warning">检查失败</Chip>;
  }
  if (state.count === 0) {
    return <Chip variant="success">已是最新</Chip>;
  }
  return (
    <Chip variant="warning">
      {state.count} {affectedLabel}
    </Chip>
  );
}

function V4MigrationSdkSection({ sdk }: { sdk: V4MigrationSdkState }) {
  const detectedSdkSeries = sdk.sdkUsageSeries.filter(
    (series) => series.canonicalSdkName !== null,
  );
  const chip =
    sdk.status === "latest" ? (
      <Chip variant="success">已是最新</Chip>
    ) : sdk.status === "otel_realtime" ? (
      <Chip variant="success">OTel 实时</Chip>
    ) : sdk.status === "checking" ? (
      <Chip variant="warning">检查中</Chip>
    ) : sdk.status === "otel_header_required" ? (
      <Chip variant="warning">需要 OTel 标头</Chip>
    ) : sdk.status === "unknown" ? (
      <Chip variant="warning">
        {detectedSdkSeries.length > 0 ? "需要复查" : "未检测到"}
      </Chip>
    ) : sdk.status === "error" ? (
      <Chip variant="warning">检查失败</Chip>
    ) : (
      <Chip variant="warning">{sdk.upgradeRequiredCount} 已过时</Chip>
    );

  return (
    <Section title="追踪插桩" chip={chip}>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {sdk.status === "checking" ? (
          "正在检查此项目的最新追踪…"
        ) : sdk.status === "otel_header_required" ? (
          <>
            OTel 数据正通过延迟摄入路径到达。请在 OTLP 导出器上将{" "}
            <MonoValue>x-langfuse-ingestion-version</MonoValue> 标头设置为{" "}
            <MonoValue>4</MonoValue> 以使用实时摄入。{" "}
            <ExternalLink href={OTEL_V4_MIGRATION_URL}>
              OpenTelemetry 迁移指南
            </ExternalLink>
            。
          </>
        ) : sdk.status === "otel_realtime" ? (
          "OTel 数据正在使用实时摄入。无需更新摄入标头。"
        ) : sdk.status === "unknown" ? (
          detectedSdkSeries.length > 0 ? (
            "我们无法识别所有检测到的 SDK 版本。请确认这些 SDK 已是最新版本。"
          ) : (
            <>
              在过去 7 天的追踪中未检测到标注了 Langfuse SDK 的数据。
              如果此项目使用了 Langfuse SDK，请确认它已是最新版本。
            </>
          )
        ) : sdk.status === "error" ? (
          "我们无法检查此项目的最新追踪。请稍后重试。"
        ) : sdk.status === "latest" ? (
          "所有检测到的 Langfuse SDK 版本均为最新。"
        ) : (
          <>
            {sdk.upgradeRequiredCount} 个检测到的 SDK{" "}
            {sdk.upgradeRequiredCount === 1
              ? "配置需要"
              : "配置需要"}{" "}
            更新。{" "}
            <ExternalLink href={SDK_UPGRADE_URL}>升级 SDK</ExternalLink>{" "}
            以获取实时数据和最新的追踪体验。
          </>
        )}
      </p>
      {detectedSdkSeries.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {detectedSdkSeries.map((series) => {
            const sdkLabel = formatSdkVersion({
              language: series.canonicalSdkName ?? series.sdkName,
              version: series.sdkVersion,
            });
            const publicKey =
              series.publicKey.length > 18
                ? `${series.publicKey.slice(0, 9)}…${series.publicKey.slice(-6)}`
                : series.publicKey || "无 API 密钥";

            return (
              <li
                key={`${series.sdkName}:${series.sdkVersion}:${series.publicKey}`}
                className="text-muted-foreground flex flex-wrap items-baseline gap-x-1.5 text-xs"
              >
                <MonoValue>{sdkLabel}</MonoValue>
                <span title={series.publicKey || undefined}>{publicKey}</span>
                <span>
                  · 最后出现{" "}
                  {formatCompactRelativeTime(new Date(series.lastSeen))}
                </span>
                {series.v4MigrationStatus === "upgrade_required" &&
                  !series.upgradeCompleted && (
                    <span className="text-dark-yellow">
                      · {formatSdkUpgradeRequirement(series.canonicalSdkName)}
                    </span>
                  )}
                {series.upgradeCompleted && <span>· 升级完成</span>}
                {series.v4MigrationStatus === "unknown" && (
                  <span className="text-dark-yellow">
                    · 版本无法识别
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

// Title, description, and the primary agent CTA.
export function V4MigrationHeaderContent({
  projectName,
}: {
  projectName?: string;
}) {
  const handleCopyPrompt = useCopyMigrationPrompt();

  return (
    <>
      <p className="mb-1.5 text-lg font-bold">
        {projectName ? (
          <>
            复查 <span className="underline">{projectName}</span> 的 v4 迁移
          </>
        ) : (
          "复查 v4 迁移"
        )}
      </p>
      <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
        查看以下项目，更新仍在使用旧数据模型的内容。
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <RainbowButton className="w-full" onClick={handleCopyPrompt}>
          <Copy className="mr-1.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 truncate" title="复制提示词给代理">
            复制提示词给代理
          </span>
        </RainbowButton>
      </div>
    </>
  );
}

// The "Want to review first?" and "What happens if I don't update" groups.
// onNavigate fires when an internal link is followed so the hosting surface
// (panel or modal) can close itself.
export function V4MigrationDetailsContent({
  onNavigate,
  projectId: projectIdProp,
}: {
  onNavigate?: () => void;
  /** Project the content links point at; falls back to the route project. */
  projectId?: string;
}) {
  const router = useRouter();
  const capture = usePostHogClientCapture();
  const { openWithMode: openSupportDrawerWithMode } = useSupportDrawer();

  const routeProjectId = router.query.projectId;
  const projectId =
    projectIdProp ??
    (typeof routeProjectId === "string" ? routeProjectId : undefined);
  const { organization } = useProject(projectId ?? null);
  const migrationData = useProjectV4MigrationData({
    projectId,
    orgId: organization?.id,
    enabled: Boolean(projectId),
  });

  const handleEmailEngineer = () => {
    capture("v4_migration:contact_support_clicked");
    onNavigate?.();
    openSupportDrawerWithMode("form", { topic: "V4 Migration" });
  };
  const evalsUrl =
    typeof projectId === "string" ? `/project/${projectId}/evals` : undefined;
  const integrationsUrl =
    typeof projectId === "string"
      ? `/project/${projectId}/settings/integrations`
      : undefined;

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-base font-bold">
          <LibraryBig className="h-4 w-4" /> 想先了解一下？
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="min-w-0 flex-1">
            <a href={V4_DOCS_URL} target="_blank" rel="noopener noreferrer">
              <span className="min-w-0 truncate" title="文档">
                文档
              </span>
            </a>
          </Button>
          <Button variant="outline" asChild className="min-w-0 flex-1">
            <Link href="/v4-migration" onClick={onNavigate}>
              <span className="min-w-0 truncate" title="检查迁移状态">
                检查迁移状态
              </span>
            </Link>
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-base font-bold">
          <TriangleAlert className="h-4 w-4" /> 如果不更新会怎样？
        </div>
        <p className="text-muted-foreground text-sm">
          部分功能将在{" "}
          <span className="text-dark-yellow">10 月 1 日</span> 后停止工作。
        </p>
        <div>
          <V4MigrationSdkSection sdk={migrationData.sdk} />

          <Section
            title="评估"
            chip={
              <MigrationCountChip
                state={migrationData.evals}
                affectedLabel="已弃用"
              />
            }
          >
            {migrationData.evals.status === "loading" ? (
              <p className="text-muted-foreground text-sm">
                正在检查已配置的评估…
              </p>
            ) : migrationData.evals.status === "error" ? (
              <p className="text-muted-foreground text-sm">
                无法检查已配置的评估。请稍后重试。
              </p>
            ) : migrationData.evals.count > 0 ? (
              <>
                <p className="text-muted-foreground mb-2 text-sm">
                  {migrationData.evals.count} 个已配置的评估以追踪的
                  输入/输出为目标，将在{" "}
                  <span className="text-dark-yellow">10 月 1 日</span> 停止运行。
                  请将其重定向到观察单元。
                </p>
                {evalsUrl ? (
                  <Link
                    href={evalsUrl}
                    onClick={onNavigate}
                    className="text-dark-blue text-sm hover:underline"
                  >
                    复查追踪级评估
                  </Link>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                未检测到已配置的追踪级评估。
              </p>
            )}
          </Section>

          <Section
            title="已弃用的 API"
            chip={
              <MigrationCountChip
                state={migrationData.apis}
                affectedLabel="已弃用"
              />
            }
          >
            {migrationData.apis.status === "loading" ? (
              <p className="text-muted-foreground text-sm">
                正在检查公共 API 使用情况…
              </p>
            ) : migrationData.apis.status === "error" ? (
              <p className="text-muted-foreground text-sm">
                无法检查公共 API 使用情况。请稍后重试。
              </p>
            ) : migrationData.apiUsage.length > 0 ? (
              <>
                <p className="text-muted-foreground mb-2 text-sm">
                  在过去 {V4_MIGRATION_LOOKBACK_DAYS} 天内调用过这些已弃用的接口。
                  它们将在{" "}
                  <span className="text-dark-yellow">10 月 1 日</span> 停止工作；
                  <ExternalLink href={DEPRECATED_API_MIGRATION_URL}>
                    迁移指南
                  </ExternalLink>{" "}
                  列出了每个接口的替代方案。
                </p>
                <div className="flex flex-col">
                  {migrationData.apiUsage.map((usage) => (
                    <div
                      key={usage.endpoint}
                      className="flex items-center justify-between gap-2 py-0.5"
                    >
                      <ExternalLink
                        href={DEPRECATED_API_MIGRATION_URL}
                        className="text-sm"
                      >
                        {usage.endpoint}
                      </ExternalLink>
                      <span className="text-muted-foreground text-xs whitespace-nowrap">
                        {numberFormatter(usage.count, 0, 2)} 次调用
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                在过去 {V4_MIGRATION_LOOKBACK_DAYS} 天内未检测到已弃用的公共 API 调用。
              </p>
            )}
          </Section>

          <Section
            title="已弃用的集成"
            chip={
              <MigrationCountChip
                state={migrationData.exports}
                affectedLabel="已弃用"
              />
            }
          >
            {migrationData.exports.status === "loading" ? (
              <p className="text-muted-foreground text-sm">
                正在检查集成…
              </p>
            ) : migrationData.exports.status === "error" ? (
              <p className="text-muted-foreground text-sm">
                无法检查集成。请稍后重试。
              </p>
            ) : migrationData.legacyIntegrations.length > 0 ? (
              <>
                <p className="text-muted-foreground mb-2 text-sm">
                  这些导出仍从旧数据源读取。切换它们可能会影响下游消费者的
                  接收内容，建议快速核查。
                </p>
                <div className="flex flex-col">
                  {migrationData.legacyIntegrations.map((name) => (
                    <div
                      key={name}
                      className="flex items-baseline gap-1.5 py-0.5"
                    >
                      {integrationsUrl ? (
                        <Link
                          href={integrationsUrl}
                          onClick={onNavigate}
                          className="text-dark-blue text-sm hover:underline"
                        >
                          {name}
                        </Link>
                      ) : (
                        <span className="text-sm">{name}</span>
                      )}
                      <span className="text-muted-foreground text-xs">·</span>
                      <ExternalLink
                        href={
                          DEPRECATED_INTEGRATION_MIGRATION_URLS[name] ??
                          V4_DOCS_URL
                        }
                        className="text-xs"
                      >
                        迁移指南
                      </ExternalLink>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                未检测到已弃用的集成导出。
              </p>
            )}
          </Section>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-base font-bold">
          <LifeBuoy className="h-4 w-4" /> 联系我们
        </div>
        <p className="text-muted-foreground text-sm">
          需要更新的帮助吗？我们随时为你服务！
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="min-w-0 flex-1">
            <a
              href="https://cal.com/team/langfuse/welcome-to-langfuse"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => capture("v4_migration:contact_book_call_clicked")}
            >
              <span className="min-w-0 truncate" title="预约通话">
                预约通话
              </span>
            </a>
          </Button>
          <Button
            variant="outline"
            className="min-w-0 flex-1"
            onClick={handleEmailEngineer}
          >
            <span className="min-w-0 truncate" title="联系工程师">
              联系工程师
            </span>
          </Button>
        </div>
      </div>
    </>
  );
}
