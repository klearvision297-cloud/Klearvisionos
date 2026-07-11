import { getDatabase } from "./db";
import { runMigrations } from "./migrate";

import { registerCustomerIpc } from "../ipc/customer";
import { registerInventoryIpc } from "../ipc/inventory";
import { registerBillingIpc } from "../ipc/billing";
import { registerSupplierIpc } from "../ipc/supplier";
import { registerPurchaseIpc } from "../ipc/purchase";
import { registerOpticalIpc } from "../ipc/optical";
import { registerPrescriptionIpc } from "../ipc/prescription";
import { registerReportIpc } from "../ipc/report";
import { registerInvoiceIpc } from "../ipc/invoice";

export function initializeDatabase() {
  getDatabase();

  runMigrations();

  registerCustomerIpc();
  registerInventoryIpc();
  registerBillingIpc();
  registerSupplierIpc();
  registerPurchaseIpc();
  registerOpticalIpc();
  registerPrescriptionIpc();
  registerReportIpc();
  registerInvoiceIpc();

  console.log("");
  console.log("🚀 Klear Vision Database Ready");
  console.log("");
}
