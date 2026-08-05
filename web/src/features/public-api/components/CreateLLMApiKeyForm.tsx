import { useFieldArray, useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type BedrockApiKey,
  type BedrockAccessKeys,
  type BedrockConfig,
  type OpenAIConfig,
  type VertexAIConfig,
  LLMAdapter,
  BEDROCK_USE_DEFAULT_CREDENTIALS,
  VERTEXAI_USE_DEFAULT_CREDENTIALS,
} from "@langfuse/shared";
import { ChevronDown, PlusIcon, TrashIcon } from "lucide-react";
import { z } from "zod";
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
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { api, type RouterOutputs } from "@/src/utils/api";
import { cn } from "@/src/utils/tailwind";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { type useUiCustomization } from "@/src/ee/features/ui-customization/useUiCustomization";
import { DialogFooter } from "@/src/components/ui/dialog";
import { DialogBody } from "@/src/components/ui/dialog";
import { env } from "@/src/env.mjs";
import {
  AuthMethod,
  BedrockAuthMethodSchema,
  type BedrockAuthMethod,
} from "@/src/features/llm-api-key/types";

const isLangfuseCloud = Boolean(env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION);

/**
 * UI-only sentinel value for the adapter dropdown. Selecting it does not set a
 * real adapter; instead it surfaces guidance that any OpenAI-compatible
 * provider can be added through one of the existing adapters.
 */
const OTHER_MODEL_OPTION = "other-model";

const isCustomModelsRequired = (adapter: LLMAdapter) =>
  adapter === LLMAdapter.Azure || adapter === LLMAdapter.Bedrock;

const hasText = (value?: string) => Boolean(value?.trim());

/**
 * Whether the selected auth method matches the existing one (i.e. credentials
 * can be preserved on update). DefaultCredentials is grouped with AccessKeys
 * because both use SigV4-based authentication via the AWS SDK.
 */
const isMatchingBedrockAuthMethod = (
  newAuthMethod: BedrockAuthMethod,
  existingAuthMethod?: BedrockAuthMethod,
): boolean =>
  (newAuthMethod === AuthMethod.ApiKey &&
    existingAuthMethod === AuthMethod.ApiKey) ||
  (newAuthMethod === AuthMethod.AccessKeys &&
    (existingAuthMethod === AuthMethod.AccessKeys ||
      existingAuthMethod === AuthMethod.DefaultCredentials));

type LlmApiKeyListItem = RouterOutputs["llmApiKey"]["all"]["data"][number];

const getInitialBedrockAuthMethod = (params: {
  mode: "create" | "update";
  existingAuthMethod?: BedrockAuthMethod;
}): BedrockAuthMethod => {
  if (params.mode === "update") {
    return params.existingAuthMethod === AuthMethod.ApiKey
      ? AuthMethod.ApiKey
      : AuthMethod.AccessKeys;
  }

  return AuthMethod.AccessKeys;
};

