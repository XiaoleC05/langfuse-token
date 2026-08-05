import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/src/components/ui/alert";

export const SupportOrUpgradePage = () => {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>访问受限</AlertTitle>
          <AlertDescription>
            <p className="mb-2">此功能需要额外的权限</p>
            <p>
              请联系您的系统/项目管理员获取访问权限，或升级您的套餐。
              需要帮助？请联系支持团队。
            </p>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};
