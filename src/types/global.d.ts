import type {
  Customer,
  CreateCustomerDTO,
} from "./customer";

import type {
  Inventory,
  CreateInventoryDTO,
  StockHistoryItem,
} from "./inventory";

import type {
  CreateOrderDTO,
} from "./order";

export {};

declare global {
  interface Window {
    customer: {
      create(
        customer: CreateCustomerDTO
      ): Promise<unknown>;

      getAll(): Promise<Customer[]>;

      getById(
        id: number
      ): Promise<Customer>;

      update(
        id: number,
        customer: CreateCustomerDTO
      ): Promise<unknown>;

      search(
        keyword: string
      ): Promise<Customer[]>;

      delete(
        id: number
      ): Promise<unknown>;
    };

    inventory: {
      create(
        item: CreateInventoryDTO
      ): Promise<unknown>;

      getAll(): Promise<Inventory[]>;

      getById(
        id: number
      ): Promise<Inventory>;

      update(
        id: number,
        item: CreateInventoryDTO
      ): Promise<unknown>;

      search(
        keyword: string
      ): Promise<Inventory[]>;

      delete(
        id: number
      ): Promise<unknown>;

      adjustStock(
        id: number,
        stock: number,
        reason: string,
        remarks: string
      ): Promise<unknown>;

      getStockHistory(): Promise<
        StockHistoryItem[]
      >;
    };

    billing: {
      create(
        order: CreateOrderDTO
      ): Promise<{
        id: number;
        orderNumber: string;
      }>;
    };
  }
}
