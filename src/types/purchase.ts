export type PaymentMethod = "Cash" | "Bank Transfer" | "UPI" | "Credit";

export interface CreatePurchaseItemDTO {
  inventoryId: number;
  quantity: number;
  purchasePrice: number;
  gstRate: number;
  discount: number;
  total: number;
  remarks?: string;
}

export interface CreatePurchaseDTO {
  supplierId: number;
  invoiceNumber?: string;
  invoiceDate: string;
  purchaseDate: string;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount: number;
  gstAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  remarks?: string;
  items: CreatePurchaseItemDTO[];
}

export interface PurchaseItem extends CreatePurchaseItemDTO {
  id: number;
  purchaseId: number;
  itemCode: string;
  productName: string;
  createdAt: string;
}

export interface Purchase extends Omit<CreatePurchaseDTO, "items" | "supplierId"> {
  id: number;
  purchaseNumber: string;
  supplierId: number;
  supplierName: string;
  status: "POSTED";
  createdAt: string;
  updatedAt: string;
  items?: PurchaseItem[];
}
