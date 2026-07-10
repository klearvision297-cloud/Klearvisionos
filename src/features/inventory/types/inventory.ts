export interface CreateInventoryDTO {
  itemType: string;

  brand?: string;

  category?: string;

  model?: string;

  color?: string;

  size?: string;

  description?: string;

  barcode?: string;

  costPrice: number;

  mrp: number;

  sellingPrice: number;

  gstRate: number;

  openingStock: number;

  minimumStock: number;

  unit: string;

  supplierId?: number;

  hsnCode?: string;

  isActive?: boolean;

  remarks?: string;
}

export interface Inventory {
  id: number;

  itemCode: string;

  barcode: string | null;

  itemType: string;

  brand: string | null;

  category: string | null;

  model: string | null;

  color: string | null;

  size: string | null;

  description: string | null;

  costPrice: number;

  mrp: number;

  sellingPrice: number;

  gstRate: number;

  openingStock: number;

  currentStock: number;

  minimumStock: number;

  unit: string;

  supplierId: number | null;

  hsnCode: string | null;

  isActive: number;

  remarks: string | null;

  createdAt: string;

  updatedAt: string;
}