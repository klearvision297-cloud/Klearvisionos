import { ipcMain } from "electron";
import { PrescriptionService } from "../services/PrescriptionService";
const service = new PrescriptionService();
export function registerPrescriptionIpc() { ipcMain.handle("prescription:create", (_, data) => service.create(data)); ipcMain.handle("prescription:by-customer", (_, customerId: number) => service.getByCustomer(customerId)); }
