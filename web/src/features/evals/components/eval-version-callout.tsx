import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { type EvalCapabilities } from "@/src/features/evals/hooks/useEvalCapabilities";
import {
  isTraceTarget,
  isEventTarget,
  isExperimentTarget,
  isDatasetTarget,
} from "@/src/features/evals/utils/typeHelpers";
import { OXELIA_DOCS_URL } from "@/src/features/oxelia51/constants";

interface EvalVersionCalloutProps {
  targetObject: string;
  evalCapabilities: EvalCapabilities;
}

interface CalloutContent {
  visible: boolean;
  title: string;
  description: React.ReactNode;
}

const getCalloutContent = (
  targetObject: string,
  evalCapabilities: EvalCapabilities,
): CalloutContent => {
  const hidden = { visible: false, title: "", description: "" };

  // For event/observation target
  if (isEventTarget(targetObject)) {
    if (evalCapabilities.isNewCompatible) {
      return hidden;
    }

    return {
      visible: true,
      title: "请验证您的 SDK 版本",
      description: (
        <>
          此评估器以观测为目标，需要 JS SDK v4+ 或 Python SDK v3+。
          您现在仍可以配置此评估器——升级后它将开始运行。{" "}
          <a
            href={OXELIA_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-dark-blue font-bold hover:opacity-80"
          >
            了解更多
          </a>
          。
        </>
      ),
    };
  }

  // For experiment target (Experiment Runner SDK)
  if (isExperimentTarget(targetObject)) {
    if (!evalCapabilities.isNewCompatible) {
      return {
        visible: true,
        title: "请验证您正在使用实验运行器 SDK",
        description: (
          <>
            实验运行器 SDK 需要 JS SDK v4.4+ 或 Python SDK v3.9+。
            您现在仍可以配置此评估器——升级后它将开始运行。{" "}
            <a
              href={OXELIA_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-dark-blue font-bold hover:opacity-80"
            >
              了解更多关于实验运行器 SDK 的信息。
            </a>
            。
          </>
        ),
      };
    }

    return hidden;
  }

  // For dataset target (legacy dataset run methods)
  if (isDatasetTarget(targetObject)) {
    return {
      visible: true,
      title: "旧版底层 SDK 方法",
      description: (
        <>
          此评估器针对的是使用旧版底层 SDK 方法的数据集运行中的追踪，
          这些运行手动将数据项关联到追踪。建议升级到实验运行器 SDK 以获得更好的性能和功能。{" "}
          <a
            href={OXELIA_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-dark-blue font-bold hover:opacity-80"
          >
            了解更多
          </a>
          。
        </>
      ),
    };
  }

  // For trace target
  if (isTraceTarget(targetObject)) {
    return {
      visible: true,
      title: "建议升级到观测评估器",
      description: (
        <>
          观测评估器提供更细粒度的控制以及更简单的工作流程。
          我们强烈建议升级到观测评估器。{" "}
          <a
            href={OXELIA_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-dark-blue font-bold hover:opacity-80"
          >
            了解更多
          </a>
          。
        </>
      ),
    };
  }

  return hidden;
};

export function EvalVersionCallout({
  targetObject,
  evalCapabilities,
}: EvalVersionCalloutProps) {
  const content = getCalloutContent(targetObject, evalCapabilities);

  if (!content.visible) {
    return null;
  }

  return (
    <Alert
      variant="default"
      className="border-dark-yellow bg-light-yellow mt-2 max-w-4xl"
    >
      <AlertTriangle className="text-dark-yellow h-4 w-4" />
      <AlertDescription>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-foreground font-bold">{content.title}</span>
            <span className="text-foreground text-sm">
              {content.description}
            </span>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