const createFormSchema = (params: {
  mode: "create" | "update";
  existingAuthMethod?: BedrockAuthMethod;
}) =>
  z
    .object({
      secretKey: z.string().optional(),
      provider: z
        .string()
        .min(1, "请添加标识此连接的提供商名称。")
        .regex(
          /^[^:]+$/,
          "提供商名称不能包含冒号。请使用类似 'OpenRouter_Mistral' 的格式。",
        ),
      adapter: z.enum(LLMAdapter),
      baseURL: z.union([z.literal(""), z.url()]),
      withDefaultModels: z.boolean(),
      customModels: z.array(z.object({ value: z.string().min(1) })),
      awsAccessKeyId: z.string().optional(),
      awsSecretAccessKey: z.string().optional(),
      bedrockApiKey: z.string().optional(),
      authMethod: BedrockAuthMethodSchema,
      awsRegion: z.string().optional(),
      vertexAILocation: z.string().optional(),
      openAIUseResponsesApi: z.boolean(),
      extraHeaders: z.array(
        z.object({
          key: z.string().min(1),
          value:
            params.mode === "create"
              ? z.string().min(1)
              : z.string().optional(),
        }),
      ),
    })
    .superRefine((data, ctx) => {
      if (data.adapter !== LLMAdapter.Bedrock) return;

      const hasRegion = hasText(data.awsRegion);
      const hasAccessKeyId = hasText(data.awsAccessKeyId);
      const hasSecretAccessKey = hasText(data.awsSecretAccessKey);
      const hasBedrockApiKey = hasText(data.bedrockApiKey);
      const hasAnyAccessKeys = hasAccessKeyId || hasSecretAccessKey;
      const { authMethod } = data;
      const isUpdatingCurrentAuthMethod =
        params.mode === "update" &&
        isMatchingBedrockAuthMethod(authMethod, params.existingAuthMethod);

      if (!hasRegion) {
        ctx.addIssue({
          code: "custom",
          message: "AWS 区域为必填项。",
          path: ["awsRegion"],
        });
      }

      if (authMethod === AuthMethod.AccessKeys) {
        if (isUpdatingCurrentAuthMethod && !hasAnyAccessKeys) {
          return;
        }

        if (!isLangfuseCloud && !hasAnyAccessKeys) {
          return;
        }

        if (!hasAccessKeyId) {
          ctx.addIssue({
            code: "custom",
            message: "AWS 访问密钥 ID 为必填项。",
            path: ["awsAccessKeyId"],
          });
        }

        if (!hasSecretAccessKey) {
          ctx.addIssue({
            code: "custom",
            message: "AWS 秘密访问密钥为必填项。",
            path: ["awsSecretAccessKey"],
          });
        }
        return;
      }

      if (isUpdatingCurrentAuthMethod && !hasBedrockApiKey) {
        return;
      }

      if (!hasBedrockApiKey) {
        ctx.addIssue({
          code: "custom",
          message: "Bedrock API 密钥为必填项。",
          path: ["bedrockApiKey"],
        });
      }
    })
    .refine(
      (data) => {
        if (isCustomModelsRequired(data.adapter)) {
          return data.customModels.length > 0;
        }
        return true;
      },
      {
        message: "此适配器至少需要一个自定义模型。",
        path: ["customModels"],
      },
    )
    // 2) For adapters that support defaults, require default models or at least one custom model
    .refine(
      (data) => {
        if (isCustomModelsRequired(data.adapter)) {
          return true;
        }
        return data.withDefaultModels || data.customModels.length > 0;
      },
      {
        message:
          "禁用默认模型时，至少需要一个自定义模型名称。",
        path: ["withDefaultModels"],
      },
    )
    // Vertex AI validation - service account key or ADC sentinel value required
    .refine(
      (data) => {
        if (data.adapter !== LLMAdapter.VertexAI) return true;

        // In update mode, credentials are optional (existing ones are preserved)
        if (params.mode === "update") return true;

        // secretKey is required (either JSON key or VERTEXAI_USE_DEFAULT_CREDENTIALS sentinel)
        return !!data.secretKey;
      },
      {
        message: isLangfuseCloud
          ? "Vertex AI 需要 GCP 服务账号 JSON 密钥。"
          : "需要 GCP 服务账号 JSON 密钥或应用程序默认凭证。",
        path: ["secretKey"],
      },
    )
    .refine(
      (data) =>
        data.adapter === LLMAdapter.Bedrock ||
        data.adapter === LLMAdapter.VertexAI ||
        params.mode === "update" ||
        data.secretKey,
      {
        message: "密钥为必填项。",
        path: ["secretKey"],
      },
    )
    .refine(
      (data) => {
        if (data.adapter !== LLMAdapter.Azure) return true;
        return data.baseURL && data.baseURL.trim() !== "";
      },
      {
        message: "Azure 连接需要 API 基础 URL。",
        path: ["baseURL"],
      },
    );

interface CreateLLMApiKeyFormProps {
  projectId?: string;
  onSuccess: () => void;
  customization: ReturnType<typeof useUiCustomization>;
  mode?: "create" | "update";
  existingKey?: LlmApiKeyListItem;
}

