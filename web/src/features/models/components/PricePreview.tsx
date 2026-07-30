import Decimal from "decimal.js";

import { PriceMapSchema } from "@/src/features/models/validation";
import { getMaxDecimals } from "@/src/features/models/utils";

export function PricePreview({
  prices,
}: {
  prices: Record<string, number | undefined>;
}) {
  const parsedPrices = PriceMapSchema.safeParse(prices);

  const getMaxDecimalsForPriceGroup = (
    price: number | undefined,
    multiplier: number,
  ) => {
    return price != null
      ? Math.max(
          ...Object.values(prices).map((price) => {
            return getMaxDecimals(price, multiplier);
          }),
        )
      : 0;
  };

  return (
    <div className="border-border bg-muted/30 rounded-lg border p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h4 className="text-muted-foreground text-sm font-bold">
            价格预览
          </h4>
        </div>

        {parsedPrices.success ? (
          <div className="space-y-2">
            <div className="border-border text-muted-foreground grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 border-b pb-2 text-xs font-bold">
              <span>用量类型</span>
              <span className="text-right">每单位</span>
              <span className="text-right">每千</span>
              <span className="text-right">每百万</span>
            </div>

            {Object.entries(parsedPrices.data)
              .filter((entry): entry is [string, number] => Boolean(entry[1]))
              .map(([usageType, price]) => (
                <div
                  key={usageType}
                  className="text-muted-foreground grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 rounded px-1 py-0.5 text-xs"
                >
                  <span className="font-bold break-all">{usageType}</span>
                  <span className="text-right font-mono">
                    $
                    {new Decimal(price).toFixed(
                      getMaxDecimalsForPriceGroup(price, 1),
                    )}
                  </span>
                  <span className="text-right font-mono">
                    $
                    {new Decimal(price)
                      .mul(1000)
                      .toFixed(getMaxDecimalsForPriceGroup(price, 1000))}
                  </span>
                  <span className="text-right font-mono">
                    $
                    {new Decimal(price)
                      .mul(1000000)
                      .toFixed(getMaxDecimalsForPriceGroup(price, 1000000))}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            价格条目无效。请检查您的输入格式。
          </div>
        )}
      </div>
    </div>
  );
}
