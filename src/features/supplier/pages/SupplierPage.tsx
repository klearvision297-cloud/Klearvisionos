import { useMemo, useState } from "react";
import { Building2, CircleDollarSign, Plus, UserCheck, UserMinus } from "lucide-react";
import toast from "react-hot-toast";
import { Button, PageHeader, SearchBar, StatCard } from "../../../components/ui";
import SupplierModal from "../components/SupplierModal";
import SupplierTable from "../components/SupplierTable";
import { useSuppliers } from "../hooks/useSuppliers";
import type { CreateSupplierDTO, Supplier } from "../types/supplier";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const { suppliers, isLoading, saveSupplier, removeSupplier } = useSuppliers(search);
  const metrics = useMemo(() => ({ active: suppliers.filter((supplier) => supplier.isActive === 1).length, inactive: suppliers.filter((supplier) => supplier.isActive !== 1).length, outstanding: suppliers.reduce((total, supplier) => total + supplier.outstandingBalance, 0) }), [suppliers]);

  const openCreate = () => { setSelectedSupplier(null); setIsModalOpen(true); };
  const openEdit = (supplier: Supplier) => { setSelectedSupplier(supplier); setIsModalOpen(true); };
  const handleSave = async (supplier: CreateSupplierDTO) => { try { await saveSupplier(supplier, selectedSupplier); toast.success(selectedSupplier ? "Supplier updated." : "Supplier created."); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save supplier."); throw error; } };
  const handleDelete = async (supplier: Supplier) => { if (!window.confirm(`Delete ${supplier.supplierName}? This cannot be undone.`)) return; try { await removeSupplier(supplier); toast.success("Supplier deleted."); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete supplier."); } };

  return <section className="supplier-page"><PageHeader title="Suppliers" subtitle="Manage vendors and purchase partners." action={<Button size="sm" onClick={openCreate}><Plus size={16} /> New Supplier</Button>} /><div className="supplier-page__toolbar"><SearchBar placeholder="Search supplier, company, phone, or GSTIN" value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} /><span>{isLoading ? "Loading…" : `${suppliers.length} suppliers`}</span></div><div className="supplier-page__stats"><StatCard label="Total Suppliers" value={suppliers.length} icon={<Building2 size={18} />} /><StatCard label="Active Suppliers" value={metrics.active} icon={<UserCheck size={18} />} /><StatCard label="Outstanding Payables" value={currency.format(metrics.outstanding)} icon={<CircleDollarSign size={18} />} /><StatCard label="Inactive Suppliers" value={metrics.inactive} icon={<UserMinus size={18} />} /></div><SupplierTable suppliers={suppliers} isLoading={isLoading} onEdit={openEdit} onDelete={(supplier) => void handleDelete(supplier)} /><SupplierModal open={isModalOpen} supplier={selectedSupplier} onClose={() => setIsModalOpen(false)} onSave={handleSave} /></section>;
}
