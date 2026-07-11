import type { InvoiceRegisterRow, PaymentHistoryRow } from "./report";

export type DueFilter = "all" | "overdue" | "due-today" | "partial" | "paid";

export interface CustomerDueRow {
  customerId: number;
  customerCode: string;
  customerName: string;
  customerMobile: string;
  outstanding: number;
  unpaidInvoices: number;
  lastVisit: string | null;
  lastPayment: string | null;
  lastActivity: string;
}

export interface CustomerDueDetail {
  customer: CustomerDueRow;
  invoices: InvoiceRegisterRow[];
  payments: PaymentHistoryRow[];
}
