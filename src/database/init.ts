import { getDatabase } from "./db";
import { runMigrations } from "./migrate";
import { registerCustomerIpc } from "../ipc/customer";

export function initializeDatabase() {
  getDatabase();

  runMigrations();

  registerCustomerIpc();

  console.log("");
  console.log("🚀 Klear Vision Database Ready");
  console.log("");
}
