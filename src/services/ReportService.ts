import { ReportRepository } from "../repositories/ReportRepository";
import type { DueFilter } from "../types/due";

export class ReportService {
  private repository = new ReportRepository();

  getDashboardSummary() { return this.repository.getDashboardSummary(); }
  getPaymentCollectionSummary() { return this.repository.getPaymentCollectionSummary(); }
  getInvoices(search?: string) { return this.repository.getInvoices(search); }
  getRecentPayments() { return this.repository.getRecentPayments(); }
  getCustomerInvoices(customerId: number) { return this.repository.getCustomerInvoices(customerId); }
  getCustomerPayments(customerId: number) { return this.repository.getCustomerPayments(customerId); }
  getCustomerDues(search?: string, filter?: DueFilter) { return this.repository.getCustomerDues(search, filter); }
  getCustomerDueDetail(customerId: number) { return this.repository.getCustomerDueDetail(customerId); }
}
