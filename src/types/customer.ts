export interface CreateCustomerDTO {
  name: string;
  mobile: string;
  whatsapp?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  reference?: string;
  eyeTestDone?: boolean;
  remarks?: string;
}

export interface Customer {
  id: number;

  customerCode: string;

  name: string;

  mobile: string;

  whatsapp: string | null;

  email: string | null;

  gender: string | null;

  dateOfBirth: string | null;

  address: string | null;

  city: string | null;

  state: string | null;

  pincode: string | null;

  reference: string | null;

  eyeTestDone: number;

  remarks: string | null;

  totalOrders: number;

  totalSpent: number;

  createdAt: string;

  updatedAt: string;
}