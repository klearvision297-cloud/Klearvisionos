import { getDatabase } from "../database/db";
import { CreateCustomerDTO, Customer } from "../types/customer";

export class CustomerRepository {
  private db = getDatabase();

  /**
   * Customer order figures are intentionally derived from orders at read time.
   * The legacy customers.totalOrders and customers.totalSpent columns are not
   * authoritative and must not be used for customer-facing reads.
   */
  private readonly enrichedCustomerQuery = `
    SELECT
      c.id,
      c.customerCode,
      c.name,
      c.mobile,
      c.whatsapp,
      c.email,
      c.gender,
      c.dateOfBirth,
      c.address,
      c.city,
      c.state,
      c.pincode,
      c.reference,
      c.eyeTestDone,
      c.remarks,
      COUNT(o.id) AS totalOrders,
      COALESCE(SUM(o.totalAmount), 0) AS totalSpent,
      COALESCE(SUM(o.balanceAmount), 0) AS outstanding,
      MAX(o.orderDate) AS lastVisit,
      c.createdAt,
      c.updatedAt
    FROM customers c
    LEFT JOIN orders o ON o.customerId = c.id AND o.orderStatus <> 'Cancelled'
  `;

  private findEnrichedCustomers(
    whereClause = "",
    parameters: unknown[] = [],
    orderBy = "c.id DESC"
  ): Customer[] {
    return this.db
      .prepare(`
        ${this.enrichedCustomerQuery}
        ${whereClause}
        GROUP BY c.id
        ORDER BY ${orderBy}
      `)
      .all(...parameters) as Customer[];
  }

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

  update(
    id: number,
    customer: CreateCustomerDTO
  ) {
    const now = new Date().toISOString();

    const statement = this.db.prepare(`
      UPDATE customers
      SET
        name=@name,
        mobile=@mobile,
        whatsapp=@whatsapp,
        email=@email,
        gender=@gender,
        dateOfBirth=@dateOfBirth,
        address=@address,
        city=@city,
        state=@state,
        pincode=@pincode,
        reference=@reference,
        eyeTestDone=@eyeTestDone,
        remarks=@remarks,
        updatedAt=@updatedAt
      WHERE id=@id
    `);

    return statement.run({
      id,

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

      updatedAt: now,
    });
  }

  findByMobile(mobile: string) {
    return this.db
      .prepare("SELECT * FROM customers WHERE mobile = ?")
      .get(mobile);
  }

  findById(id: number): Customer | undefined {
    return this.findEnrichedCustomers(
      "WHERE c.id = ?",
      [id]
    )[0];
  }

  getAll(): Customer[] {
    return this.findEnrichedCustomers();
  }

  search(keyword: string): Customer[] {
    const searchTerm = `%${keyword}%`;

    return this.findEnrichedCustomers(
      `
        WHERE
          c.name LIKE ?
          OR c.mobile LIKE ?
          OR c.customerCode LIKE ?
      `,
      [searchTerm, searchTerm, searchTerm]
    );
  }

  delete(id: number) {
    return this.db
      .prepare("DELETE FROM customers WHERE id = ?")
      .run(id);
  }
}
