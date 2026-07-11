import { contextBridge, ipcRenderer } from "electron";

import type {
  CreateCustomerDTO,
} from "./types/customer";

import type {
  CreateInventoryDTO,
} from "./types/inventory";

import type {
  CreateOrderDTO,
} from "./types/order";

import type { CreateSupplierDTO } from "./types/supplier";
import type { CreatePurchaseDTO } from "./types/purchase";
import type { InvoiceRegisterRow, PaymentCollectionSummary, PaymentHistoryRow, RetailDashboardSummary } from "./types/report";
import type { InvoiceDetail, InvoiceListRow } from "./types/invoice";
import type { CustomerDueDetail, CustomerDueRow, DueFilter } from "./types/due";
import type {
  BulkUpdateOpticalJobsDTO,
  CreateAvailabilityProfileDTO,
  CreateLensSeriesDTO,
  CreateOpticalJobDTO,
  DispatchLabOrdersDTO,
  EvaluateAvailabilityDTO,
  LensSeriesQuery,
  OpticalLabJobQuery,
  OpticalJobQuery,
  ReceiveLabOrderDTO,
  UpdateOpticalJobDTO,
} from "./types/optical";

contextBridge.exposeInMainWorld("customer", {
  create: (customer: CreateCustomerDTO) =>
    ipcRenderer.invoke(
      "customer:create",
      customer
    ),

  getAll: () =>
    ipcRenderer.invoke("customer:getAll"),

  getById: (id: number) =>
    ipcRenderer.invoke(
      "customer:getById",
      id
    ),

  update: (
    id: number,
    customer: CreateCustomerDTO
  ) =>
    ipcRenderer.invoke(
      "customer:update",
      id,
      customer
    ),

  search: (keyword: string) =>
    ipcRenderer.invoke(
      "customer:search",
      keyword
    ),

  delete: (id: number) =>
    ipcRenderer.invoke(
      "customer:delete",
      id
    ),
});

contextBridge.exposeInMainWorld("inventory", {
  create: (item: CreateInventoryDTO) =>
    ipcRenderer.invoke(
      "inventory:create",
      item
    ),

  getAll: () =>
    ipcRenderer.invoke(
      "inventory:getAll"
    ),

  getById: (id: number) =>
    ipcRenderer.invoke(
      "inventory:getById",
      id
    ),

  update: (
    id: number,
    item: CreateInventoryDTO
  ) =>
    ipcRenderer.invoke(
      "inventory:update",
      id,
      item
    ),

  search: (keyword: string) =>
    ipcRenderer.invoke(
      "inventory:search",
      keyword
    ),

  delete: (id: number) =>
    ipcRenderer.invoke(
      "inventory:delete",
      id
    ),

  adjustStock: (
    id: number,
    stock: number,
    reason: string,
    remarks: string
  ) =>
    ipcRenderer.invoke(
      "inventory:adjustStock",
      id,
      stock,
      reason,
      remarks
    ),

  getStockHistory: () =>
    ipcRenderer.invoke(
      "inventory:getStockHistory"
    ),
});

contextBridge.exposeInMainWorld("billing", {
  create: (order: CreateOrderDTO) =>
    ipcRenderer.invoke(
      "billing:create",
      order
    ),
});

contextBridge.exposeInMainWorld("invoice", {
  list: (search?: string): Promise<InvoiceListRow[]> => ipcRenderer.invoke("invoice:list", search),
  detail: (id: number): Promise<InvoiceDetail | null> => ipcRenderer.invoke("invoice:detail", id),
  receivePayment: (id: number, amount: number, method: string, remarks?: string, reference?: string) => ipcRenderer.invoke("invoice:receive-payment", id, amount, method, remarks, reference),
  cancel: (id: number, reason: string) => ipcRenderer.invoke("invoice:cancel", id, reason),
  print: (id: number, format: "thermal" | "a4" | "a5") => ipcRenderer.invoke("invoice:print", id, format),
});

contextBridge.exposeInMainWorld("report", {
  getDashboardSummary: (): Promise<RetailDashboardSummary> => ipcRenderer.invoke("report:dashboard-summary"),
  getPaymentCollectionSummary: (): Promise<PaymentCollectionSummary> => ipcRenderer.invoke("report:payment-collection-summary"),
  getInvoices: (search?: string): Promise<InvoiceRegisterRow[]> => ipcRenderer.invoke("report:invoices", search),
  getRecentPayments: (): Promise<PaymentHistoryRow[]> => ipcRenderer.invoke("report:recent-payments"),
  getCustomerInvoices: (customerId: number): Promise<InvoiceRegisterRow[]> => ipcRenderer.invoke("report:customer-invoices", customerId),
  getCustomerPayments: (customerId: number): Promise<PaymentHistoryRow[]> => ipcRenderer.invoke("report:customer-payments", customerId),
  getCustomerDues: (search?: string, filter?: DueFilter): Promise<CustomerDueRow[]> => ipcRenderer.invoke("report:customer-dues", search, filter),
  getCustomerDueDetail: (customerId: number): Promise<CustomerDueDetail | null> => ipcRenderer.invoke("report:customer-due-detail", customerId),
});

