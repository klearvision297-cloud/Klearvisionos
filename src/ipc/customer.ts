import { ipcMain } from "electron";
import { CustomerService } from "../services/CustomerService";

const customerService = new CustomerService();

export function registerCustomerIpc() {
  ipcMain.handle("customer:create", (_, customer) => {
    return customerService.create(customer);
  });

  ipcMain.handle("customer:getAll", () => {
    return customerService.getAll();
  });

  ipcMain.handle("customer:search", (_, keyword: string) => {
    return customerService.search(keyword);
  });

  ipcMain.handle("customer:delete", (_, id: number) => {
    return customerService.delete(id);
  });
}
