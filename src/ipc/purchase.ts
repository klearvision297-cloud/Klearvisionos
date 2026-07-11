import { ipcMain } from "electron";
import { PurchaseService } from "../services/PurchaseService";
import type { CreatePurchaseDTO } from "../types/purchase";

const purchaseService = new PurchaseService();

export function registerPurchaseIpc() {
  ipcMain.handle("purchase:create", (_, purchase: CreatePurchaseDTO) => purchaseService.create(purchase));
  ipcMain.handle("purchase:getAll", (_, search?: string, status?: string) => purchaseService.getAll(search, status));
  ipcMain.handle("purchase:getById", (_, id: number) => purchaseService.getById(id));
  ipcMain.handle("purchase:getSummary", () => purchaseService.getSummary());
}
