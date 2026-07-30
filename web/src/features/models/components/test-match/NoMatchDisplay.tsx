import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { AlertCircle } from "lucide-react";

type NoMatchDisplayProps = {
  modelName: string;
};

export type { NoMatchDisplayProps };

export function NoMatchDisplay({ modelName }: NoMatchDisplayProps) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2 text-base">
          <AlertCircle className="h-5 w-5" />
          未找到匹配
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          此项目中没有模型配置与「{modelName}」匹配。
        </p>

        <div>
          <p className="mb-2 text-sm font-bold">建议：</p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            <li>检查您的模型名称拼写</li>
            <li>查看现有模型及其匹配模式</li>
            <li>创建新的模型定义</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
