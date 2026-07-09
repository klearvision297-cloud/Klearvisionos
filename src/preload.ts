import { contextBridge, ipcRenderer } from "electron";
import type { CreateCustomerDTO } from "./types/customer";

contextBridge.exposeInMainWorld("customer", {
  create: (customer: CreateCustomerDTO) =>
    ipcRenderer.invoke(
      "customer:create",
      customer
    ),

  getAll: () =>
    ipcRenderer.invoke("customer:getAll"),

  getById: (id: number) =>
    ipcRenderer.invoke(
      "customer:getById",
      id
    ),

  update: (
    id: number,
    customer: CreateCustomerDTO
  ) =>
    ipcRenderer.invoke(
      "customer:update",
      id,
      customer
    ),

  search: (keyword: string) =>
    ipcRenderer.invoke(
      "customer:search",
      keyword
    ),

  delete: (id: number) =>
    ipcRenderer.invoke(
      "customer:delete",
      id
    ),
});