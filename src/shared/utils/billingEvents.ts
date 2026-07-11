export const BILLING_DATA_CHANGED = "klear-vision:billing-data-changed";

export type BillingDataChange = {
  orderId: number;
  orderNumber: string;
  customerId: number;
};

export function publishBillingDataChange(detail: BillingDataChange) {
  window.dispatchEvent(
    new CustomEvent<BillingDataChange>(BILLING_DATA_CHANGED, { detail }),
  );
}

export function subscribeToBillingDataChanges(listener: () => void) {
  window.addEventListener(BILLING_DATA_CHANGED, listener);
  return () => window.removeEventListener(BILLING_DATA_CHANGED, listener);
}
