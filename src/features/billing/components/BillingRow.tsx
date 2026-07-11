import { Trash2 } from "lucide-react";
import { Button, Input } from "../../../components/ui";
import type { Inventory } from "../../../types/inventory";
type BillingRowProps = { item: Inventory; quantity: number; onQuantityChange: (quantity: number) => void; onRemove: () => void };
export default function BillingRow({ item, quantity, onQuantityChange, onRemove }: BillingRowProps) {
  const total = item.sellingPrice * quantity;
  return <tr><td>{item.itemCode}</td><td>{item.brand} {item.model}</td><td>₹{item.sellingPrice}</td><td><Input aria-label={`Quantity for ${item.itemCode}`} className="billing-row__quantity" type="number" min={1} value={quantity} onChange={(e) => onQuantityChange(Number(e.target.value))} /></td><td>{item.gstRate}%</td><td>₹{total.toFixed(2)}</td><td><Button variant="ghost" size="sm" aria-label={`Remove ${item.itemCode}`} onClick={onRemove}><Trash2 size={16} /></Button></td></tr>;
}
