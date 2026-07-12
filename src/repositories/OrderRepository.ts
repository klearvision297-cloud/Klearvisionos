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
  transactionKey?: string | null;
}

export interface CreateOrderItemData {
  inventoryId?: number;
  lensSeriesId?: number;

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

  reservedInventoryId?: number;
}

export class OrderRepository {
  private db = getDatabase();

  runTransaction<T>(operation: () => T): T {
    return this.db.transaction(operation)();
  }

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
    return this.runTransaction(() => this.saveBillInTransaction(data));
  }

  findByTransactionKey(transactionKey: string) {
    return this.db.prepare("SELECT id, orderNumber FROM orders WHERE transactionKey = ?").get(transactionKey) as { id: number; orderNumber: string } | undefined;
  }

  saveBillInTransaction(data: SaveBillData) {
    console.log("[billing] Repository saveBillInTransaction", {
      orderNumber: data.order.orderNumber,
      itemCount: data.items.length,
      reservedInventoryId: data.reservedInventoryId,
    });
    const orderId = this.createOrder(data.order);
    console.log("[billing] Order row created", { orderId });
    for (const item of data.items) {
      this.createOrderItem(orderId, item);
      if (item.inventoryId && item.inventoryId !== data.reservedInventoryId) {
        console.log("[billing] Reducing inventory", { inventoryId: item.inventoryId, quantity: item.quantity });
        this.reduceInventoryStock(item.inventoryId, item.quantity, data.order.orderNumber);
      }
    }
    return orderId;
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
          transactionKey,
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
          order.transactionKey ?? null,
          now,
          now
        );

    return Number(
      (result as { lastInsertRowid: number | bigint }).lastInsertRowid
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
        lensSeriesId,
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
        ?,?,?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?,?,?,?
      )
    `
      )
      .run(
        orderId,
        item.inventoryId ?? null,
        item.lensSeriesId ?? null,
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
    quantity: number,
    orderNumber: string,
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
          referenceType,
          referenceNumber,
          createdAt
        )
        VALUES (
          ?,?,?,?,?,?,?,?,?,?
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
        "ORDER",
        orderNumber,
        new Date().toISOString()
      );
  }
}
