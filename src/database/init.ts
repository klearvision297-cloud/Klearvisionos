import { getDatabase } from "./db";
import { runMigrations } from "./migrate";

export function initializeDatabase() {
  getDatabase();

  runMigrations();

  console.log("");
  console.log("🚀 Klear Vision Database Ready");
  console.log("");
}
