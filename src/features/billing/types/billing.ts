import type { Inventory } from "../../../types/inventory";

export interface BillingItem {
  item: Inventory;
  quantity: number;
}
