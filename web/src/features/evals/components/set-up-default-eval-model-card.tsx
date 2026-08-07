import { CardContent } from "@/src/components/ui/card";
import { Card } from "@/src/components/ui/card";
import { ManageDefaultEvalModel } from "@/src/features/evals/components/manage-default-eval-model";
import { OXELIA_DOCS_URL } from "@/src/features/oxelia51/constants";

export function SetupDefaultEvalModelCard({
  projectId,
}: {
  projectId: string;
}) {
  return (
    <Card className="border-dark-yellow bg-light-yellow mt-2">
      <CardContent className="mt-2 flex flex-col gap-1">
        <ManageDefaultEvalModel
          projectId={projectId}
          setUpMessage={
            <>
              未设置默认模型。自动评估需要模型连接来进行评分。
              此默认模型将用于所有未指定自身模型的模板。{" "}
              <a
                href={OXELIA_DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                了解更多。
              </a>
            </>
          }
          variant="color-coded"
        />
        <p className="text-dark-yellow/70 text-xs">
          此评估器预期使用您项目的默认评估模型。
        </p>
      </CardContent>
    </Card>
  );
}
