// Redirect helper for /trace/[traceId] URLs
// Looks up the projectId for a trace and redirects to /project/[projectId]/traces/[traceId]
// which displays the current trace view

import { ErrorPage } from "@/src/components/error-page";
import { getTracesByIdsForAnyProject } from "@langfuse/shared/src/server";
import { type GetServerSideProps } from "next";
import { useRouter } from "next/router";

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (!context.params) {
    return {
      props: {
        notFound: true,
      },
    };
  }

  const traceId = context.params.traceId as string;

  const traces = await getTracesByIdsForAnyProject([traceId]);

  if (!traces || traces.length === 0) {
    return {
      props: {
        notFound: true,
      },
    };
  }

  if (traces.length > 1) {
    return {
      props: {
        duplicatesFound: true,
      },
    };
  }

  return {
    redirect: {
      destination: `/project/${traces[0].projectId}/traces/${traceId}`,
      permanent: false,
    },
  };
};

const TraceRedirectPage = ({
  notFound,
  duplicatesFound,
}: {
  notFound?: boolean;
  duplicatesFound?: boolean;
}) => {
  const router = useRouter();
  if (router.isFallback) {
    return <div className="p-3">加载中...</div>;
  }

  if (notFound) {
    return (
      <ErrorPage
        title="未找到追踪"
        message="该追踪可能仍在处理中，或已被删除。"
        additionalButton={{
          label: "重试",
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  if (duplicatesFound) {
    return (
      <ErrorPage
        title="未找到追踪"
        message="请升级 SDK，因为 URL 结构已更改。"
      />
    );
  }

  return null;
};

export default TraceRedirectPage;
