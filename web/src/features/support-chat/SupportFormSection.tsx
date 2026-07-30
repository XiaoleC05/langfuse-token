"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import {
  MESSAGE_TYPES,
  SEVERITIES,
  SEVERITY_1,
  SEVERITY_3,
  INTEGRATION_TYPES,
  TopicGroups,
  type MessageType,
  SupportFormSchema,
  isSeverityAllowedForPlan,
} from "./formConstants";

import { api } from "@/src/utils/api";

import { Button } from "@/src/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { RadioGroup } from "@/src/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { useQueryProjectOrOrganization } from "@/src/features/projects/hooks";
import { useEffect, useMemo, useState } from "react";

import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/src/components/ui/shadcn-io/dropzone";
import { Paperclip, Trash2 } from "lucide-react";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { PYLON_MAX_FILE_SIZE_BYTES } from "./pylon/pylonConstants";
import Spinner from "@/src/components/design-system/Spinner/Spinner";
import { useSupportDrawer } from "@/src/features/support-chat/SupportDrawerProvider";
import { useV4UpgradeUiEnabled } from "@/src/features/v4-migration/useV4UpgradeUiEnabled";

/** Make RHF generics match the resolver (Zod defaults => input can be undefined) */
type SupportFormInput = z.input<typeof SupportFormSchema>;
type SupportFormValues = z.output<typeof SupportFormSchema>;

/**
 * File upload constraints - single source of truth for validation
 * Uses Pylon's file size limit
 */
const FILE_UPLOAD_CONSTRAINTS = {
  maxFiles: 5,
  maxFileSizeBytes: PYLON_MAX_FILE_SIZE_BYTES, // 10MB (Pylon API limit)
  // Files are sent to /api/support/upload-attachments as base64-encoded JSON,
  // which inflates the body by ~33%. The endpoint's bodyParser caps the body
  // at 50MB, so the raw combined size must stay below ~37.5MB to fit. Use 35MB
  // for headroom (JSON overhead, multiple files).
  maxCombinedBytes: 35 * 1024 * 1024, // 35MB raw (~47MB once base64-encoded)
} as const;

/**
 * Validates files against upload constraints
 * @returns {isValid: boolean, error?: string}
 */
function validateFiles(files: File[] | undefined): {
  isValid: boolean;
  error?: string;
} {
  if (!files || files.length === 0) {
    return { isValid: true };
  }

  const { maxFiles, maxFileSizeBytes, maxCombinedBytes } =
    FILE_UPLOAD_CONSTRAINTS;

  // Check file count
  if (files.length > maxFiles) {
    return {
      isValid: false,
      error: `请最多上传 ${maxFiles} 个文件。`,
    };
  }

  // Check individual file sizes
  const oversizedFile = files.find((f) => f.size > maxFileSizeBytes);
  if (oversizedFile) {
    const maxMB = (maxFileSizeBytes / (1024 * 1024)).toFixed(0);
    return {
      isValid: false,
      error: `文件 "${oversizedFile.name}" 过大。每个文件最大 ${maxMB}MB。`,
    };
  }

  // Check combined size
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > maxCombinedBytes) {
    const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
    const maxMB = (maxCombinedBytes / (1024 * 1024)).toFixed(0);
    return {
      isValid: false,
      error: `附件总大小 (${totalMB}MB) 超过了 ${maxMB}MB 的限制。`,
    };
  }

  return { isValid: true };
}

/**
 * Converts technical file error messages to user-friendly ones
 */
function formatFileError(error: Error): string {
  const msg = error.message.toLowerCase();
  const { maxFiles, maxFileSizeBytes, maxCombinedBytes } =
    FILE_UPLOAD_CONSTRAINTS;
  const maxMB = (maxFileSizeBytes / (1024 * 1024)).toFixed(0);
  const maxCombinedMB = (maxCombinedBytes / (1024 * 1024)).toFixed(0);

  // File size errors
  if (
    msg.includes("larger than") ||
    msg.includes("10485760") ||
    msg.includes("10mb") ||
    msg.includes("too large")
  ) {
    return `文件过大。每个文件最大 ${maxMB}MB。`;
  }

  // File count errors
  if (
    msg.includes("too many") ||
    msg.includes("maxfiles") ||
    msg.includes("5 files")
  ) {
    return `文件数量过多。最多允许 ${maxFiles} 个文件。`;
  }

  // Combined size errors
  if (msg.includes("total") && (msg.includes("50mb") || msg.includes("size"))) {
    return `附件总大小超过限制。最大合并大小为 ${maxCombinedMB}MB。`;
  }

  // File type errors
  if (msg.includes("file type") || msg.includes("accept")) {
    return "不支持该文件类型。请选择其他文件。";
  }

  return error.message || "文件上传失败。请重试。";
}

