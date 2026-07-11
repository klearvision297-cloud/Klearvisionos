import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { CreateSupplierDTO, Supplier } from "../types/supplier";

export function useSuppliers(search: string) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSuppliers = useCallback(async (keyword = search) => {
    try {
      setIsLoading(true);
      const data = keyword.trim() ? await window.supplier.search(keyword) : await window.supplier.getAll();
      setSuppliers(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load suppliers.");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => { void loadSuppliers(); }, [loadSuppliers]);

  const saveSupplier = async (supplier: CreateSupplierDTO, existingSupplier?: Supplier | null) => {
    if (existingSupplier) await window.supplier.update(existingSupplier.id, supplier);
    else await window.supplier.create(supplier);
    await loadSuppliers();
  };

  const removeSupplier = async (supplier: Supplier) => {
    await window.supplier.delete(supplier.id);
    await loadSuppliers();
  };

  return { suppliers, isLoading, loadSuppliers, saveSupplier, removeSupplier };
}
