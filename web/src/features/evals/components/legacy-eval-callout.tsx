import { Callout } from "@/src/components/ui/callout";
import { Button } from "@/src/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";
import Link from "next/link";
import { useRouter } from "next/router";
import { Info } from "lucide-react";
import { isLegacyEvalTarget } from "@/src/features/evals/utils/typeHelpers";

interface LegacyEvalCalloutProps {
  projectId: string;
  evalConfigId: string;
  targetObject: string;
}

export function LegacyEvalCallout({
  projectId,
  evalConfigId,
  targetObject,
}: LegacyEvalCalloutProps) {
  const router = useRouter();
  const isDeprecated = isLegacyEvalTarget(targetObject);

  if (!isDeprecated) return null;

  return (
    <Callout
      id={`eval-remapping-peek-${evalConfigId}`}
      variant="warning"
      key="dismissed-eval-remapping-callouts"
      actions={() => (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(
                `/project/${projectId}/evals/remap?evaluator=${evalConfigId}`,
              )
            }
            className="text-dark-blue h-7 text-xs hover:opacity-80"
          >
            升级此评估器
          </Button>
        </>
      )}
    >
      <span>此评估器</span>
      <span className="text-dark-blue hover:opacity-80">
        <Link
          href="https://langfuse.com/faq/all/llm-as-a-judge-migration"
          target="_blank"
          rel="noopener noreferrer"
        >
          需要进行更改{" "}
        </Link>
      </span>
      <span>才能享受新功能和性能改进。</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="ml-1 inline h-4 w-4 cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          您的评估器在不升级的情况下将继续工作，但您将无法享受这些改进。
        </TooltipContent>
      </Tooltip>
    </Callout>
  );
}
