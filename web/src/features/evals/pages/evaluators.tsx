import Page from "@/src/components/layouts/page";
import { useRouter } from "next/router";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { Plus } from "lucide-react";
import EvaluatorTable from "@/src/features/evals/components/evaluator-table";
import {
  getEvalsTabs,
  EVALS_TABS,
} from "@/src/features/navigation/utils/evals-tabs";
import { ActionButton } from "@/src/components/ActionButton";
import { api } from "@/src/utils/api";
import { useEntitlementLimit } from "@/src/features/entitlements/hooks";
import { SupportOrUpgradePage } from "@/src/ee/features/billing/components/SupportOrUpgradePage";
import { EvaluatorsOnboarding } from "@/src/components/onboarding/EvaluatorsOnboarding";
import { ManageDefaultEvalModel } from "@/src/features/evals/components/manage-default-eval-model";
import { V4MigrationModal } from "@/src/features/v4-migration/V4MigrationModal";
import { OXELIA_DOCS_URL } from "@/src/features/oxelia51/constants";

export default function EvaluatorsPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;

  const evaluatorLimit = useEntitlementLimit(
    "model-based-evaluations-count-evaluators",
  );
  const hasWriteAccess = useHasProjectAccess({
    projectId,
    scope: "evalJob:CUD",
  });

  const hasReadAccess = useHasProjectAccess({
    projectId,
    scope: "evalJob:read",
  });

  // Fetch counts of evaluator configs and templates
  const countsQuery = api.evals.counts.useQuery(
    {
      projectId,
    },
    {
      enabled: !!projectId,
      trpc: {
        context: {
          skipBatch: true,
        },
      },
    },
  );

  const showOnboarding =
    countsQuery.data?.configCount === 0 &&
    countsQuery.data?.templateCount === 0;

  if (!hasReadAccess) {
    return <SupportOrUpgradePage />;
  }

  if (showOnboarding) {
    return (
      <Page
        headerProps={{
          title: "评估器",
          help: {
            description:
              "配置一个 langfuse 管理的或自定义的评估器，用于评估传入的追踪数据。",
            href: OXELIA_DOCS_URL,
          },
        }}
        scrollable
      >
        <EvaluatorsOnboarding projectId={projectId} />
      </Page>
    );
  }

  return (
    <>
      <V4MigrationModal />
      <Page
        headerProps={{
          title: "评估器",
          help: {
            description:
              "配置一个 langfuse 管理的或自定义的评估器，用于评估传入的追踪数据。",
            href: OXELIA_DOCS_URL,
          },
          tabsProps: {
            tabs: getEvalsTabs(projectId),
            activeTab: EVALS_TABS.CONFIGS,
          },
          actionButtonsRight: (
            <>
              <ManageDefaultEvalModel projectId={projectId} />
              <ActionButton
                hasAccess={hasWriteAccess}
                href={`/project/${projectId}/evals/new`}
                icon={<Plus className="h-4 w-4" />}
                trackingEventName="eval_config:new_form_open"
                variant="default"
                usageLimit={
                  typeof evaluatorLimit === "number"
                    ? {
                        current: countsQuery.data?.configActiveCount ?? 0,
                        max: evaluatorLimit,
                      }
                    : undefined
                }
              >
                设置评估器
              </ActionButton>
            </>
          ),
        }}
      >
        <EvaluatorTable projectId={projectId} />
      </Page>
    </>
  );
}
