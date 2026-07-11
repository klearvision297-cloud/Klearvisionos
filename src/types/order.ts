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
  transactionKey?: string;
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

  workflowType?: "RETAIL" | "PRESCRIPTION" | "REPAIR";

  opticalJob?: {
    prescriptionVersionId?: number;
    frameInventoryId?: number;
    lensSeriesId?: number;
    availabilityOverrideDecision?: "READY_STOCK" | "RX" | "REVIEW_REQUIRED";
    availabilityOverrideReason?: string;
  };

  prescription?: {
    source: "IN_HOUSE" | "EXTERNAL_DOCTOR" | "UPLOADED";
    doctorName?: string;
    rightSphere?: string;
    rightCylinder?: string;
    rightAxis?: string;
    rightAdd?: string;
    rightPD?: string;
    rightHeight?: string;
    rightPrism?: string;
    leftSphere?: string;
    leftCylinder?: string;
    leftAxis?: string;
    leftAdd?: string;
    leftPD?: string;
    leftHeight?: string;
    leftPrism?: string;
    distanceNotes?: string;
    nearNotes?: string;
    doctorNotes?: string;
  };

  items: CreateOrderItemDTO[];
}
