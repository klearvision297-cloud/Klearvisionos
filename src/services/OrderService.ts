import { InventoryRepository } from "../repositories/InventoryRepository";
import { OrderRepository } from "../repositories/OrderRepository";
import { CreateOrderDTO } from "../types/order";

export class OrderService {
  private repository = new OrderRepository();

  private inventoryRepository =
    new InventoryRepository();

  create(order: CreateOrderDTO) {
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

    if (order.totalAmount <= 0) {
      throw new Error(
        "Invalid bill amount."
      );
    }

    // Check stock before saving
    for (const orderItem of order.items) {
      const inventory =
        this.inventoryRepository.findById(
          orderItem.inventoryId
        );

      if (!inventory) {
        throw new Error(
          `Item ${orderItem.itemCode} not found.`
        );
      }

      if (
        inventory.currentStock <
        orderItem.quantity
      ) {
        throw new Error(
`${inventory.brand ?? ""} ${inventory.model ?? ""}

Only ${inventory.currentStock} item(s) available in stock.`
        );
      }
    }

    const orderNumber =
      this.repository.generateInvoiceNumber();

    const orderId =
      this.repository.saveBill({
        order: {
          orderNumber,

          customerId: order.customerId,

          prescriptionId:
            order.prescriptionId ?? null,

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
        },

        items: order.items,
      });

    return {
      success: true,
      id: orderId,
      orderNumber,
    };
  }
}