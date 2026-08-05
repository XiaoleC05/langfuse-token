import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { api } from "@/src/utils/api";

type ReferencingEvaluator = {
  id: string;
  scoreName: string;
};

const EvaluatorLink = ({
  projectId,
  evaluator,
}: {
  projectId: string;
  evaluator: ReferencingEvaluator;
}) => (
  <Link
    href={`/project/${projectId}/evals?peek=${evaluator.id}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
  >
    {evaluator.scoreName}
    <ExternalLinkIcon className="h-3 w-3" />
  </Link>
);

/**
 * Confirm-then-delete dialog for an eval template. Rendered as a controlled
 * ConfirmDialog so callers can keep it a sibling of dropdown menus — a confirm
 * nested inside DropdownMenuContent unmounts when the menu closes (see the
 * overlay-lifecycle rule in web/AGENTS.md).
 */
export function DeleteEvalTemplateDialog({
  projectId,
  templateId,
  templateName,
  open,
  onOpenChange,
  onSuccess,
  initialUsageCount,
}: {
  projectId: string;
  templateId: string;
  templateName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Called after successful deletion; the caller owns follow-up side effects
  // like analytics, redirects, or extra cache invalidation.
  onSuccess?: () => void;
  // Usage count from already-loaded table data; lets the blocked state render
  // instantly while the usage query is in flight.
  initialUsageCount?: number;
}) {
  const utils = api.useUtils();
  const [confirmationInput, setConfirmationInput] = useState("");

  const templateMutation = api.evals.deleteEvalTemplate.useMutation({
    onSuccess: () => {
      showSuccessToast({
        title: "评估器已删除",
        description: `评估器 "${templateName}" 已被删除。`,
      });
      utils.evals.invalidate();
    },
    onError: (error) =>
      showErrorToast("删除评估器失败", error.message),
  });

  // Once deletion starts, the usage query must go inactive so post-delete
  // invalidation does not refetch it and surface a NOT_FOUND.
  const usage = api.evals.evalTemplateUsage.useQuery(
    { projectId, evalTemplateId: templateId },
    {
      enabled:
        open && !templateMutation.isPending && !templateMutation.isSuccess,
    },
  );
  const referencingEvaluators = usage.data;
  const usageCount = referencingEvaluators?.length ?? initialUsageCount ?? 0;
  const isBlocked = usageCount > 0;

  const handleOpenChange = (nextOpen: boolean) => {
    // Reset the type-to-confirm input on close so the confirmation must be
    // re-typed each time.
    if (!nextOpen) setConfirmationInput("");
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    try {
      await templateMutation.mutateAsync({
        evalTemplateId: templateId,
        projectId,
      });
    } catch {
      // Surfaced via the mutation's onError toast.
      return;
    }
    handleOpenChange(false);
    onSuccess?.();
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={handleOpenChange}
      size="lg"
      title={isBlocked ? "无法删除" : "请确认"}
      description={
        isBlocked
          ? `此评估器被 ${usageCount} 个正在运行的评估器使用。请先删除这些正在运行的评估器。`
          : "此操作无法撤销。它将永久删除此评估器的所有版本。该评估器已产生的评分不会被删除。"
      }
      confirmLabel="删除评估器"
      loading={templateMutation.isPending}
      confirmDisabled={isBlocked || confirmationInput !== templateName}
      onConfirm={handleConfirm}
    >
      {isBlocked ? (
        referencingEvaluators && referencingEvaluators.length > 0 ? (
          referencingEvaluators.length === 1 ? (
            <div className="text-sm">
              <EvaluatorLink
                projectId={projectId}
                evaluator={referencingEvaluators[0]}
              />
            </div>
          ) : (
            <ul className="max-h-40 list-inside list-disc overflow-y-auto text-sm">
              {referencingEvaluators.map((evaluator) => (
                <li key={evaluator.id}>
                  <EvaluatorLink projectId={projectId} evaluator={evaluator} />
                </li>
              ))}
            </ul>
          )
        ) : null
      ) : (
        <div className="grid w-full gap-1.5">
          <Label htmlFor="delete-evaluator-confirmation">
            输入 &quot;{templateName}&quot; 以确认
          </Label>
          <Input
            id="delete-evaluator-confirmation"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
          />
        </div>
      )}
    </ConfirmDialog>
  );
}
