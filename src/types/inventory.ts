export interface Inventory {
  id: number;

  itemCode: string;

  barcode?: string;

  itemType: string;

  brand?: string;

  category?: string;

  model?: string;

  color?: string;

  size?: string;

  description?: string;

  costPrice: number;

  mrp: number;

  sellingPrice: number;

  gstRate: number;

  openingStock: number;

  currentStock: number;

  minimumStock: number;

  unit: string;

  supplierId?: number;

  hsnCode?: string;

  isActive: boolean | number;

  remarks?: string;

  createdAt: string;

  updatedAt: string;
}

export interface CreateInventoryDTO {
  itemCode?: string;

  barcode?: string;

  itemType: string;

  brand?: string;

  category?: string;

  model?: string;

  color?: string;

  size?: string;

  description?: string;

  costPrice: number;

  mrp: number;

  sellingPrice: number;

  gstRate: number;

  openingStock: number;

  minimumStock: number;

  unit: string;

  supplierId?: number;

  hsnCode?: string;

  isActive: boolean;

  remarks?: string;
}

export interface StockHistoryItem {
  id: number;

  inventoryId: number;

  itemCode: string;

  brand?: string;

  model?: string;

  changeType: string;

  previousStock: number;

  newStock: number;

  difference: number;

  reason?: string;

  remarks?: string;

  createdAt: string;
}
