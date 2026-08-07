import React from "react";
import Header from "@/src/components/layouts/header";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { ScoreConfigsTable } from "@/src/components/table/use-cases/score-configs";
import { OXELIA_DOCS_URL } from "@/src/features/oxelia51/constants";

export function ScoreConfigSettings({ projectId }: { projectId: string }) {
  const hasReadAccess = useHasProjectAccess({
    projectId: projectId,
    scope: "scoreConfigs:read",
  });

  if (!hasReadAccess) return null;

  return (
    <div id="score-configs">
      <Header title="评分配置" />
      <p className="mb-2 text-sm">
        评分配置定义了项目中可用于{" "}
        <a
          href={OXELIA_DOCS_URL}
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          标注
        </a>{" "}
        的评分。请注意,所有评分配置均不可更改。
      </p>
      <ScoreConfigsTable projectId={projectId} />
    </div>
  );
}
