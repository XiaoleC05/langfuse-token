import React from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import DiffViewer from "@/src/components/DiffViewer";

type CorrectedOutputDiffDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  actualOutput?: unknown;
  correctedOutput: string;
  strictJsonMode: boolean;
  /**
   * True when the original output exists but was too large to load into the
   * view (gated). Distinguishes "too large to diff" from "no output at all".
   */
  actualOutputTooLarge?: boolean;
};

/**
 * Formats output for diff display
 * @param output - The output to format
 * @param strictJsonMode - Whether to enforce JSON formatting
 * @returns Formatted string for display
 */
const formatOutputForDiff = (
  output: unknown,
  strictJsonMode: boolean,
): string => {
  if (output === null || output === undefined) {
    return "";
  }

  // If strict JSON mode, try to format as JSON
  if (strictJsonMode) {
    try {
      // If it's already a string, try to parse it first
      if (typeof output === "string") {
        const parsed = JSON.parse(output);
        return JSON.stringify(parsed, null, 2);
      }
      // Otherwise just stringify the object
      return JSON.stringify(output, null, 2);
    } catch {
      // If JSON formatting fails, fall back to string representation
      return typeof output === "string" ? output : JSON.stringify(output);
    }
  }

  // Non-strict mode: convert to string
  return typeof output === "string" ? output : JSON.stringify(output, null, 2);
};

export const CorrectedOutputDiffDialog: React.FC<
  CorrectedOutputDiffDialogProps
> = ({
  isOpen,
  setIsOpen,
  actualOutput,
  correctedOutput,
  strictJsonMode,
  actualOutputTooLarge = false,
}) => {
  // Format both outputs for comparison
  const formattedActualOutput = formatOutputForDiff(
    actualOutput,
    strictJsonMode,
  );
  const formattedCorrectedOutput = formatOutputForDiff(
    correctedOutput,
    strictJsonMode,
  );

  // Check if there's no original output to compare. When the output exists but
  // was too large to load into the view, we cannot diff it — but that is not
  // the same as there being no original output.
  const hasNoOriginalOutput =
    !actualOutputTooLarge &&
    (actualOutput === null || actualOutput === undefined);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>输出修正对比</DialogTitle>
          <DialogDescription>
            将原始输出与修正后的版本进行对比
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {actualOutputTooLarge ? (
            <div className="space-y-4">
              <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
                <p className="text-foreground font-bold">
                  原始输出过大，无法对比
                </p>
                <p className="mt-1">
                  原始输出过大，无法在此加载，因此无法并排比较。您的修正内容显示在下方，并将按原样保存。
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm font-bold">修正后的输出</p>
                <pre className="bg-muted/30 max-h-[50vh] overflow-auto rounded-md border p-3 text-xs break-words whitespace-pre-wrap">
                  {formattedCorrectedOutput}
                </pre>
              </div>
            </div>
          ) : hasNoOriginalOutput ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="text-muted-foreground">
                <p className="text-lg font-bold">无原始输出</p>
                <p className="mt-2 text-sm">
                  没有可与修正内容进行比较的原始输出。
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <DiffViewer
                oldString={formattedActualOutput}
                newString={formattedCorrectedOutput}
                oldLabel="原始输出"
                newLabel="修正后的输出"
              />
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
