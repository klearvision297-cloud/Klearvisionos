import { getDatabase } from "../database/db";
import type { CreatePurchaseDTO, Purchase, PurchaseItem } from "../types/purchase";

export class PurchaseRepository {
  private db = getDatabase();

  generatePurchaseNumber() {
    const now = new Date();
    const prefix = `PUR${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const last = this.db.prepare("SELECT purchaseNumber FROM purchases WHERE purchaseNumber LIKE ? ORDER BY purchaseNumber DESC LIMIT 1").get(`${prefix}%`) as { purchaseNumber: string } | undefined;
    const sequence = last ? Number(last.purchaseNumber.slice(-5)) + 1 : 1;
    return `${prefix}${String(sequence).padStart(5, "0")}`;
  }

  findAll(search = "", status = "ALL"): Purchase[] {
    const keyword = `%${search.trim()}%`;
    return this.db.prepare(`SELECT p.*, s.supplierName FROM purchases p JOIN suppliers s ON s.id = p.supplierId WHERE (? = 'ALL' OR p.status = ?) AND (p.purchaseNumber LIKE ? OR COALESCE(p.invoiceNumber, '') LIKE ? OR s.supplierName LIKE ?) ORDER BY p.purchaseDate DESC, p.id DESC`).all(status, status, keyword, keyword, keyword) as Purchase[];
  }

  findById(id: number): Purchase | undefined {
    const purchase = this.db.prepare("SELECT p.*, s.supplierName FROM purchases p JOIN suppliers s ON s.id = p.supplierId WHERE p.id = ?").get(id) as Purchase | undefined;
    if (!purchase) return undefined;
    purchase.items = this.db.prepare("SELECT * FROM purchase_items WHERE purchaseId = ? ORDER BY id").all(id) as PurchaseItem[];
    return purchase;
  }

  getSummary() {
    return this.db.prepare(`SELECT COUNT(*) AS purchaseCount, COALESCE(SUM(totalAmount), 0) AS totalValue, COALESCE(SUM(balanceAmount), 0) AS outstanding, COALESCE(SUM(CASE WHEN date(purchaseDate) = date('now') THEN totalAmount ELSE 0 END), 0) AS todayValue FROM purchases`).get() as { purchaseCount: number; totalValue: number; outstanding: number; todayValue: number };
  }

  save(purchaseNumber: string, purchase: CreatePurchaseDTO) {
    const transaction = this.db.transaction(() => {
      const now = new Date().toISOString();
      const result = this.db.prepare(`INSERT INTO purchases (purchaseNumber, supplierId, invoiceNumber, invoiceDate, purchaseDate, paymentMethod, status, subtotal, discount, gstAmount, totalAmount, paidAmount, balanceAmount, remarks, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 'POSTED', ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(purchaseNumber, purchase.supplierId, purchase.invoiceNumber?.trim() || null, purchase.invoiceDate, purchase.purchaseDate, purchase.paymentMethod, purchase.subtotal, purchase.discount, purchase.gstAmount, purchase.totalAmount, purchase.paidAmount, purchase.balanceAmount, purchase.remarks?.trim() || null, now, now) as { lastInsertRowid: number | bigint };
      const purchaseId = Number(result.lastInsertRowid);

      for (const item of purchase.items) this.saveItemAndReceiveStock(purchaseId, purchaseNumber, item, now);

      this.db.prepare(`UPDATE suppliers SET outstandingBalance = outstandingBalance + ?, lastPurchaseDate = ?, purchaseCount = purchaseCount + 1, updatedAt = ? WHERE id = ?`).run(purchase.balanceAmount, purchase.purchaseDate, now, purchase.supplierId);
      return purchaseId;
    });
    return transaction();
  }

  private saveItemAndReceiveStock(purchaseId: number, purchaseNumber: string, item: CreatePurchaseDTO["items"][number], now: string) {
    const inventory = this.db.prepare("SELECT itemCode, brand, model, currentStock FROM inventory WHERE id = ?").get(item.inventoryId) as { itemCode: string; brand: string | null; model: string | null; currentStock: number } | undefined;
    if (!inventory) throw new Error("Purchase product no longer exists.");
    const productName = [inventory.brand, inventory.model].filter(Boolean).join(" ") || inventory.itemCode;
    this.db.prepare("INSERT INTO purchase_items (purchaseId, inventoryId, itemCode, productName, quantity, purchasePrice, gstRate, discount, total, remarks, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(purchaseId, item.inventoryId, inventory.itemCode, productName, item.quantity, item.purchasePrice, item.gstRate, item.discount, item.total, item.remarks?.trim() || null, now);
    const newStock = inventory.currentStock + item.quantity;
    this.db.prepare("UPDATE inventory SET currentStock = ?, costPrice = ?, updatedAt = ? WHERE id = ?").run(newStock, item.purchasePrice, now, item.inventoryId);
    this.db.prepare("INSERT INTO stock_history (inventoryId, changeType, previousStock, newStock, difference, reason, remarks, referenceType, referenceNumber, createdAt) VALUES (?, 'PURCHASE', ?, ?, ?, 'Purchase receipt', ?, 'PURCHASE', ?, ?)").run(item.inventoryId, inventory.currentStock, newStock, item.quantity, item.remarks?.trim() || null, purchaseNumber, now);
  }
}
