import { PlusCircle, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Checkbox } from "@/src/components/design-system/Checkbox/Checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type { UseFormReturn } from "react-hook-form";
import type { FormUpsertModel } from "../../validation";

type TierConditionsEditorProps = {
  tierIndex: number;
  form: UseFormReturn<FormUpsertModel>;
};

export type { TierConditionsEditorProps };

export function TierConditionsEditor({
  tierIndex,
  form,
}: TierConditionsEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `pricingTiers.${tierIndex}.conditions`,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FormLabel>条件</FormLabel>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            append({
              usageDetailPattern: "",
              operator: "gt",
              value: 0,
              caseSensitive: false,
            })
          }
        >
          <PlusCircle className="mr-1 h-4 w-4" />
          添加条件
        </Button>
      </div>

      {fields.length === 0 && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          <strong>警告：</strong>非默认层级至少需要一个条件。此层级将无法通过验证。
        </div>
      )}

      {fields.map((condition, conditionIndex) => (
        <div key={condition.id} className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">
              条件 {conditionIndex + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(conditionIndex)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Pattern */}
          <FormField
            control={form.control}
            name={`pricingTiers.${tierIndex}.conditions.${conditionIndex}.usageDetailPattern`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>用量详情模式（正则）</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="^input" />
                </FormControl>
                <FormDescription>
                  匹配用量类型键（例如 ^input、.*cache.*、output_tokens）
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Operator + Value */}
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name={`pricingTiers.${tierIndex}.conditions.${conditionIndex}.operator`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>运算符</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gt">&gt; (大于)</SelectItem>
                      <SelectItem value="gte">
                        &gt;= (大于等于)
                      </SelectItem>
                      <SelectItem value="lt">&lt; (小于)</SelectItem>
                      <SelectItem value="lte">&lt;= (小于等于)</SelectItem>
                      <SelectItem value="eq">= (等于)</SelectItem>
                      <SelectItem value="neq">!= (不等于)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`pricingTiers.${tierIndex}.conditions.${conditionIndex}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>值</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Case Sensitive */}
          <FormField
            control={form.control}
            name={`pricingTiers.${tierIndex}.conditions.${conditionIndex}.caseSensitive`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="mt-0!">区分大小写</FormLabel>
              </FormItem>
            )}
          />
        </div>
      ))}
    </div>
  );
}
