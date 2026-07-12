import { getDatabase } from "../database/db";
import type {
  InvoiceRegisterRow,
  PaymentHistoryRow,
  RetailDashboardSummary,
} from "../types/report";
import type { CustomerDueDetail, CustomerDueRow, DueFilter } from "../types/due";

export class ReportRepository {
  private db = getDatabase();

  getDashboardSummary(): RetailDashboardSummary {
    const summary = this.db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN date(orderDate) = date('now', 'localtime') THEN totalAmount ELSE 0 END), 0) AS todaySales,
        COUNT(CASE WHEN date(orderDate) = date('now', 'localtime') THEN 1 END) AS billsCreated,
        COALESCE(SUM(balanceAmount), 0) AS outstandingPayments
      FROM orders
      WHERE orderStatus <> 'Cancelled'
    `).get() as Omit<RetailDashboardSummary, "inventoryWorth">;
    const inventory = this.db.prepare(
      "SELECT COALESCE(SUM(currentStock * costPrice), 0) AS inventoryWorth FROM inventory",
    ).get() as Pick<RetailDashboardSummary, "inventoryWorth">;

    return { ...summary, ...inventory };
  }

  getPaymentCollectionSummary(): import("../types/report").PaymentCollectionSummary {
    const totals = this.db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN date(paymentDate) = date('now', 'localtime') THEN amount ELSE 0 END), 0) AS todayCollections,
        (SELECT COALESCE(SUM(balanceAmount), 0) FROM orders WHERE orderStatus <> 'Cancelled') AS outstanding
      FROM payments
    `).get() as { todayCollections: number; outstanding: number };
    const byMethod = this.db.prepare(`
      SELECT paymentMethod, COALESCE(SUM(amount), 0) AS amount
      FROM payments WHERE date(paymentDate) = date('now', 'localtime')
      GROUP BY paymentMethod ORDER BY amount DESC, paymentMethod
    `).all() as Array<{ paymentMethod: string; amount: number }>;
    return { ...totals, byMethod };
  }

  getInvoices(search = "", limit = 100): InvoiceRegisterRow[] {
    const keyword = `%${search.trim()}%`;
    return this.db.prepare(`
      SELECT o.id, o.orderNumber, o.orderDate, o.customerId, c.name AS customerName,
        c.mobile AS customerMobile, o.totalAmount, o.paidAmount, o.balanceAmount, o.paymentStatus,
        (SELECT ls.brand || ' ' || ls.series FROM order_items oi JOIN lens_series ls ON ls.id = oi.lensSeriesId WHERE oi.orderId = o.id LIMIT 1) AS lensSeries
      FROM orders o
      JOIN customers c ON c.id = o.customerId
      WHERE o.orderStatus <> 'Cancelled'
        AND (o.orderNumber LIKE ? OR c.name LIKE ? OR c.mobile LIKE ?)
      ORDER BY o.orderDate DESC, o.id DESC
      LIMIT ?
    `).all(keyword, keyword, keyword, limit) as InvoiceRegisterRow[];
  }

  getRecentPayments(limit = 20): PaymentHistoryRow[] {
    return this.db.prepare(`
      SELECT p.id, p.paymentNumber, p.orderId, o.orderNumber, p.customerId,
        c.name AS customerName, p.paymentDate, p.paymentMethod, p.amount, p.referenceNumber, p.recordedBy
      FROM payments p
      JOIN orders o ON o.id = p.orderId
      JOIN customers c ON c.id = p.customerId
      ORDER BY p.paymentDate DESC, p.id DESC
      LIMIT ?
    `).all(limit) as PaymentHistoryRow[];
  }

  getCustomerInvoices(customerId: number): InvoiceRegisterRow[] {
    return this.db.prepare(`
      SELECT o.id, o.orderNumber, o.orderDate, o.customerId, c.name AS customerName,
        c.mobile AS customerMobile, o.totalAmount, o.paidAmount, o.balanceAmount, o.paymentStatus,
        (SELECT ls.brand || ' ' || ls.series FROM order_items oi JOIN lens_series ls ON ls.id = oi.lensSeriesId WHERE oi.orderId = o.id LIMIT 1) AS lensSeries
      FROM orders o
      JOIN customers c ON c.id = o.customerId
      WHERE o.customerId = ?
      ORDER BY o.orderDate DESC, o.id DESC
    `).all(customerId) as InvoiceRegisterRow[];
  }

  getCustomerPayments(customerId: number): PaymentHistoryRow[] {
    return this.db.prepare(`
      SELECT p.id, p.paymentNumber, p.orderId, o.orderNumber, p.customerId,
        c.name AS customerName, p.paymentDate, p.paymentMethod, p.amount
      FROM payments p
      JOIN orders o ON o.id = p.orderId
      JOIN customers c ON c.id = p.customerId
      WHERE p.customerId = ?
      ORDER BY p.paymentDate DESC, p.id DESC
    `).all(customerId) as PaymentHistoryRow[];
  }

  getCustomerDues(search = "", filter: DueFilter = "all"): CustomerDueRow[] {
    const keyword = `%${search.trim()}%`;
    const clauses: Record<DueFilter, string> = {
      all: "1 = 1",
      overdue: "EXISTS (SELECT 1 FROM orders f WHERE f.customerId = c.id AND f.orderStatus <> 'Cancelled' AND f.balanceAmount > 0 AND date(f.orderDate) < date('now', 'localtime'))",
      "due-today": "EXISTS (SELECT 1 FROM orders f WHERE f.customerId = c.id AND f.orderStatus <> 'Cancelled' AND f.balanceAmount > 0 AND date(f.orderDate) = date('now', 'localtime'))",
      partial: "EXISTS (SELECT 1 FROM orders f WHERE f.customerId = c.id AND f.orderStatus <> 'Cancelled' AND f.balanceAmount > 0 AND f.paidAmount > 0)",
      // The page only lists customers with an outstanding balance.
      paid: "0 = 1",
    };
    return this.db.prepare(`
      SELECT c.id AS customerId, c.customerCode, c.name AS customerName, c.mobile AS customerMobile,
        SUM(o.balanceAmount) AS outstanding, COUNT(*) AS unpaidInvoices, MAX(o.orderDate) AS lastVisit,
        MAX((SELECT p.paymentDate FROM payments p WHERE p.customerId = c.id ORDER BY p.paymentDate DESC, p.id DESC LIMIT 1)) AS lastPayment,
        MAX(o.updatedAt) AS lastActivity
      FROM customers c JOIN orders o ON o.customerId = c.id AND o.orderStatus <> 'Cancelled' AND o.balanceAmount > 0
      WHERE (c.name LIKE ? OR c.mobile LIKE ? OR c.customerCode LIKE ? OR EXISTS (SELECT 1 FROM orders s WHERE s.customerId = c.id AND s.orderNumber LIKE ?))
        AND ${clauses[filter]}
      GROUP BY c.id HAVING SUM(o.balanceAmount) > 0
      ORDER BY lastActivity DESC, c.id DESC
    `).all(keyword, keyword, keyword, keyword) as CustomerDueRow[];
  }

  getCustomerDueDetail(customerId: number): CustomerDueDetail | null {
    const customer = this.db.prepare(`
      SELECT c.id AS customerId, c.customerCode, c.name AS customerName, c.mobile AS customerMobile,
        SUM(o.balanceAmount) AS outstanding, COUNT(*) AS unpaidInvoices, MAX(o.orderDate) AS lastVisit,
        MAX((SELECT p.paymentDate FROM payments p WHERE p.customerId = c.id ORDER BY p.paymentDate DESC, p.id DESC LIMIT 1)) AS lastPayment,
        MAX(o.updatedAt) AS lastActivity
      FROM customers c JOIN orders o ON o.customerId = c.id AND o.orderStatus <> 'Cancelled' AND o.balanceAmount > 0
      WHERE c.id = ? GROUP BY c.id HAVING SUM(o.balanceAmount) > 0
    `).get(customerId) as CustomerDueRow | undefined;
    if (!customer) return null;
    const invoices = this.db.prepare(`
      SELECT o.id, o.orderNumber, o.orderDate, o.customerId, c.name AS customerName, c.mobile AS customerMobile,
        o.totalAmount, o.paidAmount, o.balanceAmount, o.paymentStatus,
        (SELECT ls.brand || ' ' || ls.series FROM order_items oi JOIN lens_series ls ON ls.id = oi.lensSeriesId WHERE oi.orderId = o.id LIMIT 1) AS lensSeries
      FROM orders o JOIN customers c ON c.id = o.customerId
      WHERE o.customerId = ? AND o.orderStatus <> 'Cancelled' AND o.balanceAmount > 0
      ORDER BY o.orderDate DESC, o.id DESC
    `).all(customerId) as InvoiceRegisterRow[];
    return { customer, invoices, payments: this.getCustomerPayments(customerId) };
  }
}
