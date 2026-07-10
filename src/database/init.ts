import { getDatabase } from "./db";
import { runMigrations } from "./migrate";

import { registerCustomerIpc } from "../ipc/customer";
import { registerInventoryIpc } from "../ipc/inventory";
import { registerBillingIpc } from "../ipc/billing";

export function initializeDatabase() {
  getDatabase();

  runMigrations();

  registerCustomerIpc();
  registerInventoryIpc();
  registerBillingIpc();

  console.log("");
  console.log("🚀 Klear Vision Database Ready");
  console.log("");
}