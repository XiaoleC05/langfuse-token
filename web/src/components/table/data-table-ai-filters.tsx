import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { Info } from "lucide-react";
import { useQueryProject } from "@/src/features/projects/hooks";
import useProjectIdFromURL from "@/src/hooks/useProjectIdFromURL";
import { AIFeaturesDisabledNotice } from "@/src/features/organizations/components/AIFeaturesDisabledNotice";
import { api } from "@/src/utils/api";
import { type FilterState } from "@langfuse/shared";

interface DataTableAIFiltersProps {
  onFiltersGenerated: (filters: FilterState) => void;
}

export function DataTableAIFilters({
  onFiltersGenerated,
}: DataTableAIFiltersProps) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const projectId = useProjectIdFromURL();
  const { organization } = useQueryProject();

  const createFilterMutation =
    api.naturalLanguageFilters.createCompletion.useMutation();

  const handleAiFilterSubmit = async () => {
    if (aiPrompt.trim() && !createFilterMutation.isPending && projectId) {
      setAiError(null);
      try {
        const result = await createFilterMutation.mutateAsync({
          projectId,
          prompt: aiPrompt.trim(),
        });

        if (result && Array.isArray(result.filters)) {
          if (result.filters.length === 0) {
            setAiError("生成筛选失败，请重试");
            return;
          }

          // Set the filters from the API response
          onFiltersGenerated(result.filters as FilterState);
          setAiPrompt("");
        } else {
          console.error(
            "dataTable.aiFilters: invalid response format",
            JSON.stringify(result),
          );
          setAiError("API 响应格式无效");
        }
      } catch (error) {
        console.error("Error calling tRPC API:", error);
        setAiError(
          error instanceof Error ? error.message : "生成筛选失败",
        );
      }
    }
  };

  // When AI features are not enabled
  if (!organization?.aiFeaturesEnabled) {
    return (
      <AIFeaturesDisabledNotice organizationId={organization?.id}>
        AI 筛选使用自然语言生成确定性筛选条件。
      </AIFeaturesDisabledNotice>
    );
  }

  // When AI features are enabled
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold">使用 AI 筛选</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="text-muted-foreground h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                我们将自然语言转换为确定性筛选条件，你可以随后进行调整
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Textarea
        autoFocus
        value={aiPrompt}
        onChange={(e) => {
          setAiPrompt(e.target.value);
          if (aiError) setAiError(null);
        }}
        placeholder="描述你想要应用的筛选条件..."
        className="min-h-[80px] resize-none"
        disabled={createFilterMutation.isPending}
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            !e.shiftKey &&
            !createFilterMutation.isPending
          ) {
            e.preventDefault();
            handleAiFilterSubmit();
          }
        }}
      />
      <Button
        onClick={handleAiFilterSubmit}
        type="button"
        variant="default"
        size="sm"
        disabled={createFilterMutation.isPending || !aiPrompt.trim()}
        className="w-fit"
      >
        {createFilterMutation.isPending ? "加载中..." : "生成"}
      </Button>
      {aiError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {aiError}
        </div>
      )}
    </div>
  );
}
