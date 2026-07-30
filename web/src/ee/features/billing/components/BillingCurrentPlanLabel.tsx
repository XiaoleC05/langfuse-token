// Langfuse Cloud only

import { LocalIsoDate } from "@/src/components/LocalIsoDate";

import { useBillingInformation } from "@/src/ee/features/billing/components/useBillingInformation";

export const BillingCurrentPlanLabel = () => {
  const { planLabel, cancellation } = useBillingInformation();

  return (
    <div>
      <>当前套餐:{planLabel} </>
      {cancellation?.isCancelled && cancellation.date && (
        <>
          <span>(将于 </span>
          <LocalIsoDate date={cancellation.date} accuracy="day" />
          <span> 结束)</span>
        </>
      )}
    </div>
  );
};
