import { contextBridge, ipcRenderer } from "electron";

import type {
  CreateCustomerDTO,
} from "./types/customer";

import type {
  CreateInventoryDTO,
} from "./types/inventory";

import type {
  CreateOrderDTO,
} from "./types/order";

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

contextBridge.exposeInMainWorld("inventory", {
  create: (item: CreateInventoryDTO) =>
    ipcRenderer.invoke(
      "inventory:create",
      item
    ),

  getAll: () =>
    ipcRenderer.invoke(
      "inventory:getAll"
    ),

  getById: (id: number) =>
    ipcRenderer.invoke(
      "inventory:getById",
      id
    ),

  update: (
    id: number,
    item: CreateInventoryDTO
  ) =>
    ipcRenderer.invoke(
      "inventory:update",
      id,
      item
    ),

  search: (keyword: string) =>
    ipcRenderer.invoke(
      "inventory:search",
      keyword
    ),

  delete: (id: number) =>
    ipcRenderer.invoke(
      "inventory:delete",
      id
    ),

  adjustStock: (
    id: number,
    stock: number,
    reason: string,
    remarks: string
  ) =>
    ipcRenderer.invoke(
      "inventory:adjustStock",
      id,
      stock,
      reason,
      remarks
    ),

  getStockHistory: () =>
    ipcRenderer.invoke(
      "inventory:getStockHistory"
    ),
});

contextBridge.exposeInMainWorld("billing", {
  create: (order: CreateOrderDTO) =>
    ipcRenderer.invoke(
      "billing:create",
      order
    ),
});