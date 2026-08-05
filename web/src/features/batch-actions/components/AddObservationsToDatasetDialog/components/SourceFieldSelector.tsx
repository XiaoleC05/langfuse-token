import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type { SourceField } from "../types";

type SourceFieldSelectorProps = {
  value: SourceField;
  onChange: (field: SourceField) => void;
  disabled?: boolean;
};

export function SourceFieldSelector({
  value,
  onChange,
  disabled = false,
}: SourceFieldSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as SourceField)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="input">输入</SelectItem>
        <SelectItem value="output">输出</SelectItem>
        <SelectItem value="metadata">元数据</SelectItem>
      </SelectContent>
    </Select>
  );
}
