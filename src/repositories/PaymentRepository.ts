import { getDatabase } from "../database/db";

export class PaymentRepository {
  private db = getDatabase();

  createInTransaction(orderId: number, customerId: number, amount: number, paymentMethod: string, transactionKey: string) {
    if (amount <= 0) return;
    const now = new Date().toISOString();
    const number = `PAY-${Date.now()}-${orderId}`;
    this.db.prepare("INSERT INTO payments (paymentNumber, orderId, customerId, paymentDate, paymentMethod, amount, transactionId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(number, orderId, customerId, now, paymentMethod, amount, transactionKey, now, now);
  }
}
