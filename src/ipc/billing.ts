import { ipcMain } from "electron";
import { OrderService } from "../services/OrderService";

const service = new OrderService();

export function registerBillingIpc() {
  ipcMain.handle(
    "billing:create",
    async (_, order) => {
      try {
        return service.create(order);
      } catch (error) {
        console.error(error);

        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Unknown error",
        };
      }
    }
  );
}