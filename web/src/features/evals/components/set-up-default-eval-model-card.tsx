import { CardContent } from "@/src/components/ui/card";
import { Card } from "@/src/components/ui/card";
import { ManageDefaultEvalModel } from "@/src/features/evals/components/manage-default-eval-model";

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
                href="https://langfuse.com/docs/evaluation/evaluation-methods/llm-as-a-judge#how-llm-as-a-judge-works"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Learn more.
              </a>
            </>
          }
          variant="color-coded"
        />
        <p className="text-dark-yellow/70 text-xs">
          This evaluator expects to use the default evaluation model for your
          project.
        </p>
      </CardContent>
    </Card>
  );
}
