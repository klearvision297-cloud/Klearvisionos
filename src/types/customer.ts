export interface Customer {
  id: number;

  customerCode: string;

  name: string;

  mobile: string;

  whatsapp?: string;

  address?: string;

  gender?: "Male" | "Female" | "Other";

  dob?: string;

  createdAt: string;
}
