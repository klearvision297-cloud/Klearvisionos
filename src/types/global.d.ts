import type {
  Customer,
  CreateCustomerDTO,
} from "./customer";

import type {
  Inventory,
  CreateInventoryDTO,
  StockHistoryItem,
} from "./inventory";

import type {
  CreateOrderDTO,
} from "./order";

import type { CreateSupplierDTO, Supplier } from "./supplier";
import type { CreatePurchaseDTO, Purchase } from "./purchase";
import type {
  AvailabilityEvaluation,
  AvailabilityProfile,
  BulkUpdateOpticalJobsDTO,
  CreateAvailabilityProfileDTO,
  CreateLensSeriesDTO,
  CompleteQualityInspectionDTO,
  CreateRepairJobDTO,
  DispatchLabOrdersDTO,
  EvaluateAvailabilityDTO,
  LensSeries,
  LensCatalogueSummary,
  LensSeriesQuery,
  NotificationItem,
  OpticalJobDetail,
  OpticalLabJob,
  OpticalLabJobQuery,
  OpticalJobQuery,
  OpticalSearchResult,
  PaginatedResult,
  ReceiveLabOrderDTO,
  UpdateOpticalJobDTO,
  UpdateRepairJobDTO,
  RepairJob,
  OpticalJobDashboard,
  LabReceivingSummary,
} from "./optical";
import type { PrescriptionData } from "../repositories/PrescriptionRepository";
import type { InvoiceRegisterRow, PaymentCollectionSummary, PaymentHistoryRow, RetailDashboardSummary } from "./report";
import type { InvoiceDetail, InvoiceListRow } from "./invoice";
import type { CustomerDueDetail, CustomerDueRow, DueFilter } from "./due";

export {};

