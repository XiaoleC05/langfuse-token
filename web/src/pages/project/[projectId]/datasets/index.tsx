import { useRouter } from "next/router";
import { DatasetsTable } from "@/src/features/datasets/components/DatasetsTable";
import Page from "@/src/components/layouts/page";
import { DatasetActionButton } from "@/src/features/datasets/components/DatasetActionButton";
import { api } from "@/src/utils/api";
import { DatasetsOnboarding } from "@/src/components/onboarding/DatasetsOnboarding";
import { useQueryParam, StringParam } from "use-query-params";
import { OXELIA_DOCS_URL } from "@/src/features/oxelia51/constants";

export default function Datasets() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const [currentFolderPath] = useQueryParam("folder", StringParam);

  // Check if the project has any datasets
  const { data: hasAnyDataset, isLoading } = api.datasets.hasAny.useQuery(
    { projectId },
    {
      enabled: !!projectId,
      trpc: {
        context: {
          skipBatch: true,
        },
      },
    },
  );

  const showOnboarding = !isLoading && !hasAnyDataset;

  if (showOnboarding) {
    return (
      <Page
        headerProps={{
          title: "数据集",
          help: {
            description:
              "数据集是 Langfuse 中 LLM 应用程序的输入（及预期输出）集合，用于在生产部署前对新版本进行基准测试。详见文档。",
            href: OXELIA_DOCS_URL,
          },
        }}
        scrollable
      >
        <DatasetsOnboarding projectId={projectId} />
      </Page>
    );
  }

  return (
    <Page
      headerProps={{
        title: "数据集",
        help: {
          description:
            "数据集是 Langfuse 中 LLM 应用程序的输入（及预期输出）集合，用于在生产部署前对新版本进行基准测试。详见文档。",
          href: OXELIA_DOCS_URL,
        },
        actionButtonsRight: (
          <DatasetActionButton
            projectId={projectId}
            mode="create"
            folderPrefix={currentFolderPath || undefined}
          />
        ),
      }}
    >
      <DatasetsTable projectId={projectId} />
    </Page>
  );
}
