import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Eye, WalletCards, X } from "lucide-react";
import { Badge, Button, Card, DataUnavailable, Input, Modal, PageHeader, SearchBar, StatCard, Table } from "../../../components/ui";
import type { CustomerDueDetail, CustomerDueRow, DueFilter } from "../../../types/due";
import type { InvoiceRegisterRow, PaymentCollectionSummary } from "../../../types/report";
import { publishBillingDataChange, subscribeToBillingDataChanges } from "../../../shared/utils/billingEvents";

const money = (value: number) => `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "—";
const filters: Array<{ value: DueFilter; label: string }> = [
  { value: "all", label: "All" }, { value: "overdue", label: "Overdue" }, { value: "due-today", label: "Due Today" }, { value: "partial", label: "Partially Paid" }, { value: "paid", label: "Fully Paid" },
];

export default function CustomerDuesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DueFilter>("all");
  const [rows, setRows] = useState<CustomerDueRow[]>([]);
  const [collection, setCollection] = useState<PaymentCollectionSummary | null>(null);
  const [detail, setDetail] = useState<CustomerDueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceRegisterRow | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setLoading(true); const [dueRows, collectionSummary] = await Promise.all([window.report.getCustomerDues(search, filter), window.report.getPaymentCollectionSummary()]); setRows(dueRows); setCollection(collectionSummary); }
    catch { toast.error("Unable to load customer dues."); }
    finally { setLoading(false); }
  }, [search, filter]);
  const loadDetail = useCallback(async (customerId: number) => {
    try { const next = await window.report.getCustomerDueDetail(customerId); setDetail(next); }
    catch { toast.error("Unable to load customer collection details."); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeToBillingDataChanges(() => { void load(); if (detail) void loadDetail(detail.customer.customerId); }), [detail, load, loadDetail]);
  useEffect(() => {
    if (!detail) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setDetail(null); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", closeOnEscape); };
  }, [detail]);

  const totals = useMemo(() => rows.reduce((sum, row) => ({ outstanding: sum.outstanding + row.outstanding, invoices: sum.invoices + row.unpaidInvoices }), { outstanding: 0, invoices: 0 }), [rows]);
  async function recordPayment() {
    if (!paymentInvoice) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > paymentInvoice.balanceAmount) { toast.error("Enter an amount within the invoice outstanding balance."); return; }
    try {
      setSaving(true);
      await window.invoice.receivePayment(paymentInvoice.id, value, method, remarks, reference);
      publishBillingDataChange({ orderId: paymentInvoice.id, orderNumber: paymentInvoice.orderNumber, customerId: paymentInvoice.customerId });
      await Promise.all([load(), detail ? loadDetail(detail.customer.customerId) : Promise.resolve()]);
      setPaymentInvoice(null); setAmount(""); setReference(""); setRemarks(""); toast.success("Payment recorded and balances refreshed.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Payment could not be recorded."); }
    finally { setSaving(false); }
  }

  return <section className="customer-dues">
    <PageHeader eyebrow="Payment collection" title="Customer Dues" subtitle="Live outstanding balances from invoices and payment history." />
    <div className="customer-dues__stats"><StatCard label="Customers due" value={rows.length} detail="Customers with open balances" icon={<WalletCards size={20} />} /><StatCard label="Outstanding" value={money(totals.outstanding)} detail="Sum of live invoice balances" icon={<WalletCards size={20} />} /><StatCard label="Today's collections" value={money(collection?.todayCollections ?? 0)} detail={collection?.byMethod.length ? collection.byMethod.map((entry) => `${entry.paymentMethod} ${money(entry.amount)}`).join(" · ") : "No payments received today"} icon={<WalletCards size={20} />} /></div>
    <Card className="customer-dues__table-card"><div className="customer-dues__toolbar"><SearchBar placeholder="Search customer, invoice, mobile, or customer code…" value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} /><div className="customer-dues__filters">{filters.map((item) => <Button key={item.value} size="sm" variant={filter === item.value ? "primary" : "ghost"} onClick={() => setFilter(item.value)}>{item.label}</Button>)}</div></div>
      {loading ? <p className="customer-dues__loading">Loading live balances…</p> : rows.length ? <Table><thead><tr><th>Customer</th><th>Mobile</th><th className="numeric">Outstanding</th><th className="numeric">Unpaid invoices</th><th>Last visit</th><th>Last payment</th><th /></tr></thead><tbody>{rows.map((row) => <tr key={row.customerId} onClick={() => void loadDetail(row.customerId)} className="customer-dues__row"><td><strong>{row.customerName}</strong><small>{row.customerCode}</small></td><td>{row.customerMobile}</td><td className="numeric"><strong>{money(row.outstanding)}</strong></td><td className="numeric">{row.unpaidInvoices}</td><td>{formatDate(row.lastVisit)}</td><td>{formatDate(row.lastPayment)}</td><td><Button size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); void loadDetail(row.customerId); }} aria-label={`Open ${row.customerName}`}><Eye size={17} /></Button></td></tr>)}</tbody></Table> : <DataUnavailable title={filter === "paid" ? "No fully paid customers in Customer Dues" : "No customers with outstanding balances"} description={filter === "paid" ? "This collection workspace intentionally shows only customers who still owe money." : "Payments are complete, or try another filter or search."} />}</Card>
    {detail && <CustomerDueDrawer detail={detail} onClose={() => setDetail(null)} onReceive={(invoice) => { setPaymentInvoice(invoice); setAmount(""); }} />}
    <Modal open={Boolean(paymentInvoice)} onClose={() => setPaymentInvoice(null)} title="Receive payment" description={paymentInvoice ? `${paymentInvoice.orderNumber} · Outstanding: ${money(paymentInvoice.balanceAmount)}` : undefined} footer={<><Button variant="secondary" onClick={() => setPaymentInvoice(null)}>Close</Button><Button disabled={saving} onClick={() => void recordPayment()}>{saving ? "Recording…" : "Record payment"}</Button></>}><div className="customer-dues__form"><Input label="Amount" type="number" min="0.01" max={paymentInvoice?.balanceAmount} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} autoFocus /><label className="kv-field"><span className="kv-field__label">Method</span><select value={method} onChange={(event) => setMethod(event.target.value)}><option>Cash</option><option>UPI</option><option>Card</option><option>Bank Transfer</option><option>Cheque</option><option>Mixed</option></select></label><Input label="Reference" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="UPI / cheque / bank reference" /><label className="kv-field"><span className="kv-field__label">Remarks</span><textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Optional note" /></label></div></Modal>
  </section>;
}

function CustomerDueDrawer({ detail, onClose, onReceive }: { detail: CustomerDueDetail; onClose: () => void; onReceive: (invoice: InvoiceRegisterRow) => void }) {
  const { customer, invoices, payments } = detail;
  return <><div className="drawer-overlay" onClick={onClose} /><aside className="customer-drawer customer-due-drawer"><header className="customer-due-drawer__header"><div><p>Customer collection</p><h2>{customer.customerName}</h2><span>{customer.customerCode} · {customer.customerMobile}</span></div><Button variant="ghost" onClick={onClose} aria-label="Close customer drawer"><X size={20} /></Button></header><div className="customer-due-drawer__total"><span>Live outstanding</span><strong>{money(customer.outstanding)}</strong><small>{customer.unpaidInvoices} unpaid invoice{customer.unpaidInvoices === 1 ? "" : "s"}</small></div><div className="customer-due-drawer__body"><section><h3>Outstanding invoices</h3><Table compact><thead><tr><th>Invoice</th><th>Date</th><th className="numeric">Amount</th><th className="numeric">Paid</th><th className="numeric">Outstanding</th><th>Status</th><th /></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id}><td><strong>{invoice.orderNumber}</strong></td><td>{formatDate(invoice.orderDate)}</td><td className="numeric">{money(invoice.totalAmount)}</td><td className="numeric">{money(invoice.paidAmount)}</td><td className="numeric"><strong>{money(invoice.balanceAmount)}</strong></td><td><Badge variant={invoice.paymentStatus === "Partial" ? "warning" : "info"}>{invoice.paymentStatus}</Badge></td><td><Button size="sm" onClick={() => onReceive(invoice)}><WalletCards size={15} /> Receive</Button></td></tr>)}</tbody></Table></section><section><h3>Payment timeline</h3>{payments.length ? <ol className="customer-due-drawer__timeline">{payments.map((payment) => <li key={payment.id}><div><strong>{money(payment.amount)} · {payment.paymentMethod}</strong><small>{formatDate(payment.paymentDate)} · Staff: {payment.recordedBy ?? "Store"}{payment.referenceNumber ? ` · Ref: ${payment.referenceNumber}` : ""}</small></div><span>{payment.orderNumber}</span></li>)}</ol> : <p>No payment history.</p>}</section></div></aside></>;
}
