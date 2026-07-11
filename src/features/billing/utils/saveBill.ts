import toast from "react-hot-toast";

import type { BillingItem } from "../types/billing";
import type { Customer } from "../../../types/customer";
import { calculateBill } from "./billingCalculator";
import {
  validatePrescriptionDraft,
  type PrescriptionDraft,
} from "../components/PrescriptionWorkspace";
import type { LensSeriesOption } from "../components/LensSelector";
import type { AvailabilityDecision, AvailabilityEvaluation } from "../../../types/optical";
import { publishBillingDataChange } from "../../../shared/utils/billingEvents";

let pendingTransactionKey: string | null = null;

function transactionKeyForSubmission() {
  if (!pendingTransactionKey) pendingTransactionKey = crypto.randomUUID();
  return pendingTransactionKey;
}

export async function saveBill(
  customer: Customer | null,
  items: BillingItem[],
  paymentMethod: string,
  received: number,
  workflowType: "RETAIL" | "PRESCRIPTION" | "REPAIR" = "RETAIL",
  prescription?: PrescriptionDraft,
  selectedLens?: LensSeriesOption | null,
  availability?: AvailabilityEvaluation | null,
  availabilityOverrideDecision?: AvailabilityDecision,
  availabilityOverrideReason?: string,
) {
  console.log("[billing] saveBill start", {
    workflowType,
    customerId: customer?.id,
    itemCount: items.length,
    received,
  });

  if (!customer) {
    console.log("[billing] Validation failed: no customer");
    toast.error("Please select a customer.");
    return false;
  }

  if (items.length === 0) {
    console.log("[billing] Validation failed: no items");
    toast.error("Please add at least one product.");
    return false;
  }

  const selectedFrame = items.find((row) => row.item.itemType === "Frame");

  if (workflowType === "PRESCRIPTION") {
    const prescriptionValidationMessage = prescription
      ? validatePrescriptionDraft(prescription)
      : "Prescription details are required.";

    if (prescriptionValidationMessage) {
      console.log("[billing] Validation failed: prescription draft", prescriptionValidationMessage);
      toast.error(prescriptionValidationMessage);
      return false;
    }

    if (!selectedFrame) {
      console.log("[billing] Validation failed: no frame selected");
      toast.error("Please add a frame for the prescription spectacle job.");
      return false;
    }

    if (!selectedLens) {
      console.log("[billing] Validation failed: no lens selected");
      toast.error("Please select a lens series for the prescription spectacle job.");
      return false;
    }

    if (!availability) {
      console.log("[billing] Availability not ready yet; deferring to backend evaluation");
    } else if (availability.decision === "REVIEW_REQUIRED" && (!availabilityOverrideDecision || !availabilityOverrideReason?.trim())) {
      console.log("[billing] Validation failed: availability override missing");
      toast.error("Select an availability override and document the reason.");
      return false;
    }
  }

  const summary = calculateBill(
    items,
    "amount",
    0,
    "included"
  );

  if (!Number.isFinite(received) || received <= 0) {
    toast.error("Enter a received payment amount greater than zero.");
    return false;
  }

  if (received > summary.grandTotal) {
    toast.error("Received payment cannot exceed the invoice total.");
    return false;
  }

  const invalidItem = items.find((row) =>
    !Number.isInteger(row.quantity) || row.quantity < 1 ||
    row.quantity > Math.max(0, row.item.currentStock - row.item.reservedStock),
  );

  if (invalidItem) {
    toast.error(`Enter an available whole-number quantity for ${invalidItem.item.itemCode}.`);
    return false;
  }

  const order = {
    transactionKey: transactionKeyForSubmission(),
    customerId: customer.id,

    invoiceType: "Retail",

    workflowType,

    prescription: workflowType === "PRESCRIPTION" ? prescription : undefined,

    opticalJob: workflowType === "PRESCRIPTION"
      ? {
          frameInventoryId: selectedFrame?.item.id,
          lensSeriesId: selectedLens?.id,
          availabilityOverrideDecision,
          availabilityOverrideReason: availabilityOverrideReason?.trim() || undefined,
          expectedDeliveryDate: availability?.expectedDeliveryDate,
        }
      : undefined,

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
    console.log("[billing] Calling IPC", order.workflowType, order.transactionKey);
    const result =
  await window.billing.create(order);

    console.log("[billing] IPC response", result);

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

    if (!result.id || !result.orderNumber) {
      toast.error("The bill was saved but no invoice reference was returned.");
      return false;
    }

    publishBillingDataChange({
      orderId: result.id,
      orderNumber: result.orderNumber,
      customerId: customer.id,
    });
    toast.success(`Bill ${result.orderNumber} saved successfully.`);
    pendingTransactionKey = null;
    return true;
  } catch (error) {
    console.error(
      "[billing] Renderer Error:",
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
