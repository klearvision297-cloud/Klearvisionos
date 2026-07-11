import { ipcMain } from "electron";
import { ReportService } from "../services/ReportService";
import type { DueFilter } from "../types/due";

const service = new ReportService();

export function registerReportIpc() {
  ipcMain.handle("report:dashboard-summary", () => service.getDashboardSummary());
  ipcMain.handle("report:payment-collection-summary", () => service.getPaymentCollectionSummary());
  ipcMain.handle("report:invoices", (_, search?: string) => service.getInvoices(search));
  ipcMain.handle("report:recent-payments", () => service.getRecentPayments());
  ipcMain.handle("report:customer-invoices", (_, customerId: number) => service.getCustomerInvoices(customerId));
  ipcMain.handle("report:customer-payments", (_, customerId: number) => service.getCustomerPayments(customerId));
  ipcMain.handle("report:customer-dues", (_, search?: string, filter?: DueFilter) => service.getCustomerDues(search, filter));
  ipcMain.handle("report:customer-due-detail", (_, customerId: number) => service.getCustomerDueDetail(customerId));
}
