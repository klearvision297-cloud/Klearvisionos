import { ipcMain } from "electron";
import { SupplierService } from "../services/SupplierService";
import type { CreateSupplierDTO } from "../types/supplier";

const supplierService = new SupplierService();

export function registerSupplierIpc() {
  ipcMain.handle("supplier:create", (_, supplier: CreateSupplierDTO) => supplierService.create(supplier));
  ipcMain.handle("supplier:getAll", () => supplierService.getAll());
  ipcMain.handle("supplier:getById", (_, id: number) => supplierService.getById(id));
  ipcMain.handle("supplier:update", (_, id: number, supplier: CreateSupplierDTO) => supplierService.update(id, supplier));
  ipcMain.handle("supplier:search", (_, keyword: string) => supplierService.search(keyword));
  ipcMain.handle("supplier:delete", (_, id: number) => supplierService.delete(id));
}
