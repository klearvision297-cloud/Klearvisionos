import { useCallback, useEffect, useState } from "react";
import { CircleDollarSign, FilePlus2, Plus, ReceiptText, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { Button, PageHeader, SearchBar, StatCard } from "../../../components/ui";
import type { Inventory } from "../../../types/inventory";
import type { Purchase, CreatePurchaseDTO } from "../../../types/purchase";
import type { Supplier } from "../../../types/supplier";
import PurchaseDetails from "../components/PurchaseDetails";
import PurchaseEditor from "../components/PurchaseEditor";
import PurchaseTable from "../components/PurchaseTable";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]); const [suppliers, setSuppliers] = useState<Supplier[]>([]); const [inventory, setInventory] = useState<Inventory[]>([]); const [summary, setSummary] = useState({ purchaseCount: 0, totalValue: 0, outstanding: 0, todayValue: 0 }); const [search, setSearch] = useState(""); const [status, setStatus] = useState("ALL"); const [isLoading, setIsLoading] = useState(true); const [isEditorOpen, setIsEditorOpen] = useState(false); const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const load = useCallback(async () => { setIsLoading(true); try { const [purchaseResult, supplierResult, inventoryResult, summaryResult] = await Promise.all([window.purchase.getAll(search, status), window.supplier.getAll(), window.inventory.getAll(), window.purchase.getSummary()]); setPurchases(purchaseResult); setSuppliers(supplierResult); setInventory(inventoryResult); setSummary(summaryResult); } catch { toast.error("Unable to load purchase workspace."); } finally { setIsLoading(false); } }, [search, status]);
  useEffect(() => { void load(); }, [load]);
  const savePurchase = async (purchase: CreatePurchaseDTO) => { try { const result = await window.purchase.create(purchase); toast.success(`Purchase ${result.purchaseNumber} posted.`); setIsEditorOpen(false); await load(); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to post purchase."); throw error; } };
  const viewPurchase = async (purchase: Purchase) => { try { setSelectedPurchase(await window.purchase.getById(purchase.id)); } catch { toast.error("Unable to load purchase details."); } };
  return <section className="purchase-page"><PageHeader eyebrow="Procurement" title="Purchases" subtitle="Receive supplier invoices, update stock, and track payables." action={<Button size="sm" onClick={() => setIsEditorOpen(true)}><Plus size={16} /> New Purchase</Button>} /><div className="purchase-page__toolbar"><SearchBar placeholder="Search purchase number, invoice, or supplier" value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} /><label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All statuses</option><option value="POSTED">Posted</option></select></label><span>{isLoading ? "Loading…" : `${purchases.length} purchases`}</span></div><div className="purchase-page__stats"><StatCard label="Purchases Posted" value={summary.purchaseCount} icon={<ReceiptText size={18} />} /><StatCard label="Purchase Value" value={currency.format(summary.totalValue)} icon={<CircleDollarSign size={18} />} /><StatCard label="Supplier Payables" value={currency.format(summary.outstanding)} icon={<Truck size={18} />} /><StatCard label="Today's Purchases" value={currency.format(summary.todayValue)} icon={<FilePlus2 size={18} />} /></div><PurchaseTable purchases={purchases} isLoading={isLoading} onView={(purchase) => void viewPurchase(purchase)} /><PurchaseEditor open={isEditorOpen} suppliers={suppliers} inventory={inventory} onClose={() => setIsEditorOpen(false)} onSave={savePurchase} /><PurchaseDetails purchase={selectedPurchase} onClose={() => setSelectedPurchase(null)} /></section>;
}
