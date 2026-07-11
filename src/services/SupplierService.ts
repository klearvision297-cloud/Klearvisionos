import { SupplierRepository } from "../repositories/SupplierRepository";
import type { CreateSupplierDTO } from "../types/supplier";

export class SupplierService {
  private repository = new SupplierRepository();

  create(supplier: CreateSupplierDTO) {
    this.validate(supplier);
    return this.repository.create(this.generateSupplierCode(), supplier);
  }

  update(id: number, supplier: CreateSupplierDTO) {
    this.validate(supplier);
    if (!this.repository.findById(id)) {
      throw new Error("Supplier not found.");
    }
    return this.repository.update(id, supplier);
  }

  delete(id: number) {
    if (!this.repository.findById(id)) {
      throw new Error("Supplier not found.");
    }
    return this.repository.delete(id);
  }

  getById(id: number) {
    const supplier = this.repository.findById(id);
    if (!supplier) throw new Error("Supplier not found.");
    return supplier;
  }

  getAll() { return this.repository.findAll(); }

  search(keyword: string) { return this.repository.search(keyword); }

  private generateSupplierCode() {
    return `SUP${Date.now().toString().slice(-8)}`;
  }

  private validate(supplier: CreateSupplierDTO) {
    if (!supplier.supplierName.trim()) throw new Error("Supplier name is required.");
    if (!supplier.phone.trim()) throw new Error("Phone is required.");
    if (supplier.openingBalance !== undefined && supplier.openingBalance < 0) {
      throw new Error("Opening balance cannot be negative.");
    }
    if (supplier.turnaroundDays !== undefined && (!Number.isInteger(supplier.turnaroundDays) || supplier.turnaroundDays < 0)) {
      throw new Error("Turnaround must be a whole number of days.");
    }
  }
}
