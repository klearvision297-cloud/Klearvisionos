import type { BillingItem } from "../../../pages/Billing/ProductTable";

export type DiscountMode =
  | "amount"
  | "percent";

export type GstMode =
  | "included"
  | "excluded"
  | "composition";

export interface BillingSummary {
  subtotal: number;

  gst: number;

  cgst: number;

  sgst: number;

  igst: number;

  discount: number;

  roundOff: number;

  grandTotal: number;
}

export function calculateBill(
  items: BillingItem[],

  discountMode: DiscountMode,

  discountValue: number,

  gstMode: GstMode = "included"
): BillingSummary {
  let subtotal = 0;

  let gst = 0;

  let cgst = 0;

  let sgst = 0;

  let igst = 0;

  for (const row of items) {
    const price =
      row.item.sellingPrice *
      row.quantity;

    subtotal += price;

    if (gstMode === "included") {
      const itemGST =
        price -
        price /
          (1 +
            row.item.gstRate /
              100);

      gst += itemGST;

      cgst += itemGST / 2;

      sgst += itemGST / 2;
    }

    if (gstMode === "excluded") {
      const itemGST =
        price *
        (row.item.gstRate / 100);

      gst += itemGST;

      cgst += itemGST / 2;

      sgst += itemGST / 2;
    }
  }

  const discount =
    discountMode === "percent"
      ? subtotal *
        (discountValue / 100)
      : discountValue;

  const beforeRound =
    subtotal +
    (gstMode === "excluded"
      ? gst
      : 0) -
    discount;

  const grandTotal =
    Math.round(beforeRound);

  const roundOff =
    grandTotal -
    beforeRound;

  return {
    subtotal,

    gst,

    cgst,

    sgst,

    igst,

    discount,

    roundOff,

    grandTotal,
  };
}
