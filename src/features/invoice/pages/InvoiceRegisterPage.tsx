import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Copy, Eye, Pencil, Printer, ReceiptText, WalletCards, XCircle } from "lucide-react";
import { Badge, Button, Card, DataUnavailable, Input, Modal, PageHeader, SearchBar, StatCard, Table } from "../../../components/ui";
import type { InvoiceDetail, InvoiceListRow } from "../../../types/invoice";
import { publishBillingDataChange, subscribeToBillingDataChanges } from "../../../shared/utils/billingEvents";

const money = (amount: number) => `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const date = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
const statusVariant = (status: string) => status === "Cancelled" ? "danger" : status === "Completed" ? "success" : "warning";

export default function InvoiceRegisterPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState<InvoiceListRow[]>([]);
  const [selected, setSelected] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [remarks, setRemarks] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setLoading(true); setInvoices(await window.invoice.list(search)); }
    catch { toast.error("Unable to load invoices."); }
    finally { setLoading(false); }
  }, [search]);
  const refreshSelected = useCallback(async (id: number) => {
    const detail = await window.invoice.detail(id);
    setSelected(detail);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeToBillingDataChanges(() => { void load(); if (selected) void refreshSelected(selected.id); }), [load, refreshSelected, selected]);

  const totals = useMemo(() => invoices.reduce((sum, invoice) => ({ total: sum.total + invoice.totalAmount, outstanding: sum.outstanding + invoice.balanceAmount }), { total: 0, outstanding: 0 }), [invoices]);
  async function openInvoice(id: number) { try { const detail = await window.invoice.detail(id); if (!detail) throw new Error(); setSelected(detail); } catch { toast.error("Unable to open invoice."); } }
  function announceChange(invoice: InvoiceDetail) { publishBillingDataChange({ orderId: invoice.id, orderNumber: invoice.orderNumber, customerId: invoice.customerId }); }
  async function print(format: "thermal" | "a4" | "a5") { if (!selected) return; try { await window.invoice.print(selected.id, format); } catch (error) { toast.error(error instanceof Error ? error.message : "Printing failed."); } }
  async function receivePayment() {
    if (!selected) return; const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > selected.balanceAmount) { toast.error("Enter an amount within the outstanding balance."); return; }
    try { setSaving(true); await window.invoice.receivePayment(selected.id, value, method, remarks); await refreshSelected(selected.id); announceChange(selected); setPaymentOpen(false); setAmount(""); setRemarks(""); toast.success("Payment recorded."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Payment could not be recorded."); }
    finally { setSaving(false); }
  }
  async function cancelInvoice() {
    if (!selected || !reason.trim()) { toast.error("A cancellation reason is required."); return; }
    try { setSaving(true); await window.invoice.cancel(selected.id, reason); await refreshSelected(selected.id); announceChange(selected); setCancelOpen(false); setReason(""); toast.success("Invoice cancelled and inventory restored."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Invoice could not be cancelled."); }
    finally { setSaving(false); }
  }

  return <section className="invoice-register">
    <PageHeader eyebrow="Sales ledger" title="Invoice Register" subtitle="Every retail, prescription, and repair invoice from the orders ledger." action={<Button onClick={() => navigate("/billing")}><ReceiptText size={16} /> New invoice</Button>} />
    <div className="invoice-register__stats"><StatCard label="Invoices" value={invoices.length} detail="Current search results" icon={<ReceiptText size={20} />} /><StatCard label="Invoice value" value={money(totals.total)} detail="Includes cancelled invoice history" icon={<WalletCards size={20} />} /><StatCard label="Outstanding" value={money(totals.outstanding)} detail="Open balances in this view" icon={<WalletCards size={20} />} /></div>
    <Card className="invoice-register__table-card"><div className="invoice-register__toolbar"><SearchBar placeholder="Search invoice, customer, mobile, or customer code…" value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} /><span>{invoices.length} invoice{invoices.length === 1 ? "" : "s"}</span></div>
      {loading ? <p className="invoice-register__loading">Loading invoices…</p> : invoices.length ? <Table><thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Workflow</th><th>Status</th><th className="numeric">Total</th><th className="numeric">Paid</th><th className="numeric">Outstanding</th><th>Payment</th><th>Staff</th><th /></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id}><td><strong>{invoice.orderNumber}</strong></td><td>{date(invoice.orderDate)}</td><td><strong>{invoice.customerName}</strong><small>{invoice.customerCode} · {invoice.customerMobile}</small></td><td><Badge variant="info">{invoice.workflow}</Badge></td><td><Badge variant={statusVariant(invoice.orderStatus)}>{invoice.orderStatus}</Badge></td><td className="numeric">{money(invoice.totalAmount)}</td><td className="numeric">{money(invoice.paidAmount)}</td><td className="numeric">{money(invoice.balanceAmount)}</td><td><Badge variant={invoice.paymentStatus === "Paid" ? "success" : invoice.paymentStatus === "Refunded" ? "danger" : "warning"}>{invoice.paymentStatus}</Badge></td><td>{invoice.staff ?? "—"}</td><td><Button size="sm" variant="ghost" onClick={() => void openInvoice(invoice.id)} aria-label={`Open ${invoice.orderNumber}`}><Eye size={17} /></Button></td></tr>)}</tbody></Table> : <DataUnavailable title={search ? "No matching invoices" : "No invoices yet"} description={search ? "Try an invoice number, customer name, mobile number, or customer code." : "Invoices created by billing workflows will appear here automatically."} />}</Card>

    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? `Invoice ${selected.orderNumber}` : "Invoice"} width={1100} footer={selected ? <div className="invoice-register__modal-actions"><Button variant="secondary" onClick={() => void print("thermal")}><Printer size={16} /> Thermal</Button><Button variant="secondary" onClick={() => void print("a4")}><Printer size={16} /> A4</Button><Button variant="secondary" onClick={() => void print("a5")}><Printer size={16} /> A5</Button><Button variant="secondary" onClick={() => { setSelected(null); navigate("/billing"); }}><Copy size={16} /> Duplicate</Button>{selected.orderStatus !== "Cancelled" && <Button variant="secondary" disabled title="Posted invoices are immutable; only draft invoices may be edited."><Pencil size={16} /> Edit</Button>}{selected.balanceAmount > 0 && selected.orderStatus !== "Cancelled" && <Button onClick={() => setPaymentOpen(true)}><WalletCards size={16} /> Receive payment</Button>}{selected.orderStatus !== "Cancelled" && <Button variant="danger" onClick={() => setCancelOpen(true)}><XCircle size={16} /> Cancel</Button>}</div> : undefined}>
      {selected && <InvoiceDetails invoice={selected} />}
    </Modal>
    <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Receive payment" description={selected ? `Outstanding: ${money(selected.balanceAmount)}` : undefined} footer={<><Button variant="secondary" onClick={() => setPaymentOpen(false)}>Close</Button><Button disabled={saving} onClick={() => void receivePayment()}>{saving ? "Saving…" : "Record payment"}</Button></>}><div className="invoice-register__form"><Input label="Amount" type="number" min="0.01" max={selected?.balanceAmount} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /><label className="kv-field"><span className="kv-field__label">Method</span><select value={method} onChange={(event) => setMethod(event.target.value)}><option>Cash</option><option>Card</option><option>UPI</option><option>Bank Transfer</option></select></label><label className="kv-field"><span className="kv-field__label">Remarks</span><textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Optional reference or note" /></label></div></Modal>
    <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel invoice" description="The invoice remains in the register. Stock is restored and recorded payments are reversed in the ledger." footer={<><Button variant="secondary" onClick={() => setCancelOpen(false)}>Keep invoice</Button><Button variant="danger" disabled={saving} onClick={() => void cancelInvoice()}>{saving ? "Cancelling…" : "Cancel invoice"}</Button></>}><div className="invoice-register__form"><label className="kv-field"><span className="kv-field__label">Cancellation reason</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required for the audit timeline" /></label></div></Modal>
  </section>;
}

function InvoiceDetails({ invoice }: { invoice: InvoiceDetail }) {
  const prescription = invoice.prescription ? Object.entries(invoice.prescription).filter(([key, value]) => value !== null && value !== "" && !["id", "customerId", "createdAt", "updatedAt"].includes(key)).slice(0, 12) : [];
  return <div className="invoice-detail"><div className="invoice-detail__summary"><div><span>Customer</span><strong>{invoice.customerName}</strong><small>{invoice.customerCode} · {invoice.customerMobile}</small></div><div><span>Workflow</span><strong>{invoice.workflow}</strong><small>{date(invoice.orderDate)}</small></div><div><span>Outstanding</span><strong>{money(invoice.balanceAmount)}</strong><small>{invoice.paymentStatus}</small></div><div><span>Status</span><Badge variant={statusVariant(invoice.orderStatus)}>{invoice.orderStatus}</Badge></div></div>
    <section><h3>Items</h3><Table compact><thead><tr><th>Item</th><th>Type</th><th className="numeric">Qty</th><th className="numeric">Rate</th><th className="numeric">Discount</th><th className="numeric">Total</th></tr></thead><tbody>{invoice.items.map((item) => <tr key={item.id}><td><strong>{[item.brand, item.model].filter(Boolean).join(" ") || item.itemCode}</strong><small>{item.itemCode}{item.color ? ` · ${item.color}` : ""}{item.size ? ` · ${item.size}` : ""}</small></td><td>{item.itemType}</td><td className="numeric">{item.quantity}</td><td className="numeric">{money(item.sellingPrice)}</td><td className="numeric">{money(item.discount)}</td><td className="numeric">{money(item.total)}</td></tr>)}</tbody></Table></section>
    {prescription.length > 0 && <section><h3>Prescription</h3><div className="invoice-detail__prescription">{prescription.map(([key, value]) => <span key={key}><small>{key.replace(/([A-Z])/g, " $1")}</small><strong>{String(value)}</strong></span>)}</div></section>}
    <section className="invoice-detail__split"><div><h3>Payment history</h3>{invoice.payments.length ? <ol>{invoice.payments.map((payment) => <li key={payment.id}><div><strong>{payment.paymentMethod}</strong><small>{date(payment.paymentDate)}{payment.remarks ? ` · ${payment.remarks}` : ""}</small></div><b className={payment.amount < 0 ? "negative" : ""}>{money(payment.amount)}</b></li>)}</ol> : <p>No payment records.</p>}</div><div><h3>Timeline</h3><ol>{invoice.timeline.map((event) => <li key={event.id}><div><strong>{event.eventType.replaceAll("_", " ")}</strong><small>{date(event.createdAt)}{event.notes ? ` · ${event.notes}` : ""}</small></div></li>)}</ol></div></section>
    <section className="invoice-detail__totals"><span>Subtotal <b>{money(invoice.subtotal)}</b></span><span>Discount <b>{money(invoice.discount)}</b></span><span>GST <b>{money(invoice.gstAmount)}</b></span><span>Round off <b>{money(invoice.roundOff)}</b></span><strong>Total <b>{money(invoice.totalAmount)}</b></strong><strong>Paid <b>{money(invoice.paidAmount)}</b></strong></section>
    {invoice.remarks && <section><h3>Remarks</h3><p>{invoice.remarks}</p></section>}
  </div>;
}
