import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2, Webhook, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { ActionButton } from "@/src/components/ActionButton";
import { StatusBadge } from "@/src/components/layouts/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import {
  WEB_CALLOUT_BLOCKED_HEADER_NAMES,
  WEB_CALLOUT_HEADER_NAME_PATTERN,
} from "@/src/features/web-callouts/headerRules";
import { api, type RouterOutputs } from "@/src/utils/api";

type WebCalloutEndpoint = RouterOutputs["webCallouts"]["all"][number];

const webCalloutFormSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1).max(100),
    url: z.url(),
    enabled: z.boolean(),
    toastMessage: z.string().trim().min(1).max(200),
    headers: z.array(
      z.object({
        name: z.string(),
        value: z.string(),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    const seenHeaderNames = new Set<string>();

    data.headers.forEach((header, index) => {
      const name = header.name.trim();

      if (!name) {
        return;
      }

      const lowerName = name.toLowerCase();

      if (!WEB_CALLOUT_HEADER_NAME_PATTERN.test(name)) {
        ctx.addIssue({
          code: "custom",
          message: "无效的请求头名称。",
          path: ["headers", index, "name"],
        });
      }

      if (WEB_CALLOUT_BLOCKED_HEADER_NAMES.has(lowerName)) {
        ctx.addIssue({
          code: "custom",
          message: "此请求头由 Langfuse 自动设置，无法自定义。",
          path: ["headers", index, "name"],
        });
      }

      if (seenHeaderNames.has(lowerName)) {
        ctx.addIssue({
          code: "custom",
          message: "请求头名称必须唯一。",
          path: ["headers", index, "name"],
        });
      }

      seenHeaderNames.add(lowerName);
    });
  });

type WebCalloutFormValues = z.infer<typeof webCalloutFormSchema>;

export function WebCalloutSettingsPage(props: { projectId: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] =
    useState<WebCalloutEndpoint | null>(null);

  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "integrations:CRUD",
  });

  const endpoints = api.webCallouts.all.useQuery(
    { projectId: props.projectId },
    { enabled: hasAccess },
  );
  const utils = api.useUtils();

  const deleteMutation = api.webCallouts.delete.useMutation({
    onSuccess: async () => {
      await utils.webCallouts.invalidate();
      showSuccessToast({
        title: "提示端点已删除",
        description: "该端点已从此项目中移除。",
      });
    },
    onError: (error) => {
      showErrorToast("删除提示端点失败", error.message);
    },
  });

  if (!hasAccess) {
    return (
      <div>
        <Alert>
          <AlertTitle>访问被拒绝</AlertTitle>
          <AlertDescription>
            您没有管理此项目集成的权限。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const configuredEndpoint = endpoints.data?.[0];
  const canCreateEndpoint = !configuredEndpoint;
  const addEndpointDisabledReason = endpoints.isLoading
    ? "正在加载提示端点配置。"
    : !canCreateEndpoint
      ? "目前每个项目只能创建一个提示。"
      : undefined;

  const openCreateDialog = () => {
    setEditingEndpoint(null);
    setDialogOpen(true);
  };

  const openEditDialog = (endpoint: WebCalloutEndpoint) => {
    setEditingEndpoint(endpoint);
    setDialogOpen(true);
  };

  return (
    <div>
      <p className="text-primary mb-4 text-sm">
        配置项目级提示。您的用户可以在追踪、观测和会话详情页面触发向端点的 POST
        请求。这可用于与您的服务集成以触发工作流。更多信息请参阅文档{" "}
        <a
          href="https://langfuse.com/docs/observability/features/web-callouts"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          此处
        </a>
        。
      </p>

      <div className="mb-4 flex justify-end">
        <WebCalloutEndpointDialog
          projectId={props.projectId}
          endpoint={editingEndpoint}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingEndpoint(null);
            }
          }}
          trigger={
            <AddEndpointButton
              disabledReason={addEndpointDisabledReason}
              onClick={openCreateDialog}
            />
          }
        />
      </div>

      <Card className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-primary">名称</TableHead>
              <TableHead className="text-primary">端点</TableHead>
              <TableHead className="text-primary">提示消息</TableHead>
              <TableHead className="text-primary">请求头</TableHead>
              <TableHead className="text-primary">状态</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {endpoints.data?.length === 0 ? (
              <TableRow>
                <TableCell
                  density="comfortable"
                  colSpan={6}
                  className="text-muted-foreground text-center"
                >
                  未配置提示端点。
                </TableCell>
              </TableRow>
            ) : (
              endpoints.data?.map((endpoint) => (
                <TableRow key={endpoint.id}>
                  <TableCell density="comfortable" className="font-bold">
                    {endpoint.name}
                  </TableCell>
                  <TableCell
                    density="comfortable"
                    className="max-w-xl font-mono break-all"
                  >
                    {endpoint.url}
                  </TableCell>
                  <TableCell density="comfortable">
                    <ToastMessageCell endpoint={endpoint} />
                  </TableCell>
                  <TableCell density="comfortable">
                    <HeaderList endpoint={endpoint} />
                  </TableCell>
                  <TableCell density="comfortable">
                    <StatusBadge
                      type={endpoint.enabled ? "active" : "disabled"}
                    />
                  </TableCell>
                  <TableCell density="comfortable" className="text-right">
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(endpoint)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>编辑端点</TooltipContent>
                      </Tooltip>
                      <DeleteEndpointButton
                        endpoint={endpoint}
                        onDelete={(id) => {
                          deleteMutation.mutate({
                            projectId: props.projectId,
                            id,
                          });
                        }}
                        loading={deleteMutation.isPending}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function AddEndpointButton(props: {
  disabledReason?: string;
  onClick: () => void;
}) {
  const button = (
    <Button
      disabled={Boolean(props.disabledReason)}
      className={props.disabledReason ? "pointer-events-none" : undefined}
      onClick={props.onClick}
    >
      <Plus className="mr-1 h-4 w-4" />
      添加端点
    </Button>
  );

  if (!props.disabledReason) {
    return <DialogTrigger asChild>{button}</DialogTrigger>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-not-allowed">{button}</span>
      </TooltipTrigger>
      <TooltipContent>{props.disabledReason}</TooltipContent>
    </Tooltip>
  );
}

function HeaderList(props: { endpoint: WebCalloutEndpoint }) {
  const headers = props.endpoint.requestHeaderKeys;

  if (headers.length === 0) {
    return <span className="text-muted-foreground">无</span>;
  }

  return (
    <span className="font-mono text-sm break-words">{headers.join(", ")}</span>
  );
}

function ToastMessageCell(props: { endpoint: WebCalloutEndpoint }) {
  return (
    <div
      className="max-w-xs truncate text-sm"
      title={props.endpoint.toastMessage}
    >
      {props.endpoint.toastMessage}
    </div>
  );
}

function WebCalloutEndpointDialog(props: {
  projectId: string;
  endpoint: WebCalloutEndpoint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
}) {
  const utils = api.useUtils();
  const upsertMutation = api.webCallouts.upsert.useMutation({
    onSuccess: async () => {
      await utils.webCallouts.invalidate();
      showSuccessToast({
        title: props.endpoint
          ? "提示端点已更新"
          : "提示端点已创建",
        description: "网页提示配置已保存。",
      });
      props.onOpenChange(false);
    },
    onError: (error) => {
      showErrorToast("保存提示端点失败", error.message);
    },
  });

  const form = useForm<WebCalloutFormValues>({
    resolver: zodResolver(webCalloutFormSchema),
    defaultValues: endpointToFormValues(props.endpoint),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "headers",
  });

  useEffect(() => {
    if (props.open) {
      form.reset(endpointToFormValues(props.endpoint));
    }
  }, [form, props.endpoint, props.open]);

  const onSubmit = (values: WebCalloutFormValues) => {
    upsertMutation.mutate({
      projectId: props.projectId,
      id: values.id,
      name: values.name,
      url: values.url,
      enabled: values.enabled,
      toastMessage: values.toastMessage,
      requestHeaders: formValuesToRequestHeaders(values),
    });
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.trigger}
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {props.endpoint ? "编辑提示端点" : "添加提示端点"}
          </DialogTitle>
          <DialogDescription>
            当用户点击网页提示操作时，Langfuse 会从后端发送 JSON POST 请求。{" "}
            <a
              href="https://langfuse.com/docs/observability/features/web-callouts"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              查看文档
            </a>
            。
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <DialogBody className="min-h-0">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>名称</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>端点 URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/langfuse/callout"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      HTTP 或 HTTPS URL。允许自定义端口。该端点由 Langfuse
                      后端调用。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel>启用</FormLabel>
                      <FormDescription>
                        在追踪、观测和会话详情页头部显示提示操作。
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toastMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>提示消息</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>后端提示成功发送后显示。</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>请求头</FormLabel>
                <FormDescription className="mb-2">
                  可选的请求头，将添加到后端 POST 请求中。Content-Type
                  会自动设置。对于已有的请求头名称，将值留空以保留加密的值。
                </FormDescription>
                <div className="space-y-2">
                  {fields.map((field, index) => {
                    const currentHeaderName = form.watch(
                      `headers.${index}.name`,
                    );
                    const preservesExistingValue = hasExistingHeaderName(
                      props.endpoint,
                      currentHeaderName,
                    );

                    return (
                      <div
                        key={field.id}
                        className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-2"
                      >
                        <FormField
                          control={form.control}
                          name={`headers.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="请求头名称" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`headers.${index}.value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder={
                                    preservesExistingValue ? "***" : "请求头值"
                                  }
                                  type="password"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>移除请求头</TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() =>
                    append({
                      name: "",
                      value: "",
                    })
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  添加请求头
                </Button>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => props.onOpenChange(false)}
              >
                取消
              </Button>
              <Button type="submit" loading={upsertMutation.isPending}>
                保存端点
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteEndpointButton(props: {
  endpoint: WebCalloutEndpoint;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>删除端点</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>删除提示端点</DialogTitle>
          <DialogDescription>
            这将删除已配置的端点并隐藏网页提示操作。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button
            variant="destructive"
            loading={props.loading}
            onClick={() => {
              props.onDelete(props.endpoint.id);
              setOpen(false);
            }}
          >
            删除端点
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const endpointToFormValues = (
  endpoint: WebCalloutEndpoint | null,
): WebCalloutFormValues => ({
  id: endpoint?.id,
  name: endpoint?.name ?? "默认",
  url: endpoint?.url ?? "",
  enabled: endpoint?.enabled ?? true,
  toastMessage: endpoint?.toastMessage ?? "提示已发送",
  headers: (endpoint?.requestHeaderKeys ?? []).map((name) => ({
    name,
    value: "",
  })),
});

const formValuesToRequestHeaders = (
  values: WebCalloutFormValues,
): Record<string, string> =>
  Object.fromEntries(
    values.headers
      .filter((header) => header.name.trim())
      .map((header) => [header.name.trim(), header.value.trim()]),
  );

const hasExistingHeaderName = (
  endpoint: WebCalloutEndpoint | null,
  name: string,
) => {
  const normalizedName = name.trim().toLowerCase();
  if (!normalizedName) {
    return false;
  }

  return (
    endpoint?.requestHeaderKeys.some(
      (headerName) => headerName.toLowerCase() === normalizedName,
    ) ?? false
  );
};

export function WebCalloutIntegrationCard(props: {
  projectId: string;
  hasAccess: boolean;
}) {
  return (
    <Card className="p-3">
      <div className="mb-4 flex items-center gap-2">
        <Webhook className="text-foreground h-5 w-5" />
        <span className="font-bold">网页提示</span>
      </div>
      <p className="text-primary mb-4 text-sm">
        从追踪、观测和会话详情视图向您自己的应用发送后端提示。
      </p>
      <ActionButton
        variant="secondary"
        hasAccess={props.hasAccess}
        href={`/project/${props.projectId}/settings/integrations/web-callouts`}
      >
        配置
      </ActionButton>
    </Card>
  );
}
