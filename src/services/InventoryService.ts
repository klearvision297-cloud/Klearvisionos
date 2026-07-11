import { InventoryRepository } from "../repositories/InventoryRepository";
import { CreateInventoryDTO } from "../types/inventory";

export class InventoryService {
  private repository = new InventoryRepository();

  create(item: CreateInventoryDTO) {
    const itemCode = this.generateItemCode();

    const existing =
      this.repository.findByItemCode(itemCode);

    if (existing) {
      throw new Error(
        "Generated Item Code already exists."
      );
    }

    return this.repository.create(
      itemCode,
      item
    );
  }

  private generateItemCode() {
    return (
      "INV" +
      Date.now().toString().slice(-8)
    );
  }

  update(
    id: number,
    item: CreateInventoryDTO
  ) {
    const existing =
      this.repository.findById(id);

    if (!existing) {
      throw new Error(
        "Inventory item not found."
      );
    }

    return this.repository.update(
      id,
      item
    );
  }

  getAll() {
    return this.repository.getAll();
  }

  getById(id: number) {
    const item =
      this.repository.findById(id);

    if (!item) {
      throw new Error(
        "Inventory item not found."
      );
    }

    return item;
  }

  search(keyword: string) {
    return this.repository.search(keyword);
  }

  updateStock(
    id: number,
    stock: number,
    reason = "Manual Adjustment",
    remarks: string | null = null
  ) {
    const existing =
      this.repository.findById(id);

    if (!existing) {
      throw new Error(
        "Inventory item not found."
      );
    }

    if (stock < 0) {
      throw new Error(
        "Stock cannot be negative."
      );
    }

    return this.repository.updateStock(
      id,
      stock,
      reason,
      remarks
    );
  }

  getStockHistory() {
    return this.repository.getStockHistory();
  }

  delete(id: number) {
    return this.repository.delete(id);
  }
}