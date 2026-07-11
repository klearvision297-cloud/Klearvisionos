import { getDatabase } from "../database/db";
import type { CreateSupplierDTO, Supplier } from "../types/supplier";

export class SupplierRepository {
  private db = getDatabase();

  create(supplierCode: string, supplier: CreateSupplierDTO) {
    const now = new Date().toISOString();

    return this.db.prepare(`
      INSERT INTO suppliers (
        supplierCode, supplierName, companyName, gstin, phone, email,
        contactPerson, address, city, state, pincode, openingBalance,
        outstandingBalance, turnaroundDays, paymentTerms, remarks, isActive, createdAt, updatedAt
      ) VALUES (
        @supplierCode, @supplierName, @companyName, @gstin, @phone, @email,
        @contactPerson, @address, @city, @state, @pincode, @openingBalance,
        @outstandingBalance, @turnaroundDays, @paymentTerms, @remarks, @isActive, @createdAt, @updatedAt
      )
    `).run(this.toRow(supplierCode, supplier, now));
  }

  update(id: number, supplier: CreateSupplierDTO) {
    const now = new Date().toISOString();

    return this.db.prepare(`
      UPDATE suppliers SET
        supplierName = @supplierName, companyName = @companyName, gstin = @gstin,
        phone = @phone, email = @email, contactPerson = @contactPerson,
        address = @address, city = @city, state = @state, pincode = @pincode,
        openingBalance = @openingBalance, turnaroundDays = @turnaroundDays, paymentTerms = @paymentTerms,
        remarks = @remarks, isActive = @isActive, updatedAt = @updatedAt
      WHERE id = @id
    `).run({ id, ...this.toRow(undefined, supplier, now) });
  }

  delete(id: number) {
    return this.db.prepare("DELETE FROM suppliers WHERE id = ?").run(id);
  }

  findById(id: number): Supplier | undefined {
    return this.db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id) as Supplier | undefined;
  }

  findAll(): Supplier[] {
    return this.db.prepare("SELECT * FROM suppliers ORDER BY supplierName COLLATE NOCASE").all() as Supplier[];
  }

  search(keyword: string): Supplier[] {
    const value = `%${keyword.trim()}%`;
    return this.db.prepare(`
      SELECT * FROM suppliers
      WHERE supplierName LIKE ? OR companyName LIKE ? OR phone LIKE ? OR gstin LIKE ?
      ORDER BY supplierName COLLATE NOCASE
    `).all(value, value, value, value) as Supplier[];
  }

  private toRow(supplierCode: string | undefined, supplier: CreateSupplierDTO, now: string) {
    return {
      supplierCode,
      supplierName: supplier.supplierName.trim(),
      companyName: supplier.companyName?.trim() || null,
      gstin: supplier.gstin?.trim() || null,
      phone: supplier.phone.trim(),
      email: supplier.email?.trim() || null,
      contactPerson: supplier.contactPerson?.trim() || null,
      address: supplier.address?.trim() || null,
      city: supplier.city?.trim() || null,
      state: supplier.state?.trim() || null,
      pincode: supplier.pincode?.trim() || null,
      openingBalance: supplier.openingBalance ?? 0,
      outstandingBalance: supplier.openingBalance ?? 0,
      turnaroundDays: supplier.turnaroundDays ?? 0,
      paymentTerms: supplier.paymentTerms?.trim() || null,
      remarks: supplier.remarks?.trim() || null,
      isActive: supplier.isActive === false ? 0 : 1,
      createdAt: now,
      updatedAt: now,
    };
  }
}
