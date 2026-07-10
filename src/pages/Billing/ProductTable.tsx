import { PackageSearch, Plus } from "lucide-react";
import ProductSearch from "../../features/billing/components/ProductSearch";
import BillingRow from "../../features/billing/components/BillingRow";
import { Button, Card, EmptyState, Table } from "../../components/ui";
import type { Inventory } from "../../types/inventory";

export type BillingItem = { item: Inventory; quantity: number };
type ProductTableProps = { items: BillingItem[]; setItems: React.Dispatch<React.SetStateAction<BillingItem[]>> };

export default function ProductTable({ items, setItems }: ProductTableProps) {
  function addProduct(product: Inventory) {
    const existing = items.find((row) => row.item.id === product.id);
    if (existing) { setItems(items.map((row) => row.item.id === product.id ? { ...row, quantity: row.quantity + 1 } : row)); return; }
    setItems([...items, { item: product, quantity: 1 }]);
  }
  function updateQuantity(id: number, quantity: number) { if (quantity < 1) return; setItems(items.map((row) => row.item.id === id ? { ...row, quantity } : row)); }
  function removeItem(id: number) { setItems(items.filter((row) => row.item.id !== id)); }

  return <Card className="billing-card billing-product-card">
    <div className="billing-card__header"><div><p className="billing-card__eyebrow">Products</p><h2>Bill items <span>{items.length}</span></h2></div><Button size="sm"><Plus size={16} /> Search Product</Button></div>
    <ProductSearch onSelect={addProduct} />
    <div className="billing-table">
      {items.length === 0 ? (
        <EmptyState icon={<PackageSearch size={22} />} title="No items added" description="Search the catalog above to add a product." />
      ) : (
        <Table compact><thead><tr><th>Item Code</th><th>Product</th><th>Price</th><th>Qty</th><th>GST</th><th>Total</th><th aria-label="Actions" /></tr></thead><tbody>
          {items.map((row) => <BillingRow key={row.item.id} item={row.item} quantity={row.quantity} onQuantityChange={(qty) => updateQuantity(row.item.id, qty)} onRemove={() => removeItem(row.item.id)} />)}
        </tbody></Table>
      )}
    </div>
  </Card>;
}
