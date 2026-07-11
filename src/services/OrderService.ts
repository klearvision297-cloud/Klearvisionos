import { InventoryRepository } from "../repositories/InventoryRepository";
import { OrderRepository } from "../repositories/OrderRepository";
import { CreateOrderDTO } from "../types/order";
import { OpticalService } from "./OpticalService";
import { PaymentRepository } from "../repositories/PaymentRepository";
import { PrescriptionRepository } from "../repositories/PrescriptionRepository";

export class OrderService {
  private repository = new OrderRepository();

  private inventoryRepository =
    new InventoryRepository();

  private opticalService = new OpticalService();
  private paymentRepository = new PaymentRepository();
  private prescriptionRepository = new PrescriptionRepository();

  create(order: CreateOrderDTO) {
    console.log("[billing] Entered OrderService.create", {
      workflowType: order.workflowType,
      transactionKey: order.transactionKey,
      customerId: order.customerId,
      itemCount: order.items.length,
    });
    if (!order.transactionKey) throw new Error("A billing transaction key is required.");
    const transactionKey = order.transactionKey;
    const existing = this.repository.findByTransactionKey(transactionKey);
    if (existing) return { success: true, id: existing.id, orderNumber: existing.orderNumber, code: "DUPLICATE_TRANSACTION" };
    if (!order.customerId) {
      throw new Error(
        "Customer is required."
      );
    }

    if (order.items.length === 0) {
      throw new Error(
        "Please add at least one item."
      );
    }

    if (!Number.isFinite(order.totalAmount) || order.totalAmount <= 0) {
      throw new Error(
        "Invalid bill amount."
      );
    }

    if (!Number.isFinite(order.paidAmount) || order.paidAmount <= 0) {
      throw new Error("Received payment must be greater than zero.");
    }

    if (order.paidAmount > order.totalAmount) {
      throw new Error("Received payment cannot exceed the invoice total.");
    }

    const workflowType = order.workflowType ?? "RETAIL";
    const reservedFrameId = workflowType === "PRESCRIPTION" ? order.opticalJob?.frameInventoryId : undefined;
    const shouldCreateOpticalJob = workflowType !== "RETAIL";

    if (workflowType === "PRESCRIPTION" && !order.prescriptionId && !order.prescription) {
      throw new Error("A prescription is required for prescription spectacles.");
    }

    // Check stock before saving. A selected prescription frame is reserved by the job,
    // while all other sold items are deducted by the invoice.
    const quantitiesByInventory = new Map<number, number>();
    for (const orderItem of order.items) {
      if (!Number.isInteger(orderItem.quantity) || orderItem.quantity < 1) {
        throw new Error(`Quantity for ${orderItem.itemCode} must be a whole number of at least 1.`);
      }
      quantitiesByInventory.set(
        orderItem.inventoryId,
        (quantitiesByInventory.get(orderItem.inventoryId) ?? 0) + orderItem.quantity,
      );
    }

    for (const [inventoryId, quantity] of quantitiesByInventory) {
      const inventory =
        this.inventoryRepository.findById(
          inventoryId
        );

      if (!inventory) {
        throw new Error(
          `Inventory item ${inventoryId} not found.`
        );
      }

      if (!inventory.isActive) {
        throw new Error(`${inventory.itemCode} is inactive and cannot be billed.`);
      }

      if (
        inventory.currentStock - (Number(inventory.reservedStock) || 0) <
        quantity
      ) {
        throw new Error(
`${inventory.brand ?? ""} ${inventory.model ?? ""}

Only ${inventory.currentStock} item(s) available in stock.`
        );
      }
    }

    const orderNumber =
      this.repository.generateInvoiceNumber();

    try {
    console.log("[billing] Creating invoice/order");
    const result = this.repository.runTransaction(() => {
    const persistedPrescription = order.prescription ? this.prescriptionRepository.createInTransaction({ customerId: order.customerId, ...order.prescription }) : undefined;
    const prescriptionId = persistedPrescription?.id ?? order.prescriptionId;
    const orderId = this.repository.saveBillInTransaction({
        order: {
          orderNumber,

          customerId: order.customerId,

          prescriptionId: prescriptionId ?? null,

          invoiceType:
            order.invoiceType,

          gstMode:
            order.gstMode,

          orderStatus:
            "Completed",

          paymentStatus:
            order.balanceAmount > 0
              ? "Partial"
              : "Paid",

          orderDate:
            order.orderDate,

          deliveryDate:
            order.deliveryDate ??
            null,

          subtotal:
            order.subtotal,

          discount:
            order.discount,

          gstAmount:
            order.gstAmount,

          roundOff:
            order.roundOff,

          totalAmount:
            order.totalAmount,

          paidAmount:
            order.paidAmount,

          balanceAmount:
            order.balanceAmount,

          remarks:
            order.remarks ?? null,
          transactionKey,
        },

      items: order.items,
      reservedInventoryId: reservedFrameId,
    });

    let jobNumber: string | undefined;
    let jobId: number | undefined;

    if (shouldCreateOpticalJob) {
      console.log("[billing] Creating optical job", { workflowType, orderId, prescriptionId });
      const job = this.opticalService.createJob({
        orderId,
        customerId: order.customerId,
        prescriptionId,
        prescriptionVersionId: order.opticalJob?.prescriptionVersionId,
        prescription: order.prescription,
        frameInventoryId: reservedFrameId,
        lensSeriesId: order.opticalJob?.lensSeriesId,
        workflowType: workflowType === "REPAIR" ? "REPAIR" : "PRESCRIPTION",
        availabilityOverrideDecision: order.opticalJob?.availabilityOverrideDecision,
        availabilityOverrideReason: order.opticalJob?.availabilityOverrideReason,
      });
      jobNumber = job.jobNumber;
      jobId = job.id;
    }

    console.log("[billing] Creating payment");
    this.paymentRepository.createInTransaction(orderId, order.customerId, order.paidAmount, order.remarks ?? "Cash", transactionKey);

    console.log("[billing] Commit success", { orderId, orderNumber, jobId, jobNumber });
    return {
      success: true,
      code: "CREATED",
      id: orderId,
      orderNumber,
      jobId,
      jobNumber,
    };
    });
    return result;
    } catch (error) {
      console.error("[billing] OrderService save failed", error);
      if (error instanceof Error) throw error;
      throw new Error("Billing could not be saved. No transaction was recorded.");
    }
  }
}
