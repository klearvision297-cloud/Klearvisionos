import toast from "react-hot-toast";

import type { BillingItem } from "./ProductTable";
import type { Customer } from "../../types/customer";
import { calculateBill } from "../../features/billing/utils/billingCalculator";

export async function saveBill(
  customer: Customer | null,
  items: BillingItem[],
  paymentMethod: string,
  received: number
) {
  if (!customer) {
    toast.error("Please select a customer.");
    return false;
  }

  if (items.length === 0) {
    toast.error("Please add at least one product.");
    return false;
  }

  const summary = calculateBill(
    items,
    "amount",
    0,
    "included"
  );

  const order = {
    customerId: customer.id,

    invoiceType: "Retail",

    gstMode: "included",

    orderDate: new Date().toISOString(),

    subtotal: summary.subtotal,

    discount: summary.discount,

    gstAmount: summary.gst,

    roundOff: summary.roundOff,

    totalAmount: summary.grandTotal,

    paidAmount: received,

    balanceAmount:
      summary.grandTotal - received,

    remarks: paymentMethod,

    items: items.map((row) => ({
      inventoryId: row.item.id,

      itemCode: row.item.itemCode,

      itemType: row.item.itemType,

      brand: row.item.brand,

      category: row.item.category,

      model: row.item.model,

      color: row.item.color,

      size: row.item.size,

      barcode: row.item.barcode,

      hsnCode: row.item.hsnCode,

      gstRate: row.item.gstRate,

      quantity: row.quantity,

      purchasePrice:
        row.item.costPrice,

      sellingPrice:
        row.item.sellingPrice,

      discount: 0,

      total:
        row.quantity *
        row.item.sellingPrice,
    })),
  };

  try {
    const result =
  await window.billing.create(order);

    if (
  typeof result === "object" &&
  result !== null &&
  "success" in result &&
  result.success === false
) {
  toast.error(
    "message" in result
      ? String(result.message)
      : "Unable to save bill."
  );

  return false;
}

    return true;
  } catch (error) {
    console.error(
      "Renderer Error:",
      error
    );

    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error(
        "Unable to save bill."
      );
    }

    return false;
  }
}