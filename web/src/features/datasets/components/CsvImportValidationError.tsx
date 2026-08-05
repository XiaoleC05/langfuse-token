import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";
import { type BulkDatasetItemValidationError } from "@langfuse/shared";

type CsvImportValidationErrorProps = {
  errors: BulkDatasetItemValidationError[];
};

export const CsvImportValidationError: React.FC<
  CsvImportValidationErrorProps
> = ({ errors }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const errorCount = errors.length;
  const hasMoreThan10 = errorCount >= 10; // Backend might limit errors

  return (
    <Alert variant="destructive" className="mt-4">
      <AlertTitle className="text-base font-bold">
        Schema 校验失败
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm">
          {hasMoreThan10
            ? `${errorCount}+ 个数据项校验失败。显示前 ${errorCount} 个错误。`
            : `${errorCount} 个数据项校验失败。`}
        </p>
        <p className="text-muted-foreground text-sm">
          CSV 数据与数据集所需的 schema 不匹配。请修复 CSV 文件中的错误后重新导入。
        </p>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-auto p-0 text-sm font-bold hover:bg-transparent"
        >
          {isExpanded ? (
            <ChevronDown className="mr-1 h-4 w-4" />
          ) : (
            <ChevronRight className="mr-1 h-4 w-4" />
          )}
          {isExpanded ? "隐藏" : "显示"}错误详情
        </Button>

        {isExpanded && (
          <div className="border-destructive/20 bg-destructive/5 mt-3 max-h-[400px] space-y-3 overflow-y-auto rounded-md border p-3">
            {errors.map((error, idx) => (
              <div
                key={`${error.itemIndex}-${error.field}`}
                className="border-destructive/10 space-y-1 border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-mono text-xs">
                    #{idx + 1}
                  </span>
                  <span className="text-sm font-bold">
                    CSV 行 {error.itemIndex + 2}：{" "}
                    {error.field === "input"
                      ? "输入"
                      : error.field === "metadata"
                        ? "元数据"
                        : "预期输出"}
                  </span>
                </div>

                <ul className="ml-6 space-y-1 text-sm">
                  {error.errors.map((err, errIdx) => (
                    <li key={errIdx} className="text-destructive">
                      {err.path !== "/" && (
                        <span className="text-muted-foreground font-mono text-xs">
                          {err.path}:{" "}
                        </span>
                      )}
                      {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {hasMoreThan10 && (
              <p className="text-muted-foreground pt-2 text-xs">
                修复这些错误，以查看是否还有其他校验问题。
              </p>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};
