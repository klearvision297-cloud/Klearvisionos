export type InvoiceWorkflow = "RETAIL" | "PRESCRIPTION" | "REPAIR";

export interface InvoiceListRow {
  id: number; orderNumber: string; orderDate: string; customerId: number; customerCode: string;
  customerName: string; customerMobile: string; workflow: InvoiceWorkflow; orderStatus: string;
  totalAmount: number; paidAmount: number; balanceAmount: number; paymentStatus: string; staff: string | null;
}
export interface InvoiceDetail extends InvoiceListRow {
  invoiceType: string; gstMode: string; subtotal: number; discount: number; gstAmount: number;
  roundOff: number; remarks: string | null; prescription: Record<string, unknown> | null;
  items: Array<{ id: number; inventoryId: number | null; lensSeriesId: number | null; itemCode: string; itemType: string; brand: string | null; category: string | null; model: string | null; color: string | null; size: string | null; quantity: number; sellingPrice: number; discount: number; total: number; remarks: string | null }>;
  payments: Array<{ id: number; paymentNumber: string; paymentDate: string; paymentMethod: string; amount: number; remarks: string | null; referenceNumber?: string | null; recordedBy?: string | null }>;
  timeline: Array<{ id: number; eventType: string; notes: string | null; createdAt: string }>;
}
