export interface CreateSupplierDTO {
  supplierName: string;
  companyName?: string;
  gstin?: string;
  phone: string;
  email?: string;
  contactPerson?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  openingBalance?: number;
  turnaroundDays?: number;
  paymentTerms?: string;
  remarks?: string;
  isActive?: boolean;
}

export interface Supplier extends Omit<CreateSupplierDTO, "companyName" | "gstin" | "email" | "contactPerson" | "address" | "city" | "state" | "pincode" | "paymentTerms" | "remarks" | "isActive"> {
  id: number;
  supplierCode: string;
  companyName: string | null;
  gstin: string | null;
  email: string | null;
  contactPerson: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  openingBalance: number;
  turnaroundDays: number;
  outstandingBalance: number;
  paymentTerms: string | null;
  remarks: string | null;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}
