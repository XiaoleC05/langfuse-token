import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Label } from "@/src/components/ui/label";
import { api } from "@/src/utils/api";
import { CopyIcon, ExternalLinkIcon } from "lucide-react";
import { copyTextToClipboard } from "@/src/utils/clipboard";

type PromptSelectionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (tag: string) => void;
  projectId: string;
};

export function PromptSelectionDialog({
  isOpen,
  onClose,
  onSelect,
  projectId,
}: PromptSelectionDialogProps) {
  const [selectedPromptName, setSelectedPromptName] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [selectionType, setSelectionType] = useState<"version" | "label">(
    "label",
  );
  const [selectedVersionOrLabel, setSelectedVersionOrLabel] =
    useState<string>("");

  const copySelectedTag = useCallback(() => {
    copyTextToClipboard(selectedTag);
  }, [selectedTag]);

  useEffect(() => {
    if (isOpen) {
      setSelectedPromptName("");
      setSelectedTag("");
      setSelectionType("label");
      setSelectedVersionOrLabel("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedPromptName && selectedVersionOrLabel) {
      if (selectionType === "version") {
        setSelectedTag(
          `@@@langfusePrompt:name=${selectedPromptName}|version=${selectedVersionOrLabel}@@@`,
        );
      } else {
        setSelectedTag(
          `@@@langfusePrompt:name=${selectedPromptName}|label=${selectedVersionOrLabel}@@@`,
        );
      }
    } else {
      setSelectedTag("");
    }
  }, [selectedPromptName, selectedVersionOrLabel, selectionType]);

  const { data: promptOptions } = api.prompts.getPromptLinkOptions.useQuery(
    {
      projectId,
    },
    {
      enabled: Boolean(projectId),
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
    },
  );

  const selectedPrompt = promptOptions?.find(
    (option) => option.name === selectedPromptName,
  );

  const handleConfirm = useCallback(() => {
    if (!selectedTag) return;
    if (onSelect) {
      onSelect(selectedTag);
    } else {
      copySelectedTag();
    }
    onClose();
  }, [copySelectedTag, selectedTag, onSelect, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加内联提示词引用</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              被引用的提示词会通过 API/SDK 获取时动态解析并插入。
              这支持模块化设计——从可复用、独立维护的组件构建复杂的提示词。
            </p>

            <div className="flex flex-col gap-2">
              <Label htmlFor="prompt-name">提示词名称</Label>
              <Select
                value={selectedPromptName}
                onValueChange={(value) => {
                  setSelectedPromptName(value);
                  setSelectedVersionOrLabel("");
                }}
              >
                <SelectTrigger id="prompt-name">
                  <SelectValue placeholder="选择文本提示词" />
                </SelectTrigger>
                <SelectContent>
                  {promptOptions?.map((prompt) => (
                    <SelectItem key={prompt.name} value={prompt.name}>
                      {prompt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                只有文本提示词可以被内联引用。
              </p>
            </div>

            {selectedPromptName && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="selection-type">引用方式</Label>
                <Select
                  value={selectionType}
                  onValueChange={(value: "version" | "label") => {
                    setSelectionType(value);
                    setSelectedVersionOrLabel("");
                  }}
                >
                  <SelectTrigger id="selection-type">
                    <SelectValue placeholder="选择链接类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="label">标签</SelectItem>
                    <SelectItem value="version">版本</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedPromptName && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="version-or-label">
                  {selectionType === "version" ? "版本" : "标签"}
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedVersionOrLabel}
                    onValueChange={setSelectedVersionOrLabel}
                  >
                    <SelectTrigger id="version-or-label">
                      <SelectValue
                        placeholder={
                          selectionType === "version"
                            ? "选择版本"
                            : "选择标签"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {selectionType === "version"
                        ? selectedPrompt?.versions.map((version) => (
                            <SelectItem
                              key={version.toString()}
                              value={version.toString()}
                            >
                              {version}
                            </SelectItem>
                          ))
                        : selectedPrompt?.labels.map((label) => (
                            <SelectItem key={label} value={label}>
                              {label}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                  {selectedVersionOrLabel && (
                    <Link
                      href={`/project/${projectId}/prompts/${selectedPromptName}?${selectionType}=${selectedVersionOrLabel}`}
                      target="_blank"
                      passHref
                    >
                      <Button type="button" variant="outline" size="icon">
                        <ExternalLinkIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedTag && (
            <div className="space-y-2">
              <Label>标签预览</Label>
              <div className="relative">
                <div className="bg-muted rounded-md border p-3 pr-10 font-mono text-xs">
                  {selectedTag}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={copySelectedTag}
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                {onSelect
                  ? "此标签将插入到提示词内容中。"
                  : "此标签将复制到剪贴板，随后插入到提示词中"}
              </p>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!selectedTag}>
            {onSelect ? "插入" : "复制并关闭"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
