import { Input } from "@/src/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { type UseFormReturn } from "react-hook-form";
import { type ActionDomain } from "@langfuse/shared";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

interface GitHubDispatchActionFormProps {
  form: UseFormReturn<any>;
  disabled: boolean;
  projectId: string;
  action?: ActionDomain;
}

export const GitHubDispatchActionForm: React.FC<
  GitHubDispatchActionFormProps
> = ({ form, disabled }) => {
  const displayGitHubToken = form.watch("githubDispatch.displayGitHubToken");

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="githubDispatch.url"
        rules={{ required: "仓库工作流调度 URL 为必填" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center">
              仓库工作流调度 URL{" "}
              <span className="text-destructive ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="https://api.github.com/repos/owner/repo/dispatches"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormDescription>
              用于仓库工作流调度的 GitHub API 端点。{" "}
              <Link
                href="https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center hover:underline"
              >
                了解更多 <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="githubDispatch.eventType"
        rules={{ required: "事件类型为必填" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center">
              事件类型 <span className="text-destructive ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="prompt-update"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormDescription>
              GitHub Actions 工作流触发器的事件类型。此项将用于工作流文件中的{" "}
              <code className="text-xs">on.repository_dispatch.types</code>{" "}
              筛选条件。
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="githubDispatch.githubToken"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center">
              GitHub 个人访问令牌
              {!displayGitHubToken && (
                <span className="text-destructive ml-1">*</span>
              )}
            </FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder={displayGitHubToken || "ghp_..."}
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormDescription>
              具有 <code className="text-xs">repo</code> 权限的 GitHub 个人访问令牌，用于仓库工作流调度。
              {displayGitHubToken
                ? " 留空以保留现有令牌。"
                : ""}{" "}
              <Link
                href="https://github.com/settings/tokens/new?scopes=repo&description=Langfuse%20Automation"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center hover:underline"
              >
                创建令牌 <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

// Schema exported for use in automationForm.tsx
export const githubDispatchSchema = {
  url: "",
  eventType: "",
  githubToken: "",
};
