import { getDatabase } from "../database/db";

export interface CreateOrderData {
  orderNumber: string;
  customerId: number;
  prescriptionId?: number | null;

  invoiceType: string;
  gstMode: string;

  orderStatus: string;
  paymentStatus: string;

  orderDate: string;
  deliveryDate?: string | null;

  subtotal: number;
  discount: number;
  gstAmount: number;
  roundOff: number;
  totalAmount: number;

  paidAmount: number;
  balanceAmount: number;

  remarks?: string | null;
}

export interface CreateOrderItemData {
  inventoryId: number;

  itemCode: string;
  itemType: string;

  brand?: string | null;
  category?: string | null;
  model?: string | null;
  color?: string | null;
  size?: string | null;
  barcode?: string | null;

  hsnCode?: string | null;

  gstRate: number;

  quantity: number;

  purchasePrice: number;
  sellingPrice: number;

  discount: number;

  total: number;

  remarks?: string | null;
}

export interface SaveBillData {
  order: CreateOrderData;

  items: CreateOrderItemData[];
}

export class OrderRepository {
  private db = getDatabase();

  generateInvoiceNumber() {
    const now = new Date();

    const yy = now
      .getFullYear()
      .toString()
      .slice(-2);

    const mm = (now.getMonth() + 1)
      .toString()
      .padStart(2, "0");

    const prefix = `INV${yy}${mm}`;

    const last = this.db
      .prepare(
        `
        SELECT orderNumber
        FROM orders
        WHERE orderNumber LIKE ?
        ORDER BY orderNumber DESC
        LIMIT 1
      `
      )
      .get(`${prefix}%`) as
      | { orderNumber: string }
      | undefined;

    let sequence = 1;

    if (last) {
      sequence =
        Number(
          last.orderNumber.slice(-5)
        ) + 1;
    }

    return (
      prefix +
      sequence
        .toString()
        .padStart(5, "0")
    );
  }

  saveBill(data: SaveBillData) {
    const transaction =
      this.db.transaction(() => {
        const orderId =
          this.createOrder(data.order);

        for (const item of data.items) {
          this.createOrderItem(
            orderId,
            item
          );

          this.reduceInventoryStock(
            item.inventoryId,
            item.quantity
          );
        }

        return orderId;
      });

    return transaction();
  }

  private createOrder(
    order: CreateOrderData
  ) {
    const now =
      new Date().toISOString();

    const result =
      this.db
        .prepare(
          `
        INSERT INTO orders (
          orderNumber,
          customerId,
          prescriptionId,
          invoiceType,
          gstMode,
          orderStatus,
          paymentStatus,
          orderDate,
          deliveryDate,
          subtotal,
          discount,
          gstAmount,
          roundOff,
          totalAmount,
          paidAmount,
          balanceAmount,
          remarks,
          createdAt,
          updatedAt
        )
        VALUES (
          ?,?,?,?,?,?,?,?,?,?,
          ?,?,?,?,?,?,?,?,?
        )
      `
        )
        .run(
          order.orderNumber,
          order.customerId,
          order.prescriptionId ??
            null,
          order.invoiceType,
          order.gstMode,
          order.orderStatus,
          order.paymentStatus,
          order.orderDate,
          order.deliveryDate ??
            null,
          order.subtotal,
          order.discount,
          order.gstAmount,
          order.roundOff,
          order.totalAmount,
          order.paidAmount,
          order.balanceAmount,
          order.remarks ?? null,
          now,
          now
        );

    return Number(
      result.lastInsertRowid
    );
  }

  private createOrderItem(
    orderId: number,
    item: CreateOrderItemData
  ) {
    const now =
      new Date().toISOString();

    this.db
      .prepare(
        `
      INSERT INTO order_items (
        orderId,
        inventoryId,
        itemCode,
        itemType,
        brand,
        category,
        model,
        color,
        size,
        barcode,
        hsnCode,
        gstRate,
        quantity,
        purchasePrice,
        sellingPrice,
        discount,
        total,
        remarks,
        createdAt,
        updatedAt
      )
      VALUES (
        ?,?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?,?,?,?
      )
    `
      )
      .run(
        orderId,
        item.inventoryId,
        item.itemCode,
        item.itemType,
        item.brand ?? null,
        item.category ?? null,
        item.model ?? null,
        item.color ?? null,
        item.size ?? null,
        item.barcode ?? null,
        item.hsnCode ?? null,
        item.gstRate,
        item.quantity,
        item.purchasePrice,
        item.sellingPrice,
        item.discount,
        item.total,
        item.remarks ?? null,
        now,
        now
      );
  }

  private reduceInventoryStock(
    inventoryId: number,
    quantity: number
  ) {
    const item = this.db
      .prepare(
        `
        SELECT currentStock
        FROM inventory
        WHERE id = ?
      `
      )
      .get(inventoryId) as
      | { currentStock: number }
      | undefined;

    if (!item) {
      throw new Error(
        "Inventory item not found."
      );
    }

    const previousStock =
      item.currentStock;

    const newStock =
      previousStock - quantity;

    this.db
      .prepare(
        `
        UPDATE inventory
        SET
          currentStock = ?,
          updatedAt = ?
        WHERE id = ?
      `
      )
      .run(
        newStock,
        new Date().toISOString(),
        inventoryId
      );

    this.db
      .prepare(
        `
        INSERT INTO stock_history (
          inventoryId,
          changeType,
          previousStock,
          newStock,
          difference,
          reason,
          remarks,
          createdAt
        )
        VALUES (
          ?,?,?,?,?,?,?,?
        )
      `
      )
      .run(
        inventoryId,
        "SALE",
        previousStock,
        newStock,
        -quantity,
        "Billing",
        null,
        new Date().toISOString()
      );
  }
}