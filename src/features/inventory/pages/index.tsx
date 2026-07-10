import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import InventoryModal from "../components/InventoryModal";
import InventoryCard from "../components/InventoryCard";
import StockAdjustmentModal from "../components/StockAdjustmentModal";
import { PackageSearch } from "lucide-react";
import { Button, EmptyState, PageHeader, SearchBar } from "../../../components/ui";

import type {
  CreateInventoryDTO,
  Inventory,
} from "../../../types/inventory";

export default function InventoryPage() {
  const [items, setItems] = useState<Inventory[]>([]);

  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);

  const [mode, setMode] = useState<
    "create" | "edit"
  >("create");

  const [selectedItem, setSelectedItem] =
    useState<Inventory | null>(null);

  const [stockModalOpen, setStockModalOpen] =
    useState(false);

  const [stockItem, setStockItem] =
    useState<Inventory | null>(null);

  async function loadInventory(
    keyword = ""
  ) {
    try {
      if (keyword.trim() === "") {
        const data =
          await window.inventory.getAll();

        setItems(data);
      } else {
        const data =
          await window.inventory.search(
            keyword
          );

        setItems(data);
      }
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to load inventory."
      );
    }
  }

  useEffect(() => {
    loadInventory(search);
  }, [search]);

  async function createItem(
    item: CreateInventoryDTO
  ) {
    try {
      await window.inventory.create(item);

      toast.success(
        "Inventory item created."
      );

      await loadInventory(search);

      setOpen(false);
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(
          "Unable to create inventory item."
        );
      }
    }
  }

  async function updateItem(
    item: CreateInventoryDTO
  ) {
    if (!selectedItem) return;

    try {
      await window.inventory.update(
        selectedItem.id,
        item
      );

      toast.success(
        "Inventory updated."
      );

      await loadInventory(search);

      setOpen(false);

      setSelectedItem(null);
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(
          "Unable to update inventory."
        );
      }
    }
  }

  function adjustStock(
    item: Inventory
  ) {
    setStockItem(item);

    setStockModalOpen(true);
  }

  async function openEdit(
    id: number
  ) {
    try {
      const item =
        await window.inventory.getById(
          id
        );

      setSelectedItem(item);

      setMode("edit");

      setOpen(true);
    } catch (error) {
      console.error(error);

      toast.error(
        "Unable to load inventory item."
      );
    }
  }

  function openCreate() {
    setSelectedItem(null);

    setMode("create");

    setOpen(true);
  }

  function closeModal() {
    setOpen(false);

    setSelectedItem(null);
  }

  function closeStockModal() {
    setStockModalOpen(false);

    setStockItem(null);
  }

  return (
    <>
      <PageHeader title="Inventory" subtitle="Manage products, pricing, and stock levels." action={<Button onClick={openCreate}>+ New Item</Button>} />

      <SearchBar
        placeholder="Search by Item Code, Barcode, Brand, Model..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        onClear={() => setSearch("")}
      />

      <div className="customer-list kv-page-list">
        {items.length === 0 ? (
          <EmptyState icon={<PackageSearch size={22} />} title="No inventory found" description={search ? "Try a different product name, code, or barcode." : "Add your first item to begin tracking stock and pricing."} action={!search ? <Button onClick={openCreate}>+ New Item</Button> : undefined} />
        ) : (
          items.map((item) => (
            <InventoryCard
              key={item.id}
              item={item}
              onClick={() =>
                openEdit(item.id)
              }
              onAdjustStock={() =>
                adjustStock(item)
              }
            />
          ))
        )}
      </div>

      <InventoryModal
        open={open}
        mode={mode}
        item={selectedItem}
        onClose={closeModal}
        onSave={
          mode === "create"
            ? createItem
            : updateItem
        }
      />

      <StockAdjustmentModal
        open={stockModalOpen}
        item={stockItem}
        onClose={closeStockModal}
        onSaved={async () => {
          await loadInventory(search);
        }}
      />
    </>
  );
}
