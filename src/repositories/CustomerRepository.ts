import { getDatabase } from "../database/db";
import { CreateCustomerDTO } from "../types/customer";

export class CustomerRepository {
  private db = getDatabase();

  create(customerCode: string, customer: CreateCustomerDTO) {
    const now = new Date().toISOString();

    const statement = this.db.prepare(`
      INSERT INTO customers (
        customerCode,
        name,
        mobile,
        whatsapp,
        email,
        gender,
        dateOfBirth,
        address,
        city,
        state,
        pincode,
        reference,
        eyeTestDone,
        remarks,
        createdAt,
        updatedAt
      )
      VALUES (
        @customerCode,
        @name,
        @mobile,
        @whatsapp,
        @email,
        @gender,
        @dateOfBirth,
        @address,
        @city,
        @state,
        @pincode,
        @reference,
        @eyeTestDone,
        @remarks,
        @createdAt,
        @updatedAt
      )
    `);

    return statement.run({
      customerCode,

      name: customer.name,
      mobile: customer.mobile,

      whatsapp: customer.whatsapp ?? null,
      email: customer.email ?? null,
      gender: customer.gender ?? null,
      dateOfBirth: customer.dateOfBirth ?? null,
      address: customer.address ?? null,
      city: customer.city ?? null,
      state: customer.state ?? null,
      pincode: customer.pincode ?? null,
      reference: customer.reference ?? null,
      remarks: customer.remarks ?? null,

      eyeTestDone: customer.eyeTestDone ? 1 : 0,

      createdAt: now,
      updatedAt: now,
    });
  }

  findByMobile(mobile: string) {
    return this.db
      .prepare("SELECT * FROM customers WHERE mobile = ?")
      .get(mobile);
  }

  findById(id: number) {
    return this.db
      .prepare("SELECT * FROM customers WHERE id = ?")
      .get(id);
  }

  getAll() {
    return this.db
      .prepare("SELECT * FROM customers ORDER BY id DESC")
      .all();
  }

  search(keyword: string) {
    return this.db
      .prepare(`
        SELECT *
        FROM customers
        WHERE
          name LIKE ?
          OR mobile LIKE ?
          OR customerCode LIKE ?
        ORDER BY id DESC
      `)
      .all(
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`
      );
  }

  delete(id: number) {
    return this.db
      .prepare("DELETE FROM customers WHERE id = ?")
      .run(id);
  }
}
