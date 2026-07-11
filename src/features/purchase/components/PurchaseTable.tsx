import { Eye } from "lucide-react";
import { Badge, Button, EmptyState, Table } from "../../../components/ui";
import type { Purchase } from "../../../types/purchase";

type PurchaseTableProps = { purchases: Purchase[]; isLoading: boolean; onView: (purchase: Purchase) => void };
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function PurchaseTable({ purchases, isLoading, onView }: PurchaseTableProps) {
  if (!isLoading && purchases.length === 0) return <EmptyState title="No purchases found" description="Create a purchase invoice to receive stock from a supplier." />;
  return <div className="purchase-table"><Table compact><thead><tr><th>Purchase</th><th>Supplier</th><th>Supplier Invoice</th><th>Date</th><th>Payment</th><th className="purchase-table__amount">Total</th><th>Status</th><th className="purchase-table__action">View</th></tr></thead><tbody>{isLoading ? <tr><td colSpan={8} className="purchase-table__loading">Loading purchases…</td></tr> : purchases.map((purchase) => <tr key={purchase.id}><td><strong>{purchase.purchaseNumber}</strong><small>{purchase.createdAt.slice(0, 10)}</small></td><td>{purchase.supplierName}</td><td>{purchase.invoiceNumber || "—"}</td><td>{purchase.purchaseDate}</td><td>{purchase.paymentMethod}</td><td className="purchase-table__amount">{currency.format(purchase.totalAmount)}</td><td><Badge variant="success">Posted</Badge></td><td className="purchase-table__action"><Button size="sm" variant="ghost" onClick={() => onView(purchase)} aria-label={`View ${purchase.purchaseNumber}`}><Eye size={16} /></Button></td></tr>)}</tbody></Table></div>;
}
