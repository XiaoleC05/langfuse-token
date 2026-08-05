import type { InAppAgentMessageEntryPoint } from "@/src/ee/features/in-app-agent/context";
import { getInAppAgentProjectRoute } from "@/src/ee/features/in-app-agent/routeContext";
import {
  Activity,
  BarChart3,
  Beaker,
  ClipboardCheck,
  Clock,
  Coins,
  Database,
  FileJson,
  FilePlus,
  FlaskConical,
  GitCompareArrows,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  ListTree,
  MessageSquareText,
  Radar,
  ScanSearch,
  ScrollText,
  Sparkles,
  SquarePercent,
  TrendingDown,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

export const IN_APP_AGENT_QUICK_ACTION_CONTEXTS = [
  "observability",
  "prompts",
  "evaluation",
  "dashboards",
] as const;

export type InAppAgentQuickActionContext =
  (typeof IN_APP_AGENT_QUICK_ACTION_CONTEXTS)[number];

export const IN_APP_AGENT_QUICK_ACTION_CONTEXT_LABELS: Record<
  InAppAgentQuickActionContext,
  string
> = {
  observability: "可观测性",
  prompts: "提示词",
  evaluation: "评估",
  dashboards: "仪表板",
};

export type InAppAgentQuickAction = {
  id: string;
  label: string;
  description: string;
  prompt: string;
  icon: LucideIcon;
};

export const IN_APP_AGENT_QUICK_ACTION_CONTEXT_ICONS: Record<
  InAppAgentQuickActionContext,
  LucideIcon
> = {
  observability: ListTree,
  dashboards: LayoutDashboard,
  prompts: FileJson,
  evaluation: Lightbulb,
};

export type InAppAgentQuickActionAttribution = {
  key: string;
  category: InAppAgentQuickActionContext;
};

export type InAppAgentSubmitOptions = {
  quickAction?: InAppAgentQuickActionAttribution;
  /** Force a fresh conversation instead of appending to the selected one. */
  newConversation?: boolean;
  /** Which surface sent the message; telemetry only (PostHog + trace
   * metadata), never shown to the agent. Defaults to "chat". */
  entryPoint?: InAppAgentMessageEntryPoint;
};

// Version 1 starter sets. Idea is that periodic curation replaces sets when usage
// supports a stronger ranking. Prompts are somewhat product-generic and act on the
// current page context without copying customer data.
export const IN_APP_AGENT_QUICK_ACTIONS_BY_CONTEXT = {
  observability: [
    {
      id: "analyze-failure-patterns",
      label: "分析失败模式",
      description: "对失败的追踪运行结构化错误分析",
      icon: ScanSearch,
      prompt:
        "Run a structured error analysis on failed traces in the current view (taking active filters into account): sample representative traces (as many as needed), open-code and cluster recurring failure modes into a taxonomy, recommend what to fix first, and offer to set up an evaluator or annotation queue to track the top failure modes.",
    },
    {
      id: "review-recent-activity",
      label: "回顾近期活动",
      description: "获取用量、成本和延迟摘要",
      icon: Activity,
      prompt:
        "Give me a digest of recent activity in the current view (taking active filters into account): trace volume, error rates, latency, and cost over the last seven days (and compare it with the previous week), and highlight anything that changed significantly.",
    },
    {
      id: "investigate-unusual-patterns",
      label: "调查异常模式",
      description: "发现异常的成本、延迟或质量模式",
      icon: Radar,
      prompt:
        "Review the current filtered view for unusual latency, cost, or quality patterns, explain likely causes, and suggest what to investigate next.",
    },
  ],
  dashboards: [
    {
      id: "monitor-production-health",
      label: "监控生产健康状态",
      description: "用于错误率、延迟、吞吐量的组件",
      icon: Activity,
      prompt:
        "Help me build widgets that keep an eye on production health — error rate, P95/P99 latency, throughput. First ask whether to scope this to a specific model, feature, trace name or keep it project-wide, and fit the widgets to whatever is already on my current dashboard.",
    },
    {
      id: "track-cost-and-usage",
      label: "跟踪成本与用量",
      description: "按模型和功能统计支出的组件",
      icon: Coins,
      prompt:
        "Help me build widgets to track token usage and cost — how spend is trending, which users drive it (if available), and how models compare. First check whether to focus on a particular model, feature, or user segment or look across the whole project, and fit them to whatever is already on my current dashboard.",
    },
    {
      id: "track-quality-and-feedback",
      label: "跟踪质量与反馈",
      description: "用于评分趋势和反馈的组件",
      icon: SquarePercent,
      prompt:
        "Help me build widgets to track quality — score trends over time, score distribution, and user feedback like thumbs up/down. First ask which score or use case matters most or whether I want an overall view, take my current dashboard into account.",
    },
  ],
  prompts: [
    {
      id: "create-prompt",
      label: "创建提示词",
      description: "向提示词管理中添加新提示词",
      icon: FilePlus,
      prompt:
        "Help me create a new prompt in Langfuse prompt management, including choosing between a text and chat prompt, defining its variables, and setting a label.",
    },
    {
      id: "find-prompts-to-improve",
      label: "查找待改进的提示词",
      description: "发现性能较弱的提示词",
      icon: TrendingDown,
      prompt:
        "Across my prompts, identify which ones have declining scores, high latency, or high cost in production based on their linked generations, and suggest which to improve first. If no generations are linked to prompts, explain how to link prompts to traces instead.",
    },
    {
      id: "review-prompt-usage",
      label: "回顾提示词使用情况",
      description: "查看哪些提示词驱动生产流量",
      icon: BarChart3,
      prompt:
        "Summarize which prompts are used most in production, which versions are live, and their latency, cost, and score performance. If no generations are linked to prompts, explain how to link prompts to traces instead.",
    },
  ],
  evaluation: [
    {
      id: "set-up-llm-judge-evaluator",
      label: "设置自动评估器",
      description: "使用模型裁判为输出评分",
      icon: WandSparkles,
      prompt:
        "Help me set up an automatic evaluator. First ask what I want to score — a quality like hallucination, helpfulness, or toxicity, or something tied to a specific use case — then help me pick a managed template or write a custom rubric, map its variables, and choose whether it runs on live observations or an experiment and which data it targets. If it helps, look at a few recent traces first to ground your understanding.",
    },
    {
      id: "set-up-annotation-queue",
      label: "设置标注队列",
      description: "将追踪排队供人工审核和评分",
      icon: ListChecks,
      prompt:
        "Help me set up an annotation queue so a human can review and score traces. First ask which traces or use case I want reviewed and which dimensions to score, then create the score configs and the queue, add a starter set of items.",
    },
    {
      id: "create-dataset-from-traces",
      label: "创建数据集",
      description: "从具有代表性的追踪构建数据集",
      icon: Database,
      prompt:
        "Help me build a dataset (up to 10 items) from representative traces so I can evaluate and run experiments. First ask which use case or slice of traffic it should cover and what to name it, then pull a small set of up to ten traces as items with inputs and expected outputs. When it's ready, I can run an experiment on it from the UI, or you can give me a coding-agent prompt to run it via the SDK.",
    },
  ],
} satisfies Record<
  InAppAgentQuickActionContext,
  readonly InAppAgentQuickAction[]
>;

export const IN_APP_AGENT_FOCUSED_QUICK_ACTIONS = {
  trace: [
    {
      id: "analyze-this-trace",
      label: "分析此追踪",
      description: "对此追踪运行结构化错误分析",
      icon: ScanSearch,
      prompt:
        "Run a structured error analysis on this trace: review its observations and generations, identify failure modes, explain what went wrong, and recommend what to fix first.",
    },
    {
      id: "summarize-this-trace",
      label: "总结此追踪",
      description: "以通俗语言概括本次执行",
      icon: ScrollText,
      prompt:
        "Summarize this trace, including its execution sequence, generations, tool calls, errors, scores, and outcome.",
    },
    {
      id: "break-down-this-trace-cost",
      label: "分析此追踪的成本",
      description: "查看延迟与 Token 的构成",
      icon: Coins,
      prompt:
        "Break down this trace's latency, token usage, and cost across its generation observations, and identify the largest drivers.",
    },
  ],
  observation: [
    {
      id: "analyze-this-observation",
      label: "分析此观测",
      description: "检查此观测是否存在问题",
      icon: ScanSearch,
      prompt:
        "Analyze this observation, including its input, output, errors, scores, and linked prompt version, and explain what went wrong or could be improved.",
    },
    {
      id: "explain-this-generation",
      label: "解释此观测",
      description: "了解此观测做了什么",
      icon: MessageSquareText,
      prompt:
        "Explain what this observation did, how it fits into the surrounding trace, and whether its output looks correct.",
    },
    {
      id: "optimize-this-generation-cost",
      label: "优化此观测的成本",
      description: "减少此步骤的 Token 与延迟",
      icon: Coins,
      prompt:
        "Review this observation's token usage, latency, and model choice, then suggest concrete ways to reduce cost or latency without hurting quality.",
    },
  ],
  session: [
    {
      id: "summarize-this-session",
      label: "总结此会话",
      description: "以通俗语言概括此会话",
      icon: Clock,
      prompt:
        "Summarize this session, including its traces, execution flow, errors, scores, and overall outcome.",
    },
    {
      id: "analyze-this-session",
      label: "分析此会话",
      description: "在此会话的追踪中查找问题",
      icon: ScanSearch,
      prompt:
        "Analyze this session's traces for recurring failure patterns, quality issues, and unusual latency or cost, then recommend what to investigate next.",
    },
    {
      id: "break-down-this-session-cost",
      label: "分析此会话的成本",
      description: "查看此会话的 Token 消耗",
      icon: Coins,
      prompt:
        "Break down this session's token usage and cost across its traces and generations, and highlight the largest drivers.",
    },
  ],
  prompt: [
    {
      id: "review-prompt-best-practices",
      label: "按最佳实践检查",
      description: "对照 Langfuse 指南检查此提示词",
      icon: Sparkles,
      prompt:
        "Review this prompt against prompt engineering best practices and suggest concrete improvements to its structure, instructions, and variables while preserving its intent.",
    },
    {
      id: "compare-prompt-versions",
      label: "比较提示词版本",
      description: "回顾各版本的变化",
      icon: GitCompareArrows,
      prompt:
        "Compare recent versions of this prompt, summarize what changed between them, and how each version performs in production based on its linked generations. If no generations are linked to this prompt, explain how to link prompts to traces instead.",
    },
    {
      id: "check-prompt-performance",
      label: "检查提示词性能",
      description: "将此提示词与延迟、成本和评分关联",
      icon: SquarePercent,
      prompt:
        "Find the generations that use this prompt and summarize its latency, cost, and score performance, pointing me to this prompt's Metrics tab for the full per-version breakdown. If no generations are linked to this prompt, explain how to link prompts to traces instead.",
    },
  ],
  dataset: [
    {
      id: "add-items-to-this-dataset",
      label: "从追踪添加条目",
      description: "从生产追踪填充此数据集",
      icon: Database,
      prompt:
        "Help me add a small set of up to ten representative production traces as items to this dataset so I can use it for experiments and evaluation.",
    },
    {
      id: "set-up-experiment-on-this-dataset",
      label: "准备实验",
      description: "挂载评估器并准备运行",
      icon: Beaker,
      prompt:
        "Help me get an experiment ready on this dataset: check that its item keys match my prompt variables, confirm a model connection is configured, and attach an evaluator to score the results. Langfuse runs the experiment itself, so point me to the experiments UI to start it, or give me a ready-to-use prompt I can hand a coding agent to run it via the SDK.",
    },
    {
      id: "review-this-dataset",
      label: "回顾此数据集",
      description: "评估条目的覆盖度与质量",
      icon: ClipboardCheck,
      prompt:
        "Review this dataset's items for coverage, diversity, and quality, and recommend improvements before I run experiments or evaluations on it.",
    },
  ],
  experimentRun: [
    {
      id: "summarize-this-experiment-run",
      label: "总结此实验运行",
      description: "了解本次运行的表现",
      icon: FlaskConical,
      prompt:
        "Summarize this experiment run, including its configuration, scores, and how it compares to the dataset baseline.",
    },
    {
      id: "compare-this-experiment-run",
      label: "与其他运行比较",
      description: "查看本次运行的对比表现",
      icon: GitCompareArrows,
      prompt:
        "Compare this experiment run to other recent runs on the same dataset and summarize which configuration performed best.",
    },
    {
      id: "investigate-this-experiment-run",
      label: "调查此运行的结果",
      description: "查找本次运行成功或失败之处",
      icon: ScanSearch,
      prompt:
        "Investigate this experiment run's results, highlight the best and worst-performing items, and explain likely causes.",
    },
  ],
} satisfies Record<string, readonly InAppAgentQuickAction[]>;

// Coarse section -> tab classifier for the quick-action picker.
// getInAppAgentScreenContextDescription() in context.ts classifies the same
// URL at entity granularity (for the banner and focused action sets).
const QUICK_ACTION_CONTEXT_BY_PROJECT_SECTION: Record<
  string,
  InAppAgentQuickActionContext
> = {
  traces: "observability",
  observations: "observability",
  sessions: "observability",
  users: "observability",
  monitors: "observability",
  dashboards: "dashboards",
  widgets: "dashboards",
  prompts: "prompts",
  playground: "prompts",
  scores: "evaluation",
  evals: "evaluation",
  "annotation-queues": "evaluation",
  datasets: "evaluation",
  experiments: "evaluation",
};

export function getInAppAgentQuickActionContext(
  currentUrl: string,
): InAppAgentQuickActionContext {
  const section = getInAppAgentProjectRoute(currentUrl)?.routeSegments[0];

  return section
    ? (QUICK_ACTION_CONTEXT_BY_PROJECT_SECTION[section] ?? "observability")
    : "observability";
}

export function getInAppAgentQuickActions(
  context: InAppAgentQuickActionContext,
): readonly InAppAgentQuickAction[] {
  return IN_APP_AGENT_QUICK_ACTIONS_BY_CONTEXT[context];
}

export function getInAppAgentFocusedQuickActions(
  screenContextType: string,
): readonly InAppAgentQuickAction[] | undefined {
  if (!(screenContextType in IN_APP_AGENT_FOCUSED_QUICK_ACTIONS)) {
    return undefined;
  }

  return IN_APP_AGENT_FOCUSED_QUICK_ACTIONS[
    screenContextType as keyof typeof IN_APP_AGENT_FOCUSED_QUICK_ACTIONS
  ];
}

export function isInAppAgentQuickActionContext(
  value: string,
): value is InAppAgentQuickActionContext {
  return IN_APP_AGENT_QUICK_ACTION_CONTEXTS.some(
    (context) => context === value,
  );
}
