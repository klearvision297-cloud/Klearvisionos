import { InventoryRepository } from "../repositories/InventoryRepository";
import { PurchaseRepository } from "../repositories/PurchaseRepository";
import { SupplierRepository } from "../repositories/SupplierRepository";
import type { CreatePurchaseDTO } from "../types/purchase";

export class PurchaseService {
  private repository = new PurchaseRepository();
  private inventoryRepository = new InventoryRepository();
  private supplierRepository = new SupplierRepository();

  create(purchase: CreatePurchaseDTO) {
    const preparedPurchase = this.calculateTotals(purchase);
    this.validate(preparedPurchase);
    if (!this.supplierRepository.findById(preparedPurchase.supplierId)) throw new Error("Supplier not found.");
    for (const item of preparedPurchase.items) {
      if (!this.inventoryRepository.findById(item.inventoryId)) throw new Error("Purchase product not found.");
    }
    const purchaseNumber = this.repository.generatePurchaseNumber();
    const id = this.repository.save(purchaseNumber, preparedPurchase);
    return { id, purchaseNumber };
  }

  getAll(search?: string, status?: string) { return this.repository.findAll(search, status); }
  getById(id: number) { const purchase = this.repository.findById(id); if (!purchase) throw new Error("Purchase not found."); return purchase; }
  getSummary() { return this.repository.getSummary(); }

  private validate(purchase: CreatePurchaseDTO) {
    if (!purchase.supplierId) throw new Error("Supplier is required.");
    if (!purchase.invoiceDate || !purchase.purchaseDate) throw new Error("Invoice and purchase dates are required.");
    if (!purchase.items.length) throw new Error("Add at least one product.");
    if (purchase.totalAmount <= 0 || purchase.paidAmount < 0 || purchase.balanceAmount < 0) throw new Error("Purchase amounts are invalid.");
    if (Math.abs(purchase.totalAmount - purchase.paidAmount - purchase.balanceAmount) > 0.01) throw new Error("Payment balance must match the purchase total.");
    for (const item of purchase.items) {
      if (!item.inventoryId || item.quantity <= 0 || item.purchasePrice < 0 || item.gstRate < 0 || item.discount < 0 || item.discount > item.quantity * item.purchasePrice) throw new Error("Each purchase item requires valid quantity and pricing.");
    }
  }

  private calculateTotals(purchase: CreatePurchaseDTO): CreatePurchaseDTO {
    const items = purchase.items.map((item) => {
      const taxableAmount = item.quantity * item.purchasePrice - item.discount;
      const total = taxableAmount + taxableAmount * item.gstRate / 100;
      return { ...item, total };
    });
    const totals = items.reduce((current, item) => {
      const taxableAmount = item.quantity * item.purchasePrice - item.discount;
      return { subtotal: current.subtotal + item.quantity * item.purchasePrice, discount: current.discount + item.discount, gstAmount: current.gstAmount + taxableAmount * item.gstRate / 100, totalAmount: current.totalAmount + item.total };
    }, { subtotal: 0, discount: 0, gstAmount: 0, totalAmount: 0 });
    return { ...purchase, ...totals, balanceAmount: totals.totalAmount - purchase.paidAmount, items };
  }
}
