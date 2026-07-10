export interface CreateOrderItemDTO {
  inventoryId: number;

  itemCode: string;

  itemType: string;

  brand?: string;

  category?: string;

  model?: string;

  color?: string;

  size?: string;

  barcode?: string;

  hsnCode?: string;

  gstRate: number;

  quantity: number;

  purchasePrice: number;

  sellingPrice: number;

  discount: number;

  total: number;

  remarks?: string;
}

export interface CreateOrderDTO {
  customerId: number;

  prescriptionId?: number;

  invoiceType: string;

  gstMode: string;

  orderDate: string;

  deliveryDate?: string;

  subtotal: number;

  discount: number;

  gstAmount: number;

  roundOff: number;

  totalAmount: number;

  paidAmount: number;

  balanceAmount: number;

  remarks?: string;

  items: CreateOrderItemDTO[];
}