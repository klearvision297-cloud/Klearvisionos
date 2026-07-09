import type { CreateCustomerDTO, Customer } from "./customer";

export {};

declare global {
  interface Window {
    customer: {
      create(customer: CreateCustomerDTO): Promise<unknown>;

      getAll(): Promise<Customer[]>;

      search(keyword: string): Promise<Customer[]>;

      delete(id: number): Promise<unknown>;
    };
  }
}