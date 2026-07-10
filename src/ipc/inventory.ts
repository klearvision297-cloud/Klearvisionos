import { ipcMain } from "electron";
import { InventoryService } from "../services/InventoryService";

const service = new InventoryService();

export function registerInventoryIpc() {
  ipcMain.handle(
    "inventory:create",
    (_, item) => service.create(item)
  );

  ipcMain.handle(
    "inventory:getAll",
    () => service.getAll()
  );

  ipcMain.handle(
    "inventory:getById",
    (_, id) => service.getById(id)
  );

  ipcMain.handle(
    "inventory:update",
    (_, id, item) =>
      service.update(id, item)
  );

  ipcMain.handle(
    "inventory:search",
    (_, keyword) =>
      service.search(keyword)
  );

  ipcMain.handle(
    "inventory:delete",
    (_, id) =>
      service.delete(id)
  );

  ipcMain.handle(
    "inventory:adjustStock",
    (
      _,
      id,
      stock,
      reason,
      remarks
    ) =>
      service.updateStock(
        id,
        stock,
        reason,
        remarks
      )
  );

  ipcMain.handle(
    "inventory:getStockHistory",
    () => service.getStockHistory()
  );
}