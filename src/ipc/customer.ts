import { ipcMain } from "electron";
import { CustomerService } from "../services/CustomerService";
import { CreateCustomerDTO } from "../types/customer";

const customerService = new CustomerService();

export function registerCustomerIpc() {
  ipcMain.handle(
    "customer:create",
    (_, customer: CreateCustomerDTO) => {
      return customerService.create(customer);
    }
  );

  ipcMain.handle("customer:getAll", () => {
    return customerService.getAll();
  });

  ipcMain.handle(
    "customer:getById",
    (_, id: number) => {
      return customerService.getById(id);
    }
  );

  ipcMain.handle(
    "customer:update",
    (
      _,
      id: number,
      customer: CreateCustomerDTO
    ) => {
      return customerService.update(
        id,
        customer
      );
    }
  );

  ipcMain.handle(
    "customer:search",
    (_, keyword: string) => {
      return customerService.search(keyword);
    }
  );

  ipcMain.handle(
    "customer:delete",
    (_, id: number) => {
      return customerService.delete(id);
    }
  );
}