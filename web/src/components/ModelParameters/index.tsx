import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Slider } from "@/src/components/ui/slider";
import { CreateLLMApiKeyDialog } from "@/src/features/public-api/components/CreateLLMApiKeyDialog";
import { useHasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import useProjectIdFromURL from "@/src/hooks/useProjectIdFromURL";
import { cn } from "@/src/utils/tailwind";
import {
  type JSONObject,
  JSONObjectSchema,
  LLMAdapter,
  type supportedModels,
  type UIModelParams,
} from "@langfuse/shared";
import { InfoIcon, PlusIcon, Settings2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

import { LLMApiKeyComponent } from "./LLMApiKeyComponent";
import { FormDescription } from "@/src/components/ui/form";
import { CodeMirrorEditor } from "../editor";
import { Switch } from "@/src/components/design-system/Switch/Switch";

export type ModelParamsContext = {
  modelParams: UIModelParams;
  availableProviders: string[];
  availableModels: string[];
  providerModelCombinations: string[];
  updateModelParamValue: <Key extends keyof UIModelParams>(
    key: Key,
    value: UIModelParams[Key]["value"],
  ) => void;
  setModelParamEnabled?: (key: keyof UIModelParams, enabled: boolean) => void;
  formDisabled?: boolean;
  modelParamsDescription?: string;
  customHeader?: React.ReactNode;
  layout?: "compact" | "vertical";
  isEmbedded?: boolean;
};

export const ModelParameters: React.FC<ModelParamsContext> = ({
  modelParams,
  availableProviders,
  availableModels,
  providerModelCombinations,
  updateModelParamValue,
  setModelParamEnabled,
  formDisabled = false,
  modelParamsDescription,
  customHeader,
  layout = "vertical",
  isEmbedded = false,
}) => {
  const projectId = useProjectIdFromURL();
  const [modelSettingsOpen, setModelSettingsOpen] = useState(false);
  const [modelSettingsUsed, setModelSettingsUsed] = useState(false);

  // Standalone dialog for the "no providers yet" empty state (renders its own
  // trigger button, not inside a dropdown).
  const [createLlmApiKeyDialogOpen, setCreateLlmApiKeyDialogOpen] =
    useState(false);
  // Coordinates the inline "Add LLM Connection" action inside the combined
  // provider/model Select (compact layout) — see useAddLlmConnectionSelect.
  const providerSelect = useAddLlmConnectionSelect();

  useEffect(() => {
    const hasEnabledModelSetting = Object.keys(modelParams).some(
      (key) =>
        !["adapter", "provider", "model"].includes(key) &&
        modelParams[key as keyof typeof modelParams].enabled,
    );

    if (hasEnabledModelSetting) {
      setModelSettingsUsed(true);
    } else {
      setModelSettingsUsed(false);
    }
  }, [setModelSettingsUsed, modelParams]);

  if (!projectId) return null;

  if (availableProviders.length === 0) {
    return (
      <div className="flex flex-col space-y-4 pr-1">
        {customHeader ? (
          customHeader
        ) : (
          <div className="flex items-center justify-between">
            <p className="font-bold">模型</p>
          </div>
        )}
        <p className="text-xs">项目中未设置模型 API 密钥。</p>
        <CreateLLMApiKeyDialog
          open={createLlmApiKeyDialogOpen}
          setOpen={setCreateLlmApiKeyDialogOpen}
        />
      </div>
    );
  }

  // Settings button component for reuse
  const SettingsButton = (
    <Popover open={modelSettingsOpen} onOpenChange={setModelSettingsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-7 w-7"
          disabled={formDisabled}
        >
          <Settings2 size={14} />
          {modelSettingsUsed && (
            <div className="bg-primary absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-4"
        align={layout === "compact" ? "start" : "end"}
        sideOffset={5}
      >
        <div className="mb-3">
          <h4 className="mb-1 text-sm font-bold">模型高级设置</h4>
          <p className="text-muted-foreground text-xs">
            为你的模型配置高级参数。
          </p>
        </div>
        <div className="space-y-4">
          <ModelParamsSlider
            title="温度"
            modelParamsKey="temperature"
            formDisabled={formDisabled}
            enabled={modelParams.temperature.enabled}
            setModelParamEnabled={setModelParamEnabled}
            value={modelParams.temperature.value}
            min={0}
            max={modelParams.maxTemperature.value}
            step={0.01}
            tooltip="采样温度。较高的值会使输出更随机,较低的值会使输出更集中、更确定。"
            updateModelParam={updateModelParamValue}
          />
          <ModelParamsSlider
            title="输出 Token 上限"
            modelParamsKey="max_tokens"
            formDisabled={formDisabled}
            enabled={modelParams.max_tokens.enabled}
            setModelParamEnabled={setModelParamEnabled}
            value={modelParams.max_tokens.value}
            min={1}
            max={16384}
            step={1}
            tooltip="聊天补全中可生成的最大 Token 数。"
            updateModelParam={updateModelParamValue}
          />
          <ModelParamsSlider
            title="Top P"
            modelParamsKey="top_p"
            formDisabled={formDisabled}
            enabled={modelParams.top_p.enabled}
            setModelParamEnabled={setModelParamEnabled}
            value={modelParams.top_p.value}
            min={0}
            max={1}
            step={0.01}
            tooltip="一种与温度采样并列的采样方式,称为核采样(nucleus sampling),模型只考虑概率质量累计达到 top_p 的 Token。例如 0.1 表示仅考虑概率质量前 10% 的 Token。一般建议只调整 top_p 或温度其中之一,而非两者同时调整。"
            updateModelParam={updateModelParamValue}
          />
          {modelParams.adapter.value === LLMAdapter.VertexAI &&
            modelParams.maxReasoningTokens && (
              <ModelParamsSlider
                title="最大推理 Token 数"
                modelParamsKey="maxReasoningTokens"
                formDisabled={formDisabled}
                enabled={modelParams.maxReasoningTokens.enabled}
                setModelParamEnabled={setModelParamEnabled}
                value={modelParams.maxReasoningTokens.value}
                min={-1}
                max={24576}
                step={1}
                tooltip="模型思考/推理的最大 Token 数。设为 -1 表示默认(自动)思考,设为 0 表示禁用。仅 Gemini 2.5 及以上模型支持。"
                updateModelParam={updateModelParamValue}
              />
            )}
          <ProviderOptionsInput
            value={modelParams.providerOptions.value}
            formDisabled={formDisabled}
            enabled={modelParams.providerOptions.enabled}
            setModelParamEnabled={setModelParamEnabled}
            updateModelParam={updateModelParamValue}
          />
          <LLMApiKeyComponent {...{ projectId, modelParams }} />
        </div>
      </PopoverContent>
    </Popover>
  );

  // Compact layout - single horizontal row following standard codebase patterns
  if (layout === "compact") {
    // Create combined options in "Provider: model" format
    // We create combinations of all available providers with all available models

    // Current combined value in "Provider: model" format
    const currentCombinedValue = `${modelParams.provider.value}: ${modelParams.model.value}`;

    const handleCombinedSelection = (combinedValue: string) => {
      // Parse the combined value back into provider and model
      const colonIndex = combinedValue.indexOf(": ");
      if (colonIndex !== -1) {
        const provider = combinedValue.substring(0, colonIndex);
        const model = combinedValue.substring(colonIndex + 2);
        updateModelParamValue("provider", provider);
        updateModelParamValue("model", model);
      }
    };

    return (
      <div className="flex flex-col space-y-2 pt-2 pr-1 pb-1">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <Select
              open={providerSelect.selectOpen}
              onOpenChange={providerSelect.setSelectOpen}
              disabled={formDisabled}
              onValueChange={(value) => {
                providerSelect.notifySelection();
                handleCombinedSelection(value);
              }}
              value={currentCombinedValue}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(providerModelCombinations ?? []).map((option) => (
                  <SelectItem value={option} key={option}>
                    {option}
                  </SelectItem>
                ))}
                <AddLlmConnectionSelectAction
                  onOpen={providerSelect.openConnectionDialog}
                />
              </SelectContent>
            </Select>
            {/* Dialog lives OUTSIDE the SelectContent so closing the Select does
                not unmount it (see useAddLlmConnectionSelect). */}
            <CreateLLMApiKeyDialog
              hideTrigger
              open={providerSelect.dialogOpen}
              setOpen={providerSelect.handleDialogOpenChange}
            />
            {modelParamsDescription ? (
              <FormDescription className="mt-1 text-xs">
                {modelParamsDescription}
              </FormDescription>
            ) : undefined}
          </div>
          <div className="shrink-0">{SettingsButton}</div>
        </div>

        {modelParams.model.value?.startsWith("o1-") ? (
          <p className="text-dark-yellow mt-1 text-xs">
            {modelParams.model.value} 处于测试阶段,暂不支持系统消息以及
            temperature、max_tokens 和 top_p 设置。{" "}
            <a
              href="https://platform.openai.com/docs/guides/reasoning/beta-limitations"
              target="_blank"
              rel="noreferrer noopener"
            >
              了解更多 ↗
            </a>
          </p>
        ) : null}
      </div>
    );
  }

  // Vertical layout (default) - existing behavior
  return (
    <div
      className={cn("flex flex-col", !isEmbedded && "space-y-2 pt-2 pr-1 pb-1")}
    >
      {!isEmbedded ? (
        <div className="flex items-center justify-between">
          {customHeader ? customHeader : <p className="font-bold">模型</p>}
          {SettingsButton}
        </div>
      ) : customHeader ? (
        <div className="mb-2 flex items-center justify-between">
          {customHeader}
          {SettingsButton}
        </div>
      ) : (
        <div className="mb-2 flex justify-end">{SettingsButton}</div>
      )}

      <div className="space-y-4">
        <div className="space-y-3">
          <ModelParamsSelect
            title="提供商"
            modelParamsKey="provider"
            disabled={formDisabled}
            value={modelParams.provider.value}
            options={availableProviders}
            updateModelParam={updateModelParamValue}
            layout="vertical"
          />
          <ModelParamsSelect
            title="模型名称"
            modelParamsKey="model"
            disabled={formDisabled}
            value={modelParams.model.value}
            options={[...new Set(availableModels)]}
            updateModelParam={updateModelParamValue}
            modelParamsDescription={modelParamsDescription}
            layout="vertical"
          />
        </div>
      </div>
    </div>
  );
};

type ModelParamsSelectProps = {
  title: string;
  modelParamsKey: keyof UIModelParams;
  value: string;
  options: string[];
  updateModelParam: ModelParamsContext["updateModelParamValue"];
  disabled?: boolean;
  modelParamsDescription?: string;
  layout?: "vertical" | "compact";
};
const ModelParamsSelect = ({
  title,
  modelParamsKey,
  value,
  options,
  updateModelParam,
  disabled,
  modelParamsDescription,
  layout = "vertical",
}: ModelParamsSelectProps) => {
  const providerSelect = useAddLlmConnectionSelect();

  const handleValueChange = (next: string) => {
    providerSelect.notifySelection();
    updateModelParam(
      modelParamsKey,
      next as (typeof supportedModels)[LLMAdapter][number],
    );
  };

  // Dialog lives OUTSIDE the SelectContent so closing the Select does not
  // unmount it (see useAddLlmConnectionSelect).
  const connectionDialog = (
    <CreateLLMApiKeyDialog
      hideTrigger
      open={providerSelect.dialogOpen}
      setOpen={providerSelect.handleDialogOpenChange}
    />
  );

  // Compact layout - simplified, space-efficient (no individual labels)
  if (layout === "compact") {
    return (
      <div className="space-y-1">
        <Select
          open={providerSelect.selectOpen}
          onOpenChange={providerSelect.setSelectOpen}
          disabled={disabled}
          onValueChange={handleValueChange}
          value={value}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem value={option} key={option}>
                {option}
              </SelectItem>
            ))}
            <AddLlmConnectionSelectAction
              onOpen={providerSelect.openConnectionDialog}
            />
          </SelectContent>
        </Select>
        {connectionDialog}
        {modelParamsDescription ? (
          <FormDescription className="mt-1 text-xs">
            {modelParamsDescription}
          </FormDescription>
        ) : undefined}
      </div>
    );
  }

  // Vertical layout (default) - existing behavior
  return (
    <div className="flex items-center gap-4">
      <div className="w-24 shrink-0">
        <p
          className={cn(
            "text-xs font-bold",
            disabled && "text-muted-foreground",
          )}
        >
          {title}
        </p>
      </div>
      <div className="flex-1">
        <Select
          open={providerSelect.selectOpen}
          onOpenChange={providerSelect.setSelectOpen}
          disabled={disabled}
          onValueChange={handleValueChange}
          value={value}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem value={option} key={option}>
                {option}
              </SelectItem>
            ))}
            <AddLlmConnectionSelectAction
              onOpen={providerSelect.openConnectionDialog}
            />
          </SelectContent>
        </Select>
        {connectionDialog}
        {modelParamsDescription ? (
          <FormDescription className="mt-1 text-xs">
            {modelParamsDescription}
          </FormDescription>
        ) : undefined}
      </div>
    </div>
  );
};

