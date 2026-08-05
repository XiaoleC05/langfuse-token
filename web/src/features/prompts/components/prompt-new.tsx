import { StringParam, useQueryParam } from "use-query-params";
import { NewPromptForm } from "@/src/features/prompts/components/NewPromptForm";
import useProjectIdFromURL from "@/src/hooks/useProjectIdFromURL";
import { api } from "@/src/utils/api";
import Page from "@/src/components/layouts/page";

export const NewPrompt = () => {
  const projectId = useProjectIdFromURL();
  const [initialPromptId] = useQueryParam("promptId", StringParam);

  const { data: initialPrompt, isLoading } = api.prompts.byId.useQuery(
    {
      projectId: projectId as string, // Typecast as query is enabled only when projectId is present
      id: initialPromptId ?? "",
    },
    {
      enabled: Boolean(initialPromptId && projectId),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );

  if (isLoading) {
    return <div className="p-3">加载中...</div>;
  }

  const breadcrumb: { name: string; href?: string }[] = [
    {
      name: "提示词",
      href: `/project/${projectId}/prompts/`,
    },
    {
      name: "新建提示词",
    },
  ];

  if (initialPrompt) {
    breadcrumb.pop(); // Remove "New prompt"
    breadcrumb.push(
      {
        name: initialPrompt.name,
        href: `/project/${projectId}/prompts/${encodeURIComponent(initialPrompt.name)}`,
      },
      { name: "新版本" },
    );
  }

  return (
    <Page
      withPadding
      scrollable
      headerProps={{
        title: initialPrompt
          ? `${initialPrompt.name} \u2014 \u65b0\u7248\u672c`
          : "\u65b0\u5efa\u63d0\u793a\u8bcd",
        help: {
          description:
            "\u5728 Langfuse \u4e2d\u7ba1\u7406\u548c\u7248\u672c\u5316\u60a8\u7684\u63d0\u793a\u8bcd\u3002\u901a\u8fc7 UI \u548c SDK \u7f16\u8f91\u548c\u66f4\u65b0\u5b83\u4eec\u3002\u901a\u8fc7 SDK \u83b7\u53d6\u751f\u4ea7\u7248\u672c\u3002\u5728\u6587\u6863\u4e2d\u4e86\u89e3\u66f4\u591a\u3002",
          href: "https://langfuse.com/docs/prompts",
        },
        breadcrumb: breadcrumb,
      }}
    >
      {initialPrompt ? (
        <p className="text-muted-foreground text-sm">
          Langfuse \u4e2d\u7684\u63d0\u793a\u8bcd\u662f\u4e0d\u53ef\u53d8\u7684\u3002\u8981\u66f4\u65b0\u63d0\u793a\u8bcd\uff0c\u8bf7\u521b\u5efa\u65b0\u7248\u672c\u3002
        </p>
      ) : null}
      <div className="my-8">
        <NewPromptForm {...{ initialPrompt }} />
      </div>
    </Page>
  );
};
