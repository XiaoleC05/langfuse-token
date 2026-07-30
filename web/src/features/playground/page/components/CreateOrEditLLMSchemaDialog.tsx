import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight } from "lucide-react";
import * as z from "zod";

import { Button } from "@/src/components/ui/button";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { LLMSchemaNameSchema } from "@/src/features/llm-schemas/validation";
import { api } from "@/src/utils/api";

import { JSONSchemaFormSchema, type LlmSchema } from "@langfuse/shared";
import { CodeMirrorEditor } from "@/src/components/editor";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";

const formSchema = z.object({
  name: LLMSchemaNameSchema,
  description: z.string().min(1, "描述为必填项"),
  schema: JSONSchemaFormSchema,
});

type FormValues = z.infer<typeof formSchema>;

type CreateOrEditLLMSchemaDialog = {
  children: React.ReactNode;
  projectId: string;
  onSave: (llmSchema: LlmSchema) => void;
  onDelete?: (llmSchema: LlmSchema) => void;
  existingLlmSchema?: LlmSchema;
  defaultValues?: {
    name: string;
    description: string;
    schema: string;
  };
};

export const CreateOrEditLLMSchemaDialog: React.FC<
  CreateOrEditLLMSchemaDialog
> = (props) => {
  const { children, projectId, onSave, existingLlmSchema } = props;

  const utils = api.useUtils();
  const createLlmSchema = api.llmSchemas.create.useMutation();
  const updateLlmSchema = api.llmSchemas.update.useMutation();
  const deleteLlmSchema = api.llmSchemas.delete.useMutation();

  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: props.defaultValues ?? {
      name: "",
      description: "",
      schema: JSON.stringify(
        {
          type: "object",
          properties: {},
          required: [],
          additionalProperties: false,
        },
        null,
        2,
      ),
    },
  });

  // Populate form when in edit mode
  useEffect(() => {
    if (existingLlmSchema && !props.defaultValues) {
      form.reset({
        name: existingLlmSchema.name,
        description: existingLlmSchema.description,
        schema: JSON.stringify(existingLlmSchema.schema, null, 2),
      });
    }
  }, [existingLlmSchema, form, props.defaultValues]);

  async function onSubmit(values: FormValues) {
    let result;
    if (existingLlmSchema) {
      result = await updateLlmSchema.mutateAsync({
        id: existingLlmSchema.id,
        projectId,
        name: values.name,
        description: values.description,
        schema: JSON.parse(values.schema),
      });
    } else {
      result = await createLlmSchema.mutateAsync({
        projectId,
        name: values.name,
        description: values.description,
        schema: JSON.parse(values.schema),
      });
    }

    await utils.llmSchemas.getAll.invalidate({ projectId });

    onSave(result);
    setOpen(false);
  }

  async function handleDelete() {
    if (!existingLlmSchema) return;

    await deleteLlmSchema.mutateAsync({
      id: existingLlmSchema.id,
      projectId,
    });

    props.onDelete?.(existingLlmSchema);

    await utils.llmSchemas.getAll.invalidate({ projectId });
    setOpen(false);
  }

  const prettifyJson = () => {
    try {
      const currentValue = form.getValues("schema");
      const parsedJson = JSON.parse(currentValue);
      const prettified = JSON.stringify(parsedJson, null, 2);
      form.setValue("schema", prettified);
    } catch {
      showErrorToast(
        "格式化 JSON 失败",
        "请验证输入是否为有效的 JSON",
        "WARNING",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex flex-col sm:min-w-128 md:min-w-160">
        <DialogHeader>
          <DialogTitle>
            {existingLlmSchema ? "编辑 LLM 结构" : "创建 LLM 结构"}
          </DialogTitle>
          <DialogDescription>
            为结构化输出定义 JSON 结构
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();

              form.handleSubmit(onSubmit)();
            }}
            className="grid max-h-full min-h-0 overflow-hidden"
          >
            <DialogBody>
              <div className="flex-1 space-y-4 overflow-y-auto">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>名称</FormLabel>
                      <FormControl>
                        <Input placeholder="例如：get_weather" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>描述</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="描述此结构"
                          className="max-h-[120px] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          {...field}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="schema"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>JSON 结构</FormLabel>
                      <FormDescription>
                        使用 JSON Schema 格式定义结构。{" "}
                        <a
                          href="https://json-schema.org/learn/miscellaneous-examples"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center"
                        >
                          查看 JSON Schema 示例
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      </FormDescription>
                      <FormControl>
                        <div className="relative flex flex-col gap-1">
                          <CodeMirrorEditor
                            value={field.value}
                            onChange={field.onChange}
                            mode="json"
                            minHeight={200}
                            className="max-h-[25vh]"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={prettifyJson}
                            className="absolute top-3 right-3 text-xs"
                          >
                            格式化
                          </Button>
                        </div>
                      </FormControl>
                      <p className="text-muted-foreground text-xs">
                        参数必须是有效的 JSON Schema 对象
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </DialogBody>

            <DialogFooter className="bg-modal sticky bottom-0 mt-4 flex flex-col gap-2 border-t pt-4">
              <div className="flex w-full flex-col gap-2">
                <p className="text-muted-foreground text-xs">
                  注意：结构变更将对本项目的所有成员生效。
                </p>
                <div className="flex items-center justify-between gap-2">
                  {existingLlmSchema && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      className="mr-auto"
                    >
                      删除
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    取消
                  </Button>
                  <Button type="submit">保存</Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
