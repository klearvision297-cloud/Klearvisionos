import { useEffect, useState } from "react";
import { Button, Input, Modal } from "../../../components/ui";
import type { CreateSupplierDTO, Supplier } from "../types/supplier";

type SupplierModalProps = {
  open: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onSave: (supplier: CreateSupplierDTO) => Promise<void>;
};

const emptyForm: CreateSupplierDTO = { supplierName: "", companyName: "", gstin: "", phone: "", email: "", contactPerson: "", address: "", city: "", state: "", pincode: "", openingBalance: 0, turnaroundDays: 0, paymentTerms: "", remarks: "", isActive: true };

export default function SupplierModal({ open, supplier, onClose, onSave }: SupplierModalProps) {
  const [form, setForm] = useState<CreateSupplierDTO>(emptyForm);
  const [errors, setErrors] = useState<{ supplierName?: string; phone?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(supplier ? { supplierName: supplier.supplierName, companyName: supplier.companyName ?? "", gstin: supplier.gstin ?? "", phone: supplier.phone, email: supplier.email ?? "", contactPerson: supplier.contactPerson ?? "", address: supplier.address ?? "", city: supplier.city ?? "", state: supplier.state ?? "", pincode: supplier.pincode ?? "", openingBalance: supplier.openingBalance, turnaroundDays: supplier.turnaroundDays, paymentTerms: supplier.paymentTerms ?? "", remarks: supplier.remarks ?? "", isActive: supplier.isActive === 1 } : emptyForm);
  }, [open, supplier]);

  const update = <K extends keyof CreateSupplierDTO>(field: K, value: CreateSupplierDTO[K]) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async () => {
    const nextErrors = { supplierName: form.supplierName.trim() ? undefined : "Supplier name is required.", phone: form.phone.trim() ? undefined : "Phone is required." };
    setErrors(nextErrors);
    if (nextErrors.supplierName || nextErrors.phone) return;
    try { setIsSaving(true); await onSave(form); onClose(); } finally { setIsSaving(false); }
  };

  return <Modal open={open} onClose={onClose} title={supplier ? "Edit Supplier" : "New Supplier"} description="Supplier contact, turnaround, payment, and balance details." width={860} closeOnBackdrop={false} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => void handleSubmit()} disabled={isSaving}>{isSaving ? "Saving…" : "Save"}</Button></>}><div className="supplier-form"><div className="supplier-form__grid"><Input label="Supplier Name *" value={form.supplierName} error={errors.supplierName} onChange={(event) => update("supplierName", event.target.value)} autoFocus /><Input label="Company" value={form.companyName} onChange={(event) => update("companyName", event.target.value)} /><Input label="Phone *" value={form.phone} error={errors.phone} onChange={(event) => update("phone", event.target.value)} /><Input label="GSTIN" value={form.gstin} onChange={(event) => update("gstin", event.target.value.toUpperCase())} /><Input label="Email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} /><Input label="Contact Person" value={form.contactPerson} onChange={(event) => update("contactPerson", event.target.value)} /><Input label="City" value={form.city} onChange={(event) => update("city", event.target.value)} /><Input label="State" value={form.state} onChange={(event) => update("state", event.target.value)} /><Input label="Pincode" value={form.pincode} onChange={(event) => update("pincode", event.target.value.replace(/\D/g, ""))} /><Input label="Opening Balance" type="number" min="0" value={form.openingBalance} onChange={(event) => update("openingBalance", Number(event.target.value))} /><Input label="Lab Turnaround (business days)" type="number" min="0" value={form.turnaroundDays} onChange={(event) => update("turnaroundDays", Number(event.target.value))} /><Input label="Payment Terms" placeholder="e.g. Net 30" value={form.paymentTerms} onChange={(event) => update("paymentTerms", event.target.value)} /><label className="kv-field supplier-form__status"><span className="kv-field__label">Status</span><select value={form.isActive ? "active" : "inactive"} onChange={(event) => update("isActive", event.target.value === "active")}><option value="active">Active</option><option value="inactive">Inactive</option></select></label></div><label className="kv-field"><span className="kv-field__label">Address</span><textarea rows={2} value={form.address} onChange={(event) => update("address", event.target.value)} /></label><label className="kv-field"><span className="kv-field__label">Remarks</span><textarea rows={2} value={form.remarks} onChange={(event) => update("remarks", event.target.value)} /></label></div></Modal>;
}