contextBridge.exposeInMainWorld("supplier", {
  create: (supplier: CreateSupplierDTO) => ipcRenderer.invoke("supplier:create", supplier),
  getAll: () => ipcRenderer.invoke("supplier:getAll"),
  getById: (id: number) => ipcRenderer.invoke("supplier:getById", id),
  update: (id: number, supplier: CreateSupplierDTO) => ipcRenderer.invoke("supplier:update", id, supplier),
  search: (keyword: string) => ipcRenderer.invoke("supplier:search", keyword),
  delete: (id: number) => ipcRenderer.invoke("supplier:delete", id),
});

contextBridge.exposeInMainWorld("purchase", {
  create: (purchase: CreatePurchaseDTO) => ipcRenderer.invoke("purchase:create", purchase),
  getAll: (search?: string, status?: string) => ipcRenderer.invoke("purchase:getAll", search, status),
  getById: (id: number) => ipcRenderer.invoke("purchase:getById", id),
  getSummary: () => ipcRenderer.invoke("purchase:getSummary"),
});

contextBridge.exposeInMainWorld("optical", {
  getJobs: (query?: OpticalJobQuery) => ipcRenderer.invoke("optical:jobs", query),
  getJobDetail: (jobId: number) => ipcRenderer.invoke("optical:job-detail", jobId),
  updateJob: (jobId: number, data: UpdateOpticalJobDTO) => ipcRenderer.invoke("optical:job-update", jobId, data),
  bulkUpdateJobs: (data: BulkUpdateOpticalJobsDTO) => ipcRenderer.invoke("optical:jobs-bulk-update", data),
  notifyCustomer: (jobId: number, notes?: string) => ipcRenderer.invoke("optical:customer-notified", jobId, notes),
  recordWarranty: (jobId: number, warrantyUntil: string, notes?: string) => ipcRenderer.invoke("optical:warranty", jobId, warrantyUntil, notes),
  getLensSeries: (query?: LensSeriesQuery) => ipcRenderer.invoke("optical:lens-series", query),
  createLensSeries: (data: CreateLensSeriesDTO) => ipcRenderer.invoke("optical:lens-create", data),
  updateLensSeries: (id: number, data: CreateLensSeriesDTO) => ipcRenderer.invoke("optical:lens-update", id, data),
  duplicateLensSeries: (id: number) => ipcRenderer.invoke("optical:lens-duplicate", id),
  setLensSeriesActive: (id: number, isActive: boolean) => ipcRenderer.invoke("optical:lens-active", id, isActive),
  getAvailabilityProfiles: (includeInactive?: boolean) => ipcRenderer.invoke("optical:profiles", includeInactive),
  createAvailabilityProfile: (data: CreateAvailabilityProfileDTO) => ipcRenderer.invoke("optical:profile-create", data),
  updateAvailabilityProfile: (id: number, data: CreateAvailabilityProfileDTO) => ipcRenderer.invoke("optical:profile-update", id, data),
  deleteAvailabilityProfile: (id: number) => ipcRenderer.invoke("optical:profile-delete", id),
  evaluateAvailability: (data: EvaluateAvailabilityDTO) => ipcRenderer.invoke("optical:evaluate-availability", data),
  getTimeline: (jobId: number) => ipcRenderer.invoke("optical:timeline", jobId),
  createJob: (data: CreateOpticalJobDTO) => ipcRenderer.invoke("optical:create-job", data),
  getLabJobs: (query: OpticalLabJobQuery) => ipcRenderer.invoke("optical:lab-jobs", query),
  dispatchLabJobs: (data: DispatchLabOrdersDTO) => ipcRenderer.invoke("optical:lab-dispatch", data),
  receiveLabJob: (jobId: number, data: ReceiveLabOrderDTO) => ipcRenderer.invoke("optical:lab-receive", jobId, data),
  search: (query: string) => ipcRenderer.invoke("optical:search", query),
  getNotifications: () => ipcRenderer.invoke("optical:notifications"),
  markNotificationRead: (id: number) => ipcRenderer.invoke("optical:read-notification", id),
});

contextBridge.exposeInMainWorld("prescription", {
  create: (data: import("./repositories/PrescriptionRepository").PrescriptionData) => ipcRenderer.invoke("prescription:create", data),
  getByCustomer: (customerId: number) => ipcRenderer.invoke("prescription:by-customer", customerId),
});
