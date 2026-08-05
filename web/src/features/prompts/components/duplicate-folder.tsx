import { Button } from "@/src/components/ui/button";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { api } from "@/src/utils/api";
import { useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { Checkbox } from "@/src/components/design-system/Checkbox/Checkbox";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import useProjectIdFromURL from "@/src/hooks/useProjectIdFromURL";
import { Copy } from "lucide-react";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { useEntitlementLimit } from "@/src/features/entitlements/hooks";

enum CopySettings {
  LATEST_ONLY = "latest_only",
  ALL_VERSIONS = "all_versions",
}

const formSchema = z.object({
  targetPath: z.string().min(1, "Target folder path is required"),
  copySettings: z.enum(CopySettings),
  rewritePromptReferences: z.boolean(),
});

export function DuplicateFolder({ folderPath }: { folderPath: string }) {
  const projectId = useProjectIdFromURL();
  const utils = api.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAccess = useHasProjectAccess({ projectId, scope: "prompts:CUD" });
  const promptLimit = useEntitlementLimit("prompt-management-count-prompts");
  const capture = usePostHogClientCapture();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetPath: `${folderPath}-copy`,
      copySettings: CopySettings.LATEST_ONLY,
      rewritePromptReferences: false,
    },
  });

  const mutDuplicateFolder = api.prompts.duplicateFolder.useMutation({
    onSuccess: () => {
      utils.prompts.invalidate();
      setError(null);
      setIsOpen(false);
      form.reset();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const allPromptNames = api.prompts.allNames.useQuery(
    { projectId: projectId as string },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      enabled: hasAccess && isOpen,
    },
  );

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!projectId) return;
    capture("prompt_detail:duplicate_form_submit");
    setError(null);
    mutDuplicateFolder.mutate({
      projectId,
      sourcePath: folderPath,
      targetPath: values.targetPath,
      isSingleVersion: values.copySettings === CopySettings.LATEST_ONLY,
      rewritePromptReferences: values.rewritePromptReferences,
    });
  }

  return (
    <Dialog
      open={hasAccess && isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          form.reset();
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          disabled={!hasAccess}
          title="复制文件夹（包括提示词）"
          onClick={() => capture("prompt_detail:duplicate_button_click")}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] min-h-0 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="break-all">
            复制文件夹 &quot;
            <i className="font-normal">
              {folderPath.split("/").pop() ?? folderPath}
            </i>
            &quot;
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex h-full flex-1 flex-col gap-4"
          >
            <DialogBody>
              <p className="text-muted-foreground text-sm">
                将{" "}
                <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-bold break-all">
                  {folderPath}/
                </code>{" "}
                中的所有提示词复制到新的文件夹路径。
              </p>
              <FormField
                control={form.control}
                name="targetPath"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel>目标文件夹路径</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="copySettings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>版本设置</FormLabel>
                    <FormControl>
                      <RadioGroup
                        {...field}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-y-0 space-x-3">
                          <FormControl>
                            <RadioGroupItem value={CopySettings.LATEST_ONLY} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            仅复制每个提示词的最新版本
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-y-0 space-x-3">
                          <FormControl>
                            <RadioGroupItem value={CopySettings.ALL_VERSIONS} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            复制所有版本和标签
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rewritePromptReferences"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        重写此文件夹中的提示词引用
                      </FormLabel>
                      <FormDescription>
                        当被引用的提示词也一并复制时，将类似{" "}
                        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
                          {folderPath}/...
                        </code>{" "}
                        的引用更新为指向{" "}
                        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
                          {form.watch("targetPath") || `${folderPath}-copy`}/...
                        </code>。
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              {form.watch("copySettings") === CopySettings.LATEST_ONLY &&
                form.watch("rewritePromptReferences") && (
                  <p className="text-muted-foreground text-sm">
                    当仅复制最新版本时，文件夹内引用的标签可能会被添加到复制的提示词中，
                    以便重写后的引用继续生效。
                  </p>
                )}
              {error && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <p className="font-bold">错误：</p>
                  <p className="whitespace-pre-wrap">{error}</p>
                </div>
              )}
            </DialogBody>
            <DialogFooter>
              <Button
                type="submit"
                loading={mutDuplicateFolder.isPending}
                disabled={
                  !!(
                    promptLimit &&
                    allPromptNames.data &&
                    allPromptNames.data.length >= promptLimit
                  )
                }
                className="mt-auto w-full"
              >
                复制
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
