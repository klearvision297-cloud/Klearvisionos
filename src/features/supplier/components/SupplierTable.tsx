import { Pencil, Trash2 } from "lucide-react";
import { Badge, Button, EmptyState, Table } from "../../../components/ui";
import type { Supplier } from "../types/supplier";

type SupplierTableProps = {
  suppliers: Supplier[];
  isLoading: boolean;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
};

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function SupplierTable({ suppliers, isLoading, onEdit, onDelete }: SupplierTableProps) {
  if (!isLoading && suppliers.length === 0) {
    return <EmptyState title="No suppliers found" description="Add a supplier to build your purchase partner directory." />;
  }

  return (
    <div className="supplier-table">
      <Table compact>
        <thead><tr><th>Supplier</th><th>Company</th><th>Phone</th><th>GSTIN</th><th className="supplier-table__amount">Outstanding</th><th>Status</th><th className="supplier-table__actions">Actions</th></tr></thead>
        <tbody>
          {isLoading ? <tr><td colSpan={7} className="supplier-table__loading">Loading suppliers…</td></tr> : suppliers.map((supplier) => (
            <tr key={supplier.id}>
              <td><strong>{supplier.supplierName}</strong><small>{supplier.supplierCode}</small></td>
              <td>{supplier.companyName || "—"}</td>
              <td>{supplier.phone}</td>
              <td>{supplier.gstin || "—"}</td>
              <td className="supplier-table__amount">{currency.format(supplier.outstandingBalance)}</td>
              <td><Badge variant={supplier.isActive === 1 ? "success" : "neutral"}>{supplier.isActive === 1 ? "Active" : "Inactive"}</Badge></td>
              <td className="supplier-table__actions"><Button size="sm" variant="ghost" onClick={() => onEdit(supplier)} aria-label={`Edit ${supplier.supplierName}`}><Pencil size={15} /></Button><Button size="sm" variant="ghost" onClick={() => onDelete(supplier)} aria-label={`Delete ${supplier.supplierName}`}><Trash2 size={15} /></Button></td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