export function CreateLLMApiKeyForm({
  projectId,
  onSuccess,
  customization,
  mode = "create",
  existingKey,
}: CreateLLMApiKeyFormProps) {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  // When the "Other model" option is selected we hide the form fields and show
  // guidance instead. This is purely UI state and never reaches the form value.
  const [showOtherModelInfo, setShowOtherModelInfo] = useState(false);
  const [adapterSelectOpen, setAdapterSelectOpen] = useState(false);
  const utils = api.useUtils();
  const capture = usePostHogClientCapture();

  const existingKeys = api.llmApiKey.all.useQuery(
    {
      projectId: projectId as string,
    },
    { enabled: Boolean(projectId) },
  );

  const mutCreateLlmApiKey = api.llmApiKey.create.useMutation({
    onSuccess: () => utils.llmApiKey.invalidate(),
  });

  const mutUpdateLlmApiKey = api.llmApiKey.update.useMutation({
    onSuccess: () => utils.llmApiKey.invalidate(),
  });

  const mutTestLLMApiKey = api.llmApiKey.test.useMutation();
  const mutTestUpdateLLMApiKey = api.llmApiKey.testUpdate.useMutation();

  const defaultAdapter: LLMAdapter = customization?.defaultModelAdapter
    ? LLMAdapter[customization.defaultModelAdapter]
    : LLMAdapter.OpenAI;

  const getCustomizedBaseURL = (adapter: LLMAdapter) => {
    switch (adapter) {
      case LLMAdapter.OpenAI:
        return customization?.defaultBaseUrlOpenAI ?? "";
      case LLMAdapter.Azure:
        return customization?.defaultBaseUrlAzure ?? "";
      case LLMAdapter.Anthropic:
        return customization?.defaultBaseUrlAnthropic ?? "";
      default:
        return "";
    }
  };

  const formSchema = createFormSchema({
    mode,
    existingAuthMethod: existingKey?.authMethod,
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues:
      mode === "update" && existingKey
        ? {
            adapter: existingKey.adapter as LLMAdapter,
            provider: existingKey.provider,
            secretKey:
              existingKey.adapter === LLMAdapter.VertexAI &&
              existingKey.displaySecretKey === "Default GCP credentials (ADC)"
                ? VERTEXAI_USE_DEFAULT_CREDENTIALS
                : "",
            baseURL:
              existingKey.baseURL ??
              getCustomizedBaseURL(existingKey.adapter as LLMAdapter),
            withDefaultModels: existingKey.withDefaultModels,
            customModels: existingKey.customModels.map((value) => ({ value })),
            extraHeaders:
              existingKey.extraHeaderKeys?.map((key) => ({ key, value: "" })) ??
              [],
            vertexAILocation:
              existingKey.adapter === LLMAdapter.VertexAI && existingKey.config
                ? ((existingKey.config as VertexAIConfig).location ?? "")
                : "",
            openAIUseResponsesApi:
              existingKey.adapter === LLMAdapter.OpenAI &&
              existingKey.config != null
                ? Boolean((existingKey.config as OpenAIConfig).useResponsesApi)
                : false,
            awsRegion:
              existingKey.adapter === LLMAdapter.Bedrock && existingKey.config
                ? ((existingKey.config as BedrockConfig).region ?? "")
                : "",
            awsAccessKeyId: "",
            awsSecretAccessKey: "",
            bedrockApiKey: "",
            authMethod: getInitialBedrockAuthMethod({
              mode,
              existingAuthMethod: existingKey.authMethod,
            }),
          }
        : {
            adapter: defaultAdapter,
            provider: "",
            secretKey: "",
            baseURL: getCustomizedBaseURL(defaultAdapter),
            withDefaultModels: true,
            customModels: [],
            extraHeaders: [],
            vertexAILocation: "global",
            openAIUseResponsesApi: false,
            awsRegion: "",
            awsAccessKeyId: "",
            awsSecretAccessKey: "",
            bedrockApiKey: "",
            authMethod: getInitialBedrockAuthMethod({
              mode,
            }),
          },
  });

  const currentAdapter = form.watch("adapter");
  const currentAuthMethod = form.watch("authMethod");
  const isKeepingCurrentBedrockAuthMethod =
    mode === "update" &&
    currentAdapter === LLMAdapter.Bedrock &&
    isMatchingBedrockAuthMethod(currentAuthMethod, existingKey?.authMethod);
  const isUsingDefaultAwsCredentialsForCurrentAuthMethod =
    currentAuthMethod === AuthMethod.AccessKeys &&
    existingKey?.authMethod === AuthMethod.DefaultCredentials;

  const hasAdvancedSettings = (adapter: LLMAdapter) =>
    adapter === LLMAdapter.OpenAI ||
    adapter === LLMAdapter.Anthropic ||
    adapter === LLMAdapter.VertexAI ||
    adapter === LLMAdapter.GoogleAIStudio;

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customModels",
  });

  const {
    fields: headerFields,
    append: appendHeader,
    remove: removeHeader,
  } = useFieldArray({
    control: form.control,
    name: "extraHeaders",
  });

  const renderCustomModelsField = () => (
    <FormField
      control={form.control}
      name="customModels"
      render={() => (
        <FormItem>
          <FormLabel>自定义模型</FormLabel>
          <FormDescription>
            给定端点接受的自定义模型名称。
          </FormDescription>
          {currentAdapter === LLMAdapter.Azure && (
            <FormDescription className="text-dark-yellow">
              对于 Azure，模型名称应与 Azure 中的部署名称相同。进行评估时，请选择具有函数调用能力的模型。
            </FormDescription>
          )}

          {currentAdapter === LLMAdapter.Bedrock && (
            <FormDescription className="text-dark-yellow">
              {
                "对于 Bedrock，模型名称为 Bedrock 推理配置文件 ID，例如 'eu.anthropic.claude-sonnet-4-6'"
              }
            </FormDescription>
          )}

          {fields.map((customModel, index) => (
            <span key={customModel.id} className="flex flex-row space-x-2">
              <Input
                {...form.register(`customModels.${index}.value`)}
                placeholder={`自定义模型名称 ${index + 1}`}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => remove(index)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </span>
          ))}
          <Button
            type="button"
            variant="ghost"
            onClick={() => append({ value: "" })}
            className="w-full"
          >
            <PlusIcon className="mr-1.5 -ml-0.5 h-5 w-5" aria-hidden="true" />
            添加自定义模型名称
          </Button>
        </FormItem>
      )}
    />
  );

  const renderExtraHeadersField = () => (
    <FormField
      control={form.control}
      name="extraHeaders"
      render={() => (
        <FormItem>
          <FormLabel>额外请求头</FormLabel>
          <FormDescription>
            可选的额外 HTTP 请求头，随请求发送至模型提供商。所有请求头值已加密存储{" "}
            {isLangfuseCloud ? "在我们的服务器上" : "在您的数据库中"}。
          </FormDescription>

          {headerFields.map((header, index) => (
            <div key={header.id} className="flex flex-row space-x-2">
              <Input
                {...form.register(`extraHeaders.${index}.key`)}
                placeholder="请求头名称"
              />
              <Input
                {...form.register(`extraHeaders.${index}.value`)}
                placeholder={
                  mode === "update" &&
                  existingKey?.extraHeaderKeys &&
                  existingKey.extraHeaderKeys[index]
                    ? "***"
                    : "请求头值"
                }
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeHeader(index)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="ghost"
            onClick={() => appendHeader({ key: "", value: "" })}
            className="w-full"
          >
            <PlusIcon className="mr-1.5 -ml-0.5 h-5 w-5" aria-hidden="true" />
            添加请求头
          </Button>
        </FormItem>
      )}
    />
  );

  // Disable provider and adapter fields in update mode
  const isFieldDisabled = (fieldName: string) => {
    if (mode !== "update") return false;
    return ["provider", "adapter"].includes(fieldName);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!projectId) return console.error("No project ID found.");

    if (mode === "create") {
      if (
        existingKeys?.data?.data
          .map((k) => k.provider)
          .includes(values.provider)
      ) {
        form.setError("provider", {
          type: "manual",
          message: "此提供商已存在 API 密钥。",
        });
        return;
      }
      capture("project_settings:llm_api_key_create", {
        provider: values.provider,
      });
    } else {
      capture("project_settings:llm_api_key_update", {
        provider: values.provider,
      });
    }

    let secretKey = values.secretKey;
    let config: BedrockConfig | OpenAIConfig | VertexAIConfig | undefined;

    if (currentAdapter === LLMAdapter.Bedrock) {
      const shouldPreserveExistingBedrockCredentials =
        mode === "update" &&
        isMatchingBedrockAuthMethod(values.authMethod, existingKey?.authMethod);

      switch (values.authMethod) {
        case AuthMethod.ApiKey:
          secretKey =
            shouldPreserveExistingBedrockCredentials && !values.bedrockApiKey
              ? undefined
              : JSON.stringify({
                  apiKey: values.bedrockApiKey!,
                } satisfies BedrockApiKey);
          break;
        case AuthMethod.AccessKeys:
          if (!values.awsAccessKeyId && !values.awsSecretAccessKey) {
            secretKey = shouldPreserveExistingBedrockCredentials
              ? undefined
              : BEDROCK_USE_DEFAULT_CREDENTIALS;
          } else {
            secretKey = JSON.stringify({
              accessKeyId: values.awsAccessKeyId!,
              secretAccessKey: values.awsSecretAccessKey!,
            } satisfies BedrockAccessKeys);
          }
          break;
      }

      config = {
        region: values.awsRegion ?? "",
      };
    } else if (currentAdapter === LLMAdapter.VertexAI) {
      // Handle Vertex AI credentials
      // secretKey already contains either JSON key or VERTEXAI_USE_DEFAULT_CREDENTIALS sentinel
      if (mode === "update") {
        // In update mode, only update secretKey if a new one is provided
        if (values.secretKey) {
          secretKey = values.secretKey;
        } else {
          // Keep existing credentials by not setting secretKey
          secretKey = undefined;
        }
      }
      // In create mode, secretKey is already set from values.secretKey

      // Build config with location only (projectId removed for security - ADC auto-detects)
      const vertexAIConfig: VertexAIConfig = {};
      if (values.vertexAILocation?.trim()) {
        vertexAIConfig.location = values.vertexAILocation.trim();
      }
      // If config is empty, set to undefined
      config =
        Object.keys(vertexAIConfig).length > 0 ? vertexAIConfig : undefined;
    } else if (currentAdapter === LLMAdapter.OpenAI) {
      config =
        values.openAIUseResponsesApi || mode === "update"
          ? { useResponsesApi: values.openAIUseResponsesApi }
          : undefined;
    }

    const extraHeaders =
      values.extraHeaders.length > 0
        ? values.extraHeaders.reduce(
            (acc, header) => {
              acc[header.key] = header.value ?? "";
              return acc;
            },
            {} as Record<string, string>,
          )
        : undefined;

    const newLlmApiKey = {
      id: existingKey?.id ?? "",
      projectId,
      secretKey: secretKey ?? "",
      provider: values.provider,
      adapter: values.adapter,
      baseURL: values.baseURL || undefined,
      withDefaultModels: isCustomModelsRequired(currentAdapter)
        ? false
        : values.withDefaultModels,
      config,
      customModels: values.customModels
        .map((m) => m.value.trim())
        .filter(Boolean),
      extraHeaders,
    };

    try {
      const testResult =
        mode === "create"
          ? await mutTestLLMApiKey.mutateAsync(newLlmApiKey)
          : await mutTestUpdateLLMApiKey.mutateAsync(newLlmApiKey);

      if (!testResult.success) throw new Error(testResult.error);
    } catch (error) {
      form.setError("root", {
        type: "manual",
        message:
          error instanceof Error
            ? error.message
            : "无法验证 API 密钥。",
      });

      return;
    }

    return (mode === "create" ? mutCreateLlmApiKey : mutUpdateLlmApiKey)
      .mutateAsync(newLlmApiKey)
      .then(() => {
        form.reset();
        onSuccess();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4 overflow-auto"
        onSubmit={(e) => {
          e.stopPropagation(); // Prevent event bubbling to parent forms
          form.handleSubmit(onSubmit)(e);
        }}
      >
        <DialogBody>
          {/* LLM adapter */}
          <FormField
            control={form.control}
            name="adapter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>模型适配器</FormLabel>
                <FormDescription>
                  该提供商端点接受的架构。
                </FormDescription>
                <Select
                  open={adapterSelectOpen}
                  onOpenChange={setAdapterSelectOpen}
                  value={showOtherModelInfo ? OTHER_MODEL_OPTION : field.value}
                  onValueChange={(value) => {
                    if (value === OTHER_MODEL_OPTION) {
                      setShowOtherModelInfo(true);
                      return;
                    }
                    setShowOtherModelInfo(false);
                    // Only reset the base URL when the adapter actually
                    // changes. Bouncing through the "other model" sentinel and
                    // back to the same adapter looks like a value change to
                    // Radix, but must not wipe a custom base URL the user
                    // already entered.
                    if (value !== field.value) {
                      form.setValue(
                        "baseURL",
                        getCustomizedBaseURL(value as LLMAdapter),
                      );
                    }
                    field.onChange(value as LLMAdapter);
                  }}
                  disabled={isFieldDisabled("adapter")}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择模型提供商" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(LLMAdapter).map((provider) => (
                      <SelectItem value={provider} key={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                    {mode === "create" && (
                      <SelectItem value={OTHER_MODEL_OPTION}>
                        其他模型
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {showOtherModelInfo && (
            <div className="bg-muted/40 text-muted-foreground space-y-2 rounded-md border p-4 text-sm">
              <p>
                您可以将任何支持列表中适配器的模型提供商用作模型连接。许多提供商支持
                OpenAI API 架构，例如 Z.ai、OpenRouter、Qwen、Mistral、
                Hugging Face 等。只需将 API 基础 URL 替换为该模型的
                端点，并添加您提供商的自定义模型名称和 API 密钥。
              </p>
              <p>
                <a
                  href="https://langfuse.com/docs/administration/llm-connection#supported-providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  了解有关支持的提供商的更多信息
                </a>
              </p>
            </div>
          )}

          {!showOtherModelInfo && (
            <>
              {/* Provider name */}
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>提供商名称</FormLabel>
                    <FormDescription>
                      用于在 Langfuse 中标识连接的键名。不能包含冒号。
                    </FormDescription>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={`e.g. ${currentAdapter}`}
                        disabled={isFieldDisabled("provider")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* API Key or AWS Credentials or Vertex AI Credentials */}
              {currentAdapter === LLMAdapter.Bedrock ? (
                <>
                  <FormField
                    control={form.control}
                    name="authMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>认证方式</FormLabel>
                        <FormDescription>
                          选择 Langfuse 如何向 Bedrock 进行认证。
                        </FormDescription>
                        <FormControl>
                          <Tabs
                            value={field.value}
                            onValueChange={(value) =>
                              field.onChange(value as BedrockAuthMethod)
                            }
                            className="w-full"
                          >
                            <TabsList
                              className={cn(
                                "grid h-auto w-full gap-1",
                                "grid-cols-2",
                              )}
                            >
                              <TabsTrigger
                                value={AuthMethod.AccessKeys}
                                className="text-xs"
                              >
                                AWS 访问密钥
                              </TabsTrigger>
                              <TabsTrigger
                                value={AuthMethod.ApiKey}
                                className="text-xs"
                              >
                                API 密钥
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="awsRegion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AWS 区域</FormLabel>
                        <FormDescription>
                          {mode === "update" &&
                            existingKey?.config &&
                            (existingKey.config as BedrockConfig).region && (
                              <span className="text-sm">
                                当前：{" "}
                                <code className="bg-muted rounded px-1 py-0.5">
                                  {(existingKey.config as BedrockConfig).region}
                                </code>
                              </span>
                            )}
                        </FormDescription>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={
                              mode === "update" && existingKey?.config
                                ? ((existingKey.config as BedrockConfig)
                                    .region ?? "")
                                : "例如：us-east-1"
                            }
                            data-1p-ignore
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {currentAuthMethod === AuthMethod.ApiKey && (
                    <FormField
                      control={form.control}
                      name="bedrockApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bedrock API 密钥</FormLabel>
                          <FormDescription>
                            {mode === "update" ? (
                              <>
                                Use{" "}
                                <a
                                  href="https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline hover:text-blue-800"
                                >
                                  Amazon Bedrock API 密钥
                                </a>{" "}
                                以替换当前认证方式。
                              </>
                            ) : (
                              <>
                                Use{" "}
                                <a
                                  href="https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline hover:text-blue-800"
                                >
                                  Amazon Bedrock API 密钥
                                </a>
                                。
                              </>
                            )}
                          </FormDescription>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder={
                                mode === "update"
                                  ? isKeepingCurrentBedrockAuthMethod &&
                                    existingKey?.displaySecretKey
                                    ? `${existingKey.displaySecretKey}（如不替换则保留）`
                                    : "输入 Bedrock API 密钥"
                                  : undefined
                              }
                              autoComplete="new-password"
                              data-1p-ignore
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {currentAuthMethod === AuthMethod.AccessKeys && (
                    <>
                      <FormField
                        control={form.control}
                        name="awsAccessKeyId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              AWS 访问密钥 ID
                              {!isLangfuseCloud && (
                                <span className="text-muted-foreground font-normal">
                                  {" "}
                                  （可选）
                                </span>
                              )}
                            </FormLabel>
                            <FormDescription>
                              {mode === "update"
                                ? isKeepingCurrentBedrockAuthMethod
                                  ? "留空以保留现有凭证。要更新，请同时提供访问密钥 ID 和秘密访问密钥。"
                                  : "请同时提供访问密钥 ID 和秘密访问密钥。"
                                : isLangfuseCloud
                                  ? "这些应该是具有 `bedrock:InvokeModel` 权限的 AWS 用户的长期凭证。"
                                  : "对于自托管部署，AWS 凭证是可选的。不提供时，认证将使用 AWS SDK 默认凭证提供程序链。"}
                            </FormDescription>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={
                                  mode === "update"
                                    ? isUsingDefaultAwsCredentialsForCurrentAuthMethod
                                      ? "使用默认 AWS 凭证"
                                      : isKeepingCurrentBedrockAuthMethod
                                        ? "••••••••（现有凭证留空则保留）"
                                        : "输入 AWS 访问密钥 ID"
                                    : undefined
                                }
                                autoComplete="off"
                                data-1p-ignore
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="awsSecretAccessKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              AWS 秘密访问密钥
                              {!isLangfuseCloud && (
                                <span className="text-muted-foreground font-normal">
                                  {" "}
                                  （可选）
                                </span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder={
                                  mode === "update"
                                    ? isUsingDefaultAwsCredentialsForCurrentAuthMethod
                                      ? "使用默认 AWS 凭证"
                                      : isKeepingCurrentBedrockAuthMethod &&
                                          existingKey?.displaySecretKey
                                        ? `${existingKey.displaySecretKey}（留空则保留）`
                                        : "输入 AWS 秘密访问密钥"
                                    : undefined
                                }
                                autoComplete="new-password"
                                data-1p-ignore
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  {!isLangfuseCloud &&
                    currentAuthMethod === AuthMethod.AccessKeys && (
                      <div className="text-muted-foreground space-y-2 border-l-2 border-blue-200 pl-4 text-sm">
                        <p>
                          <strong>默认凭证提供程序链：</strong>{" "}
                          当省略 AWS 凭证时，系统将按以下顺序自动检查凭证：
                        </p>
                        <ul className="ml-2 list-inside list-disc space-y-1">
                          <li>
                            环境变量 (AWS_ACCESS_KEY_ID,
                            AWS_SECRET_ACCESS_KEY)
                          </li>
                          <li>AWS 凭证文件 (~/.aws/credentials)</li>
                          <li>EC2 实例的 IAM 角色</li>
                          <li>ECS 任务的 IAM 角色</li>
                        </ul>
                        <p>
                          <a
                            href="https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            了解有关 AWS 凭证提供程序的更多信息 →
                          </a>
                        </p>
                      </div>
                    )}
                </>
              ) : currentAdapter === LLMAdapter.VertexAI ? (
                <>
                  {/* Vertex AI ADC option for self-hosted only, create mode only */}
                  {!isLangfuseCloud && mode === "create" && (
                    <FormItem>
                      <span className="flex">
                        <span className="flex-1">
                          <FormLabel>
                            使用应用程序默认凭证（ADC）
                          </FormLabel>
                          <FormDescription>
                            启用后，认证将使用 GCP 环境的默认凭证而非服务账号密钥。
                          </FormDescription>
                        </span>
                        <FormControl>
                          <Switch
                            checked={
                              form.watch("secretKey") ===
                              VERTEXAI_USE_DEFAULT_CREDENTIALS
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                form.setValue(
                                  "secretKey",
                                  VERTEXAI_USE_DEFAULT_CREDENTIALS,
                                );
                              } else {
                                form.setValue("secretKey", "");
                              }
                            }}
                          />
                        </FormControl>
                      </span>
                    </FormItem>
                  )}

                  {/* Service Account Key - hidden when ADC is enabled */}
                  {(isLangfuseCloud ||
                    form.watch("secretKey") !==
                      VERTEXAI_USE_DEFAULT_CREDENTIALS) && (
                    <FormField
                      control={form.control}
                      name="secretKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GCP 服务账号密钥（JSON）</FormLabel>
                          <FormDescription>
                            {isLangfuseCloud
                              ? "您的 API 密钥已加密存储在我们的服务器上。"
                              : "您的 API 密钥已加密存储在您的数据库中。"}
                          </FormDescription>
                          <FormDescription className="text-dark-yellow">
                            在此粘贴您的 GCP 服务账号 JSON 密钥。服务账号必须具有
                            `Vertex AI User` 角色权限。示例 JSON：
                            <pre className="text-xs">
                              {`{
  "type": "service_account",
  "project_id": "<project_id>",
  "private_key_id": "<private_key_id>",
  "private_key": "<private_key>",
  "client_email": "<client_email>",
  "client_id": "<client_id>",
  "auth_uri": "<auth_uri>",
  "token_uri": "<token_uri>",
  "auth_provider_x509_cert_url": "<auth_provider_x509_cert_url>",
  "client_x509_cert_url": "<client_x509_cert_url>",
}`}
                            </pre>
                          </FormDescription>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={
                                mode === "update"
                                  ? existingKey?.displaySecretKey
                                  : '{"type": "service_account", ...}'
                              }
                              autoComplete="off"
                              spellCheck="false"
                              autoCapitalize="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* ADC info box for self-hosted */}
                  {!isLangfuseCloud &&
                    form.watch("secretKey") ===
                      VERTEXAI_USE_DEFAULT_CREDENTIALS && (
                      <div className="text-muted-foreground space-y-2 border-l-2 border-blue-200 pl-4 text-sm">
                        <p>
                          <strong>
                            应用程序默认凭证（ADC）：
                          </strong>{" "}
                          启用后，系统将按以下顺序自动检查凭证：
                        </p>
                        <ul className="ml-2 list-inside list-disc space-y-1">
                          <li>
                            Environment variable
                            (GOOGLE_APPLICATION_CREDENTIALS)
                          </li>
                          <li>
                            gcloud CLI credentials (gcloud auth
                            application-default login)
                          </li>
                          <li>GKE Workload Identity</li>
                          <li>Cloud Run service account</li>
                          <li>
                            GCE instance service account (metadata service)
                          </li>
                        </ul>
                        <p>
                          <a
                            href="https://cloud.google.com/docs/authentication/application-default-credentials"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            了解有关 GCP 应用程序默认凭证的更多信息
                            →
                          </a>
                        </p>
                      </div>
                    )}
                </>
              ) : (
                <FormField
                  control={form.control}
                  name="secretKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API 密钥</FormLabel>
                      <FormDescription>
                        {isLangfuseCloud
                          ? "您的 API 密钥已加密存储在我们的服务器上。"
                          : "您的 API 密钥已加密存储在您的数据库中。"}
                      </FormDescription>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={
                            mode === "update"
                              ? existingKey?.displaySecretKey
                              : undefined
                          }
                          autoComplete="off"
                          spellCheck="false"
                          autoCapitalize="off"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Azure Base URL - Always required for Azure */}
              {currentAdapter === LLMAdapter.Azure && (
                <FormField
                  control={form.control}
                  name="baseURL"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API 基础 URL</FormLabel>
                      <FormDescription>
                        请按以下格式（或兼容 API）添加基础 URL：
                        https://&#123;instanceName&#125;.openai.azure.com/openai/deployments
                      </FormDescription>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://your-instance.openai.azure.com/openai/deployments"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Custom models: top-level for Azure/Bedrock */}
              {isCustomModelsRequired(currentAdapter) &&
                renderCustomModelsField()}

              {/* Extra headers - show for Azure in main section (Azure has no advanced settings) */}
              {currentAdapter === LLMAdapter.Azure && renderExtraHeadersField()}

              {hasAdvancedSettings(currentAdapter) && (
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="flex items-center pl-0"
                    onClick={() =>
                      setShowAdvancedSettings(!showAdvancedSettings)
                    }
                  >
                    <span>
                      {showAdvancedSettings
                        ? "隐藏高级设置"
                        : "显示高级设置"}
                    </span>
                    <ChevronDown
                      className={`ml-1 h-4 w-4 transition-transform ${showAdvancedSettings ? "rotate-180" : "rotate-0"}`}
                    />
                  </Button>
                </div>
              )}

              {hasAdvancedSettings(currentAdapter) && showAdvancedSettings && (
                <div className="space-y-4 border-t pt-4">
                  {/* baseURL */}
                  <FormField
                    control={form.control}
                    name="baseURL"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API 基础 URL</FormLabel>
                        <FormDescription>
                          留空则使用指定模型适配器的默认基础 URL。{" "}
                          {currentAdapter === LLMAdapter.OpenAI && (
                            <span>
                              OpenAI 默认值：https://api.openai.com/v1
                            </span>
                          )}
                          {currentAdapter === LLMAdapter.Anthropic && (
                            <span>
                              Anthropic 默认值：https://api.anthropic.com
                              （不含 /v1/messages）
                            </span>
                          )}
                        </FormDescription>

                        <FormControl>
                          <Input {...field} placeholder="default" />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* VertexAI Location */}
                  {currentAdapter === LLMAdapter.VertexAI && (
                    <FormField
                      control={form.control}
                      name="vertexAILocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>位置（可选）</FormLabel>
                          <FormDescription>
                            Google Cloud 区域（例如：global、us-central1、
                            europe-west4）。Gemini 3 模型要求默认使用{" "}
                            <span className="font-bold">global</span>。
                          </FormDescription>
                          <FormControl>
                            <Input {...field} placeholder="global" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* OpenAI Responses API */}
                  {currentAdapter === LLMAdapter.OpenAI && (
                    <FormField
                      control={form.control}
                      name="openAIUseResponsesApi"
                      render={({ field }) => (
                        <FormItem>
                          <span className="flex">
                            <span className="flex-1">
                              <FormLabel>使用 Responses API</FormLabel>
                              <FormDescription>
                                通过 Responses API 而非 Chat Completions 路由 OpenAI 请求。
                              </FormDescription>
                            </span>

                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </span>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Extra Headers */}
                  {[LLMAdapter.OpenAI, LLMAdapter.Anthropic].includes(
                    currentAdapter,
                  ) && renderExtraHeadersField()}

                  {/* With default models */}
                  <FormField
                    control={form.control}
                    name="withDefaultModels"
                    render={({ field }) => (
                      <FormItem>
                        <span className="flex">
                          <span className="flex-1">
                            <FormLabel>启用默认模型</FormLabel>
                            <FormDescription>
                              所选适配器的默认模型将在 Langfuse 功能中可用。
                            </FormDescription>
                          </span>

                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </span>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Custom model names */}
                  {!isCustomModelsRequired(currentAdapter) &&
                    renderCustomModelsField()}
                </div>
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter>
          <div className="flex min-w-0 flex-col gap-4">
            {showOtherModelInfo ? (
              <Button
                type="button"
                className="w-full"
                onClick={() => setAdapterSelectOpen(true)}
              >
                选择适配器
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full"
                loading={form.formState.isSubmitting}
              >
                {mode === "create" ? "创建连接" : "保存更改"}
              </Button>
            )}
            {form.formState.errors.root && (
              <div className="max-h-32 overflow-y-auto">
                <FormMessage className="break-words wrap-anywhere">
                  {form.formState.errors.root.message}
                </FormMessage>
              </div>
            )}
          </div>
        </DialogFooter>
      </form>
    </Form>
  );
}
