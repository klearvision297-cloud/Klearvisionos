import { useMemo, useState } from "react";
import { Card, Input } from "../../components/ui";
import type { BillingItem } from "./ProductTable";
type TotalsProps = { items: BillingItem[] };
export default function Totals({ items }: TotalsProps) {
  const [discountMode, setDiscountMode] = useState<"amount" | "percent">("amount");
  const [discountValue, setDiscountValue] = useState(0);
  const summary = useMemo(() => { const subtotal = items.reduce((sum, row) => sum + row.item.sellingPrice * row.quantity, 0); const gst = items.reduce((sum, row) => sum + row.item.sellingPrice * row.quantity * (row.item.gstRate / 100), 0); const discount = discountMode === "percent" ? subtotal * (discountValue / 100) : discountValue; const beforeRound = subtotal + gst - discount; const grandTotal = Math.round(beforeRound); return { subtotal, gst, discount, grandTotal, roundOff: grandTotal - beforeRound }; }, [items, discountMode, discountValue]);
  return <Card className="billing-card billing-totals"><h2>Bill Totals</h2><Row label="Subtotal" value={summary.subtotal} /><Row label="GST" value={summary.gst} /><div className="billing-discount"><span>Discount</span><div><select aria-label="Discount type" value={discountMode} onChange={(e) => setDiscountMode(e.target.value as "amount" | "percent")}><option value="amount">₹</option><option value="percent">%</option></select><Input aria-label="Discount value" type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} /></div></div><Row label="Discount" value={summary.discount} /><Row label="Round Off" value={summary.roundOff} /><hr /><div className="billing-grand-total"><span>Net Payable</span><span>₹{summary.grandTotal.toFixed(2)}</span></div></Card>;
}
function Row({ label, value }: { label: string; value: number }) { return <div className="billing-summary-row"><span>{label}</span><strong>₹{value.toFixed(2)}</strong></div>; }
