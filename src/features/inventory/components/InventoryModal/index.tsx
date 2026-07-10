import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import InventoryBasicInfo from "./InventoryBasicInfo";
import InventoryPricing from "./InventoryPricing";
import InventoryStock from "./InventoryStock";
import InventorySupplier from "./InventorySupplier";
import InventoryRemarks from "./InventoryRemarks";
import { Button, Modal } from "../../../../components/ui";

import type {
  CreateInventoryDTO,
  Inventory,
} from "../../../../types/inventory";

type Tab =
  | "basic"
  | "pricing"
  | "stock"
  | "supplier"
  | "remarks";

type InventoryModalProps = {
  open: boolean;
  mode: "create" | "edit";
  item?: Inventory | null;
  onClose: () => void;
  onSave: (
    item: CreateInventoryDTO
  ) => Promise<void>;
};

const defaultForm: CreateInventoryDTO = {
  itemType: "Frame",

  brand: "",

  category: "",

  model: "",

  color: "",

  size: "",

  description: "",

  barcode: "",

  costPrice: 0,

  mrp: 0,

  sellingPrice: 0,

  gstRate: 18,

  openingStock: 0,

  minimumStock: 0,

  unit: "PCS",

  supplierId: undefined,

  hsnCode: "",

  isActive: true,

  remarks: "",
};

export default function InventoryModal({
  open,
  mode,
  item,
  onClose,
  onSave,
}: InventoryModalProps) {
  const [activeTab, setActiveTab] =
    useState<Tab>("basic");

  const [form, setForm] =
    useState<CreateInventoryDTO>(
      defaultForm
    );

  useEffect(() => {
    if (!open) return;

    setActiveTab("basic");

    if (mode === "edit" && item) {
      setForm({
        itemType: item.itemType,

        brand: item.brand ?? "",

        category: item.category ?? "",

        model: item.model ?? "",

        color: item.color ?? "",

        size: item.size ?? "",

        description:
          item.description ?? "",

        barcode: item.barcode ?? "",

        costPrice: item.costPrice,

        mrp: item.mrp,

        sellingPrice:
          item.sellingPrice,

        gstRate: item.gstRate,

        openingStock:
          item.openingStock,

        minimumStock:
          item.minimumStock,

        unit: item.unit,

        supplierId:
          item.supplierId ??
          undefined,

        hsnCode:
          item.hsnCode ?? "",

        isActive:
          item.isActive === 1,

        remarks:
          item.remarks ?? "",
      });
    } else {
      setForm(defaultForm);
    }
  }, [open, mode, item]);

  if (!open) return null;

  async function handleSave() {
    if (!form.model?.trim()) {
      toast.error(
        "Model is required."
      );
      return;
    }

    try {
      await onSave(form);

      toast.success(
        mode === "create"
          ? "Inventory created."
          : "Inventory updated."
      );

      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(
          "Unable to save inventory."
        );
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "New Inventory Item" : "Edit Inventory"}
      description="Manage product details, pricing, stock, and supplier information."
      width={850}
      closeOnBackdrop={false}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={handleSave}>{mode === "create" ? "Create Item" : "Save Changes"}</Button></>}
    >
      <div className="inventory-modal">
        <div className="inventory-modal__tabs">
          {[
            "basic",
            "pricing",
            "stock",
            "supplier",
            "remarks",
          ].map((tab) => (
            <Button
              key={tab}
              size="sm"
              variant={activeTab === tab ? "primary" : "ghost"}
              className="inventory-modal__tab"
              onClick={() =>
                setActiveTab(
                  tab as Tab
                )
              }
            >
              {tab}
            </Button>
          ))}
        </div>

        {activeTab === "basic" && (
          <InventoryBasicInfo
            form={form}
            setForm={setForm}
          />
        )}

        {activeTab === "pricing" && (
          <InventoryPricing
            form={form}
            setForm={setForm}
          />
        )}

        {activeTab === "stock" && (
          <InventoryStock
            form={form}
            setForm={setForm}
          />
        )}

        {activeTab === "supplier" && (
          <InventorySupplier
            form={form}
            setForm={setForm}
          />
        )}

        {activeTab === "remarks" && (
          <InventoryRemarks
            form={form}
            setForm={setForm}
          />
        )}

      </div>
    </Modal>
  );
}
