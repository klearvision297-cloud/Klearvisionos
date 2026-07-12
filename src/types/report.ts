export interface InvoiceRegisterRow {
  id: number;
  orderNumber: string;
  orderDate: string;
  customerId: number;
  customerName: string;
  customerMobile: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  lensSeries?: string | null;
}

export interface PaymentHistoryRow {
  id: number;
  paymentNumber: string;
  orderId: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  paymentDate: string;
  paymentMethod: string;
  amount: number;
  referenceNumber?: string | null;
  recordedBy?: string | null;
}

export interface RetailDashboardSummary {
  todaySales: number;
  billsCreated: number;
  outstandingPayments: number;
  inventoryWorth: number;
}

export interface PaymentCollectionSummary {
  todayCollections: number;
  outstanding: number;
  byMethod: Array<{ paymentMethod: string; amount: number }>;
}