declare global {
  interface Window {
    customer: {
      create(
        customer: CreateCustomerDTO
      ): Promise<unknown>;

      getAll(): Promise<Customer[]>;

      getById(
        id: number
      ): Promise<Customer>;

      update(
        id: number,
        customer: CreateCustomerDTO
      ): Promise<unknown>;

      search(
        keyword: string
      ): Promise<Customer[]>;

      delete(
        id: number
      ): Promise<unknown>;
    };

    inventory: {
      create(
        item: CreateInventoryDTO
      ): Promise<unknown>;

      getAll(): Promise<Inventory[]>;

      getById(
        id: number
      ): Promise<Inventory>;

      update(
        id: number,
        item: CreateInventoryDTO
      ): Promise<unknown>;

      search(
        keyword: string
      ): Promise<Inventory[]>;

      delete(
        id: number
      ): Promise<unknown>;

      adjustStock(
        id: number,
        stock: number,
        reason: string,
        remarks: string
      ): Promise<unknown>;

      getStockHistory(): Promise<
        StockHistoryItem[]
      >;
    };

    billing: {
      create(
        order: CreateOrderDTO
      ): Promise<{
        success: boolean;
        id?: number;
        orderNumber?: string;
        jobId?: number;
        jobNumber?: string;
        message?: string;
      }>;
    };

    invoice: {
      list(search?: string): Promise<InvoiceListRow[]>;
      detail(id: number): Promise<InvoiceDetail | null>;
      receivePayment(id: number, amount: number, method: string, remarks?: string, reference?: string): Promise<{ customerId: number }>;
      cancel(id: number, reason: string): Promise<{ customerId: number }>;
      print(id: number, format: "thermal" | "a4" | "a5"): Promise<{ success: boolean }>;
    };

    report: {
      getDashboardSummary(): Promise<RetailDashboardSummary>;
      getPaymentCollectionSummary(): Promise<PaymentCollectionSummary>;
      getInvoices(search?: string): Promise<InvoiceRegisterRow[]>;
      getRecentPayments(): Promise<PaymentHistoryRow[]>;
      getCustomerInvoices(customerId: number): Promise<InvoiceRegisterRow[]>;
      getCustomerPayments(customerId: number): Promise<PaymentHistoryRow[]>;
      getCustomerDues(search?: string, filter?: DueFilter): Promise<CustomerDueRow[]>;
      getCustomerDueDetail(customerId: number): Promise<CustomerDueDetail | null>;
    };

    supplier: {
      create(supplier: CreateSupplierDTO): Promise<unknown>;
      getAll(): Promise<Supplier[]>;
      getById(id: number): Promise<Supplier>;
      update(id: number, supplier: CreateSupplierDTO): Promise<unknown>;
      search(keyword: string): Promise<Supplier[]>;
      delete(id: number): Promise<unknown>;
    };

    purchase: {
      create(purchase: CreatePurchaseDTO): Promise<{ id: number; purchaseNumber: string }>;
      getAll(search?: string, status?: string): Promise<Purchase[]>;
      getById(id: number): Promise<Purchase>;
      getSummary(): Promise<{ purchaseCount: number; totalValue: number; outstanding: number; todayValue: number }>;
    };

    optical: {
      getJobs(query?: OpticalJobQuery): Promise<PaginatedResult<import("./optical").OpticalJob>>;
      getJobDetail(jobId: number): Promise<OpticalJobDetail>;
      updateJob(jobId: number, data: UpdateOpticalJobDTO): Promise<{ success: boolean }>;
      bulkUpdateJobs(data: BulkUpdateOpticalJobsDTO): Promise<{ success: boolean }>;
      notifyCustomer(jobId: number, notes?: string): Promise<{ success: boolean }>;
      recordWarranty(jobId: number, warrantyUntil: string, notes?: string): Promise<{ success: boolean }>;
      getLensSeries(query?: LensSeriesQuery): Promise<PaginatedResult<LensSeries>>;
      getLensCatalogueSummary(): Promise<LensCatalogueSummary>;
      createLensSeries(data: CreateLensSeriesDTO): Promise<LensSeries>;
      updateLensSeries(id: number, data: CreateLensSeriesDTO): Promise<LensSeries>;
      duplicateLensSeries(id: number): Promise<LensSeries>;
      setLensSeriesActive(id: number, isActive: boolean): Promise<{ success: boolean }>;
      getAvailabilityProfiles(includeInactive?: boolean): Promise<AvailabilityProfile[]>;
      createAvailabilityProfile(data: CreateAvailabilityProfileDTO): Promise<number>;
      updateAvailabilityProfile(id: number, data: CreateAvailabilityProfileDTO): Promise<{ success: boolean }>;
      deleteAvailabilityProfile(id: number): Promise<{ success: boolean }>;
      evaluateAvailability(data: EvaluateAvailabilityDTO): Promise<AvailabilityEvaluation>;
      getTimeline(jobId: number): Promise<import("./optical").JobTimelineEvent[]>;
      getDashboard(): Promise<OpticalJobDashboard>;
      getRepairJobs(search?: string): Promise<RepairJob[]>;
      getRepairJob(id: number): Promise<RepairJob & { timeline: import("./optical").JobTimelineEvent[] }>;
      createRepairJob(data: CreateRepairJobDTO): Promise<{ success: boolean; id: number; jobNumber: string }>;
      updateRepairJob(id: number, data: UpdateRepairJobDTO): Promise<{ success: boolean }>;
      getLabJobs(query: OpticalLabJobQuery): Promise<OpticalLabJob[]>;
      dispatchLabJobs(data: DispatchLabOrdersDTO): Promise<{ success: boolean }>;
      receiveLabJob(jobId: number, data: ReceiveLabOrderDTO): Promise<{ success: boolean }>;
      completeQualityInspection(jobId: number, data: CompleteQualityInspectionDTO): Promise<{ success: boolean }>;
      returnForRemake(jobId: number, performedBy?: string): Promise<{ success: boolean }>;
      getLabReceivingSummary(): Promise<LabReceivingSummary>;
      search(query: string): Promise<OpticalSearchResult[]>;
      getNotifications(): Promise<NotificationItem[]>;
      markNotificationRead(id: number): Promise<{ success: boolean }>;
    };

    prescription: { create(data: PrescriptionData): Promise<{ id: number; prescriptionNumber: string }>; getByCustomer(customerId: number): Promise<unknown[]>; };
  }
}