export function SupportFormSection({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const { organization, project } = useQueryProjectOrOrganization();

  // The support drawer is mounted globally and reachable from pages without an
  // org/project in the URL (home, setup, onboarding, account settings), where
  // `organization` is null. Without an org context the plan is unknown, so
  // Severity 1/2 are gated there. The server applies the same rule.
  const effectivePlan = organization?.plan;

  // Tracks whether we've already warned about a short message
  const [warnedShortOnce, setWarnedShortOnce] = useState(false);

  // Local file state from Dropzone
  const [files, setFiles] = useState<File[] | undefined>(undefined);
  const totalUploadBytes = useMemo(
    () => (files ?? []).reduce((sum, f) => sum + f.size, 0),
    [files],
  );

  // Local submit guard to avoid flicker across multiple mutations
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);

  // Sev-1 pages the on-call team, so submission requires an explicit
  // confirmation step.
  const [sev1ConfirmOpen, setSev1ConfirmOpen] = useState(false);

  const { initialTopic } = useSupportDrawer();
  const v4UpgradeUiEnabled = useV4UpgradeUiEnabled();
  const productFeatureTopics = TopicGroups["Product Features"].filter(
    (topic) => topic !== "V4 Migration" || v4UpgradeUiEnabled,
  );

  const form = useForm<SupportFormInput>({
    resolver: zodResolver(SupportFormSchema),
    defaultValues: {
      messageType: "Question" as MessageType,
      severity: SEVERITY_3,
      topic: initialTopic ?? "",
      message: "",
      integrationType: "",
    },
    mode: "onSubmit",
  });

  const selectedTopic = form.watch("topic");
  const isProductFeatureTopic = TopicGroups["Product Features"].includes(
    selectedTopic as any,
  );

  // The drawer is globally mounted, so a severity selected under one org's
  // plan can survive navigation to an org (or no-org page) that no longer
  // allows it. Snap back to Severity 3 so the visible selection, the Sev-1
  // confirm dialog, and the submitted value stay consistent with the plan.
  const selectedSeverity = form.watch("severity");
  useEffect(() => {
    if (
      selectedSeverity &&
      !isSeverityAllowedForPlan(selectedSeverity, effectivePlan)
    ) {
      form.setValue("severity", SEVERITY_3);
    }
  }, [selectedSeverity, effectivePlan, form]);

  const createSupportThread = api.supportRouter.createSupportThread.useMutation(
    {
      onSuccess: (data) => {
        // Pylon is the only destination, so a failed issue means no ticket
        // exists anywhere. Keep the form state (message, topic, severity,
        // attachments) intact so the user can retry instead of wiping it.
        if (data.pylonIssueFailed) {
          showErrorToast(
            "支持请求未发送",
            "请联系 support@langfuse.com",
          );
          return;
        }
        form.reset({
          messageType: "Question",
          severity: SEVERITY_3,
          topic: "",
          message: "",
        });
        setWarnedShortOnce(false);
        setFiles(undefined);
        onSuccess();
      },
      onSettled: () => setIsSubmittingLocal(false),
    },
  );

  async function uploadFilesToPylon(filesToUpload: File[]): Promise<string[]> {
    const filePayloads = await Promise.all(
      filesToUpload.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            "",
          ),
        );
        return { fileName: file.name, fileBase64: base64 };
      }),
    );

    const res = await fetch("/api/support/upload-attachments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: filePayloads }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        (body as { error?: string }).error ??
          "上传附件到 Pylon 失败。",
      );
    }

    const body = (await res.json()) as { attachment_urls: string[] };
    return body.attachment_urls;
  }

  const onSubmit = async (values: SupportFormInput) => {
    const parsed: SupportFormValues = SupportFormSchema.parse(values);
    const msgLen = (parsed.message ?? "").trim().length;

    if (msgLen < 50 && !warnedShortOnce) {
      setWarnedShortOnce(true);
      return;
    }

    // Sev-1 pages the on-call team — require explicit confirmation before
    // submitting. The dialog's confirm action calls `submitForm` directly.
    if (parsed.severity === SEVERITY_1) {
      setSev1ConfirmOpen(true);
      return;
    }

    await submitForm(values);
  };

  const submitForm = async (values: SupportFormInput) => {
    try {
      // Parse inside the try so a failure surfaces via form.setError below
      // instead of escaping as an unhandled rejection (the confirm dialog
      // calls this outside react-hook-form's handleSubmit).
      const parsed: SupportFormValues = SupportFormSchema.parse(values);

      setIsSubmittingLocal(true);

      // Validate files using centralized validation function
      const validation = validateFiles(files);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // 1) Upload attachments to Pylon. This is the only attachment path, so
      // do NOT swallow failures: let them propagate to the outer catch (which
      // surfaces the error via form.setError) instead of silently dropping the
      // user's files while still creating the thread.
      let pylonAttachmentUrls: string[] = [];
      if (files && files.length) {
        pylonAttachmentUrls = await uploadFilesToPylon(files);
      }

      // 2) Create the support thread in Pylon
      await createSupportThread.mutateAsync({
        messageType: parsed.messageType,
        severity: parsed.severity,
        topic: parsed.topic as any,
        integrationType: parsed.integrationType,
        message: parsed.message,
        url: window.location.href,
        organizationId: organization?.id,
        projectId: project?.id,
        browserMetadata: {
          userAgent: navigator.userAgent,
          platform:
            (
              navigator as Navigator & {
                userAgentData?: { platform?: string };
              }
            ).userAgentData?.platform ?? undefined,
          language: navigator.language,
          viewport: { w: window.innerWidth, h: window.innerHeight },
        },
        pylonAttachmentUrls,
      });
    } catch (err: any) {
      console.error(err);
      setIsSubmittingLocal(false);
      form.setError("message", {
        type: "manual",
        message: err?.message ?? "提交支持请求失败。",
      });
    }
  };

  const messageIsShortAfterWarning =
    warnedShortOnce && (form.getValues("message") ?? "").trim().length < 50;

  // --- Compact attachment row helpers
  const totalMB = (totalUploadBytes / (1024 * 1024)).toFixed(2);
  const hasFiles = (files?.length ?? 0) > 0;

  return (
    <div className="mt-1 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-base font-bold">
        发送邮件给支持工程师
      </div>
      <p className="text-muted-foreground text-sm">
        详细信息能加快处理速度。您的请求越清晰，就能越快得到所需的答案。
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {/* Message Type */}
          <FormField
            control={form.control}
            name="messageType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>消息类型</FormLabel>
                <FormControl>
                  <RadioGroup
                    className="grid grid-cols-3 gap-2"
                    value={field.value ?? "Question"}
                    onValueChange={field.onChange}
                  >
                    {MESSAGE_TYPES.map((v) => (
                      <Button
                        key={v}
                        variant={field.value === v ? "default" : "outline"}
                        className="flex w-full items-center gap-2 text-sm font-normal"
                        size="default"
                        onClick={() => field.onChange(v)}
                      >
                        <span className="truncate" title={v}>
                          {v}
                        </span>
                      </Button>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormDescription className="sr-only">
                  选择您的消息类型。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Priority (maps to Pylon case_severity). Severity 1 and 2 are
              gated to Enterprise plans. */}
          <FormField
            control={form.control}
            name="severity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>优先级</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择优先级" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITIES.map((s) =>
                        isSeverityAllowedForPlan(s, effectivePlan) ? (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ) : (
                          // disableHoverableContent: without it, the grace
                          // area between item and tooltip swallows the hover
                          // when moving between the two adjacent gated items.
                          <Tooltip key={s} disableHoverableContent>
                            {/* Disabled items are pointer-events-none, so the
                                wrapper div must catch the hover instead. */}
                            <TooltipTrigger asChild>
                              <div>
                                <SelectItem value={s} disabled>
                                  {s}
                                </SelectItem>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              {s === SEVERITY_1
                                ? "严重级别 1 适用于企业版计划。"
                                : "严重级别 2 适用于企业版计划。"}
                            </TooltipContent>
                          </Tooltip>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Topic */}
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>主题</FormLabel>
                <FormControl>
                  <Select
                    value={(field.value as string | undefined) ?? undefined}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择主题" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <div className="text-muted-foreground mb-2 text-xs font-bold">
                          产品功能
                        </div>
                        {productFeatureTopics.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </div>
                      <div className="border-t p-2">
                        <div className="text-muted-foreground mb-2 text-xs font-bold">
                          运维
                        </div>
                        {TopicGroups.Operations.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Integration Type */}
          {isProductFeatureTopic && (
            <FormField
              control={form.control}
              name="integrationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>集成类型（可选）</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择集成类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {INTEGRATION_TYPES.map((it) => (
                          <SelectItem key={it} value={it}>
                            {it}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Message */}
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>消息</FormLabel>
                <div className="text-muted-foreground text-xs">
                  我们将发送邮件到您的账户邮箱。回复可能需要一个工作日。
                </div>
                <FormControl>
                  <div className="relative w-full">
                    <Textarea
                      {...field}
                      rows={8}
                      placeholder={
                        isProductFeatureTopic
                          ? "请尽可能详细地说明您想要做什么，以及您需要什么帮助。\n\n如果您的问题涉及特定的 trace、prompt、score 等，请附上链接。"
                          : "请尽可能详细地说明您想要做什么，以及您需要什么帮助。"
                      }
                    />
                  </div>
                </FormControl>

                {messageIsShortAfterWarning && (
                  <p
                    className="mt-2 text-sm text-red-500"
                    role="status"
                    aria-live="polite"
                  >
                    消息似乎较短——提供更多上下文可以帮助我们更快、更准确地为您解答。您可以按当前内容重新提交，或补充更多细节。
                  </p>
                )}

                <FormMessage />

                <Dropzone
                  className="mt-1 border-none p-0 text-left"
                  maxFiles={FILE_UPLOAD_CONSTRAINTS.maxFiles}
                  maxSize={FILE_UPLOAD_CONSTRAINTS.maxFileSizeBytes}
                  onDrop={(accepted) =>
                    setFiles((prev) => {
                      const existing = prev ?? [];
                      const merged = [...existing, ...accepted];
                      const maxFiles = FILE_UPLOAD_CONSTRAINTS.maxFiles;
                      return merged.slice(0, maxFiles);
                    })
                  }
                  onError={(error) => {
                    const userMessage = formatFileError(error);
                    showErrorToast("文件上传错误", userMessage, "WARNING");
                  }}
                  src={files}
                >
                  {/* Small, single-line trigger */}
                  <DropzoneEmptyState>
                    <div className="flex w-full cursor-pointer items-center justify-start gap-2 p-2 text-xs">
                      <Paperclip className="h-4 w-4" />
                      <span
                        className="truncate"
                        title={
                          hasFiles
                            ? `${files!.length} 个文件 • ${totalMB} MB`
                            : "添加附件"
                        }
                      >
                        {hasFiles
                          ? `${files!.length} 个文件 • ${totalMB} MB`
                          : "添加附件"}
                      </span>
                    </div>
                  </DropzoneEmptyState>
                  {/* Keep content area minimal; we still allow preview slot if needed */}
                  <DropzoneContent>
                    <div className="flex w-full cursor-pointer items-center justify-start gap-2 p-2 text-xs">
                      <Paperclip className="h-4 w-4" />
                      <span className="truncate" title="添加附件">
                        添加附件
                      </span>
                    </div>
                  </DropzoneContent>
                </Dropzone>

                {files && files.length > 0 && (
                  <div className="p-0 text-left text-sm font-bold">
                    <div className="text-muted-foreground mb-2 text-xs font-bold">
                      已添加的附件
                    </div>
                    {files?.map((file) => (
                      <div
                        key={file.name}
                        className="flex flex-row items-center justify-start gap-2 text-xs"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() =>
                            setFiles(files.filter((f) => f.name !== file.name))
                          }
                          className="p-0"
                        >
                          <span className="sr-only">删除文件</span>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setWarnedShortOnce(false);
                setFiles(undefined);
                onCancel();
              }}
              className="w-full"
            >
              取消
            </Button>

            <Button
              type="submit"
              disabled={isSubmittingLocal}
              className="w-full"
            >
              {isSubmittingLocal ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="sm" />
                  提交中…
                </span>
              ) : messageIsShortAfterWarning ? (
                "仍然提交"
              ) : (
                "提交"
              )}
            </Button>
          </div>

          {isSubmittingLocal && (
            <div className="text-muted-foreground text-xs">
              这可能需要几秒钟——请稍候，我们正在提交您的请求。
            </div>
          )}
        </form>
      </Form>

      {/* Confirmation gate before a Sev-1 request pages the on-call team. */}
      <AlertDialog open={sev1ConfirmOpen} onOpenChange={setSev1ConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              确认严重级别 1（重大业务影响）
            </AlertDialogTitle>
            <AlertDialogDescription>
              请确认您的问题具有重大业务影响。这意味着它严重影响了您在生产环境中对 Langfuse
              的使用，例如生产数据丢失、数据摄取问题或提示词获取问题。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => submitForm(form.getValues())}>
              确认并提交
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
