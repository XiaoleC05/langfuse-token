import { Button } from "@/src/components/ui/button";
import { api } from "@/src/utils/api";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

export function RetryBackgroundMigration({
  backgroundMigrationName,
  isRetryable,
}: {
  backgroundMigrationName: string;
  isRetryable: boolean;
}) {
  const utils = api.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [adminApiKey, setAdminApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const mutRetryBackgroundMigration =
    api.backgroundMigrations.retry.useMutation({
      onSuccess: () => {
        utils.backgroundMigrations.invalidate();
        toast.success("迁移已安排重试");
        setIsOpen(false);
        setAdminApiKey("");
      },
      onError: (error) => {
        toast.error(error?.message || "重试迁移失败");
      },
      onSettled: () => {
        setIsLoading(false);
      },
    });

  const handleRetry = async () => {
    if (!adminApiKey.trim()) {
      toast.error("管理员 API 密钥为必填项");
      return;
    }
    setIsLoading(true);
    try {
      await mutRetryBackgroundMigration.mutateAsync({
        name: backgroundMigrationName,
        adminApiKey: "Bearer " + adminApiKey.trim(),
      });
    } catch (_e) {
      // Error handled in onError
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={() => setIsOpen((prev) => !prev)}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="xs" disabled={!isRetryable}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <h2 className="mb-3 font-bold">重试后台迁移</h2>
        <p className="mb-4 text-sm">
          此操作将安排迁移重试。重启 Worker 容器以重新发起迁移。
        </p>

        <div className="mb-4">
          <Label htmlFor="admin-api-key" className="text-sm font-bold">
            管理员 API 密钥
          </Label>
          <Input
            id="admin-api-key"
            type="password"
            placeholder="输入管理员 API 密钥"
            value={adminApiKey}
            onChange={(e) => setAdminApiKey(e.target.value)}
            className="mt-1"
            disabled={isLoading}
            autoComplete="off"
            inputMode="text"
            name="admin-api-key"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            Required for security. This key must match your ADMIN_API_KEY
            environment variable{" ("}
            <a
              href="https://langfuse.com/self-hosting/administration/organization-management-api#authentication"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary underline"
            >
              Docs
            </a>
            ).
          </p>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              setAdminApiKey("");
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            loading={isLoading}
            onClick={handleRetry}
            disabled={isLoading}
          >
            Retry Migration
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