type ModelParamsSliderProps = {
  title: string;
  modelParamsKey: keyof UIModelParams;
  value: number;
  tooltip: string;
  min: number;
  max: number;
  step: number;
  updateModelParam: ModelParamsContext["updateModelParamValue"];
  enabled?: boolean;
  formDisabled?: boolean;
  setModelParamEnabled?: ModelParamsContext["setModelParamEnabled"];
};
const ModelParamsSlider = ({
  title,
  modelParamsKey,
  value,
  tooltip,
  min,
  max,
  step,
  updateModelParam,
  setModelParamEnabled,
  enabled,
  formDisabled,
}: ModelParamsSliderProps) => {
  return (
    <div className="space-y-3" title={tooltip}>
      <div className="flex flex-row">
        <p
          className={cn(
            "flex-1 text-xs font-bold",
            (!enabled || formDisabled) && "text-muted-foreground",
          )}
        >
          {title}
        </p>
        <div className="flex flex-row space-x-3">
          <Input
            className="h-6 w-14 appearance-none px-2 text-right"
            type="number"
            disabled={!enabled || formDisabled}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => {
              updateModelParam(
                modelParamsKey,
                Math.max(Math.min(parseFloat(event.target.value), max), min),
              );
            }}
          />
          {setModelParamEnabled ? (
            <Switch
              title={`控制是否发送 ${title} 参数`}
              disabled={formDisabled}
              checked={enabled}
              onCheckedChange={(checked) => {
                setModelParamEnabled(modelParamsKey, checked);
              }}
            />
          ) : null}
        </div>
      </div>
      <Slider
        disabled={!enabled || formDisabled}
        min={min}
        max={max}
        step={step}
        onValueChange={(value) => {
          if (value[0] !== undefined)
            updateModelParam(modelParamsKey, value[0]);
        }}
        value={[value]}
      />
    </div>
  );
};

type ProviderOptionsInputProps = {
  value: JSONObject | undefined;
  updateModelParam: ModelParamsContext["updateModelParamValue"];
  setModelParamEnabled: ModelParamsContext["setModelParamEnabled"];
  enabled: boolean;
  formDisabled: boolean;
};
const ProviderOptionsInput = ({
  value,
  updateModelParam,
  setModelParamEnabled,
  enabled,
  formDisabled,
}: ProviderOptionsInputProps) => {
  const [inputValue, setInputValue] = useState<string>(
    value ? JSON.stringify(value, null, 2) : "{}",
  );
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-row">
        <div className="flex-1 flex-row space-x-1">
          <span
            className={cn(
              "text-xs font-bold",
              (!enabled || formDisabled) && "text-muted-foreground",
            )}
          >
            附加选项
          </span>
          <Tooltip>
            <TooltipTrigger>
              <InfoIcon className="text-muted-foreground size-3" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] p-2">
              传递给调用请求的附加选项。支持的取值请参阅你所用提供商的 API
              参考文档。
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex flex-row space-x-3">
          {setModelParamEnabled ? (
            <Switch
              title="控制是否发送附加选项参数"
              disabled={formDisabled}
              checked={enabled}
              onCheckedChange={(checked) => {
                setModelParamEnabled("providerOptions", checked);
              }}
            />
          ) : null}
        </div>
      </div>

      {enabled && (
        <div>
          <CodeMirrorEditor
            value={inputValue}
            onChange={(value) => {
              setInputValue(value);

              try {
                const parsed = JSONObjectSchema.parse(JSON.parse(value));
                updateModelParam("providerOptions", parsed);
                setError(null);
              } catch {
                setError("无效的 JSON 对象");
              }
            }}
            editable={enabled && !formDisabled}
            mode="json"
            lineNumbers={false}
          />
          {error && (
            <span className="pt-6">
              <p className="text-[12px] text-red-500">{error}</p>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Coordinates a provider/model `Select` that offers an inline "Add LLM
 * Connection" action which opens the {@link CreateLLMApiKeyDialog}.
 *
 * A dropdown should not stay open while it spawns a modal (see the overlay
 * lifecycle note in web/AGENTS.md): the still-open Radix Select content sits in
 * the `popover` layer, above the `modal` layer, so it would paint over the
 * dialog and the two focus/dismiss scopes would fight. We therefore control the
 * Select's open state, close it as the dialog opens, and — because a Radix
 * Select unmounts its content when it closes (which would tear down a dialog
 * nested inside it) — the dialog is rendered as a SIBLING of the Select, not a
 * child of its content.
 *
 * When the dialog closes we reopen the dropdown, but only if the user hasn't
 * committed a selection in the meantime, so they can finish the pick they came
 * for (e.g. choose the connection they just added).
 */
function useAddLlmConnectionSelect() {
  const [selectOpen, setSelectOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const madeSelectionRef = useRef(false);

  const openConnectionDialog = useCallback(() => {
    madeSelectionRef.current = false;
    setSelectOpen(false);
    setDialogOpen(true);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open && !madeSelectionRef.current) {
      setSelectOpen(true);
    }
  }, []);

  const notifySelection = useCallback(() => {
    madeSelectionRef.current = true;
  }, []);

  return {
    selectOpen,
    setSelectOpen,
    dialogOpen,
    openConnectionDialog,
    handleDialogOpenChange,
    notifySelection,
  };
}

/**
 * The inline "Add LLM Connection" action rendered at the bottom of a provider
 * Select. Gated by `llmApiKeys:create` so we don't show a dead button (and so we
 * don't leave a dangling separator) for users without access. On click it hands
 * off to the coordinator, which closes the dropdown before opening the dialog.
 */
function AddLlmConnectionSelectAction({ onOpen }: { onOpen: () => void }) {
  const projectId = useProjectIdFromURL();
  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "llmApiKeys:create",
  });

  if (!hasAccess) return null;

  return (
    <>
      <SelectSeparator />
      <Button type="button" variant="secondary" onClick={onOpen}>
        <PlusIcon className="mr-1.5 -ml-0.5 h-5 w-5" aria-hidden="true" />
        添加模型连接
      </Button>
    </>
  );
}
