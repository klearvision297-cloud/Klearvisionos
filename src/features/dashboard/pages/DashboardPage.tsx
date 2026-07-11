import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight, Boxes, CalendarDays, ClipboardList, IndianRupee,
  PackagePlus, PackageSearch, ReceiptText, ShieldAlert, TrendingUp,
  UserPlus, Users, WalletCards,
} from "lucide-react";
import {
  Badge, Button, Card, DataUnavailable, PageHeader, SearchBar, StatCard, Table,
} from "../../../components/ui";
import type { Inventory, StockHistoryItem } from "../../../types/inventory";
import type { InvoiceRegisterRow, PaymentHistoryRow, RetailDashboardSummary } from "../../../types/report";
import { subscribeToBillingDataChanges } from "../../../shared/utils/billingEvents";

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function productName(item: Pick<Inventory, "brand" | "model" | "itemCode">) {
  return `${item.brand ?? ""} ${item.model ?? ""}`.trim() || item.itemCode;
}

function movementLabel(entry: StockHistoryItem) {
  if (entry.changeType.toUpperCase() === "SALE") return "Stock sold";
  if (entry.changeType.toUpperCase() === "PURCHASE") return "Stock received";
  return "Stock adjusted";
}

function money(value: number) { return `₹${value.toLocaleString("en-IN")}`; }

export default function Dashboard() {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [history, setHistory] = useState<StockHistoryItem[]>([]);
  const [summary, setSummary] = useState<RetailDashboardSummary | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRegisterRow[]>([]);
  const [payments, setPayments] = useState<PaymentHistoryRow[]>([]);
  const [invoiceSearch, setInvoiceSearch] = useState("");

  const loadDashboardData = useCallback(async () => {
    const [inventoryResult, customerResult, historyResult, summaryResult, invoiceResult, paymentResult] = await Promise.allSettled([
      window.inventory.getAll(), window.customer.getAll(), window.inventory.getStockHistory(),
      window.report.getDashboardSummary(), window.report.getInvoices(invoiceSearch), window.report.getRecentPayments(),
    ]);
    if (inventoryResult.status === "fulfilled") setInventory(inventoryResult.value);
    if (customerResult.status === "fulfilled") setCustomerCount(customerResult.value.length);
    if (historyResult.status === "fulfilled") setHistory(historyResult.value);
    if (summaryResult.status === "fulfilled") setSummary(summaryResult.value);
    if (invoiceResult.status === "fulfilled") setInvoices(invoiceResult.value);
    if (paymentResult.status === "fulfilled") setPayments(paymentResult.value);
  }, [invoiceSearch]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { void loadDashboardData(); }, [loadDashboardData]);
  useEffect(() => subscribeToBillingDataChanges(() => { void loadDashboardData(); }), [loadDashboardData]);

  const lowStock = useMemo(() => inventory.filter((item) => item.currentStock <= item.minimumStock), [inventory]);
  const recentActivity = useMemo(() => [...history].slice(0, 5), [history]);
  const dateText = new Intl.DateTimeFormat("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit",
  }).format(now);
  const kpis = [
    { label: "Today's Sales", value: summary ? money(summary.todaySales) : "—", detail: "Posted retail invoices today", icon: <IndianRupee size={20} /> },
    { label: "Bills Created", value: summary?.billsCreated ?? "—", detail: "Posted retail invoices today", icon: <ReceiptText size={20} /> },
    { label: "Profit", value: "—", detail: "Not calculated in retail revenue", icon: <TrendingUp size={20} /> },
    { label: "Customers", value: customerCount ?? "—", detail: customerCount === null ? "Loading customer records" : "Total customer records", icon: <Users size={20} /> },
    { label: "Outstanding Payments", value: summary ? money(summary.outstandingPayments) : "—", detail: "Open balance across invoices", icon: <WalletCards size={20} /> },
    { label: "Inventory Worth", value: summary ? money(summary.inventoryWorth) : "—", detail: "Current stock at cost", icon: <Boxes size={20} /> },
  ];

  return <section className="kv-dashboard">
    <PageHeader eyebrow="Command center" title={`${greetingFor(now.getHours())}, Anmol`} subtitle={dateText} action={<Badge variant="info"><CalendarDays size={14} /> Live workspace</Badge>} />
    <div className="kv-dashboard__kpis">{kpis.map((kpi) => <StatCard key={kpi.label} {...kpi} />)}</div>

    <div className="kv-dashboard__work-grid">
      <Card className="kv-dashboard__quick-actions"><div className="kv-dashboard__panel-heading"><div><p>Shortcuts</p><h2>Quick actions</h2></div></div><div className="kv-dashboard__action-list"><Button onClick={() => navigate("/billing")}><ReceiptText size={17} /> New bill</Button><Button variant="secondary" onClick={() => navigate("/customers")}><UserPlus size={17} /> New customer</Button><Button variant="secondary" onClick={() => navigate("/inventory")}><PackagePlus size={17} /> Add inventory</Button><Button variant="secondary" onClick={() => navigate("/stock-history")}><ClipboardList size={17} /> Stock history</Button></div></Card>
      <Card className="kv-dashboard__low-stock"><div className="kv-dashboard__panel-heading"><div><p>Inventory control</p><h2>Low stock alerts</h2></div><Badge variant={lowStock.length ? "danger" : "success"}>{lowStock.length} alert{lowStock.length === 1 ? "" : "s"}</Badge></div>{lowStock.length ? <div className="kv-dashboard__alert-list">{lowStock.slice(0, 3).map((item) => <div key={item.id} className="kv-dashboard__alert-row"><span className="kv-dashboard__alert-icon"><PackageSearch size={17} /></span><div><strong>{productName(item)}</strong><small>{item.itemCode} · Minimum {item.minimumStock} {item.unit}</small></div><b>{item.currentStock} {item.unit}</b></div>)}</div> : <DataUnavailable compact title="Stock levels are healthy" description="Items below their minimum quantity will be listed here." icon={<ShieldAlert size={20} />} />}<Button variant="ghost" size="sm" onClick={() => navigate("/inventory")}>Review inventory <ArrowUpRight size={15} /></Button></Card>
    </div>

    <div className="kv-dashboard__detail-grid">
      <Card className="kv-dashboard__activity-card"><div className="kv-dashboard__panel-heading"><div><p>Inventory ledger</p><h2>Recent activity</h2></div><Button variant="ghost" size="sm" onClick={() => navigate("/stock-history")}>View all <ArrowUpRight size={15} /></Button></div>{recentActivity.length ? <ol className="kv-dashboard__timeline">{recentActivity.map((entry) => <li key={entry.id}><span className="kv-dashboard__timeline-dot" /><div><strong>{movementLabel(entry)} · {productName(entry)}</strong><p>{entry.reason ?? entry.remarks ?? "Inventory movement recorded"}</p></div><Badge variant={entry.difference < 0 ? "info" : "success"}>{entry.difference > 0 ? `+${entry.difference}` : entry.difference} units</Badge></li>)}</ol> : <DataUnavailable compact title="No stock activity yet" description="The latest entries from Stock History will appear here." />}</Card>
      <Card className="kv-dashboard__activity-card"><div className="kv-dashboard__panel-heading"><div><p>Retail revenue</p><h2>Recent sales</h2></div></div>{invoices.length ? <ol className="kv-dashboard__timeline">{invoices.slice(0, 5).map((invoice) => <li key={invoice.id}><span className="kv-dashboard__timeline-dot" /><div><strong>{invoice.orderNumber} · {invoice.customerName}</strong><p>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(invoice.orderDate))}</p></div><Badge variant={invoice.balanceAmount > 0 ? "warning" : "success"}>{invoice.balanceAmount > 0 ? `Due ${money(invoice.balanceAmount)}` : "Paid"}</Badge><b>{money(invoice.totalAmount)}</b></li>)}</ol> : <DataUnavailable compact title="No retail invoices yet" description="Saved retail bills will appear here immediately." />}</Card>
    </div>

    <div className="kv-dashboard__detail-grid">
      <Card className="kv-dashboard__activity-card"><div className="kv-dashboard__panel-heading"><div><p>Collections</p><h2>Recent payments</h2></div></div>{payments.length ? <ol className="kv-dashboard__timeline">{payments.slice(0, 5).map((payment) => <li key={payment.id}><span className="kv-dashboard__timeline-dot" /><div><strong>{payment.customerName}</strong><p>{payment.orderNumber} · {payment.paymentMethod}</p></div><b>{money(payment.amount)}</b></li>)}</ol> : <DataUnavailable compact title="No payments received yet" description="Payments recorded with retail bills will appear here." />}</Card>
      <Card className="kv-dashboard__insights-card"><div className="kv-dashboard__panel-heading"><div><p>At a glance</p><h2>Business insights</h2></div></div><div className="kv-dashboard__insights"><div><span className="is-blue"><Boxes size={17} /></span><p><strong>{inventory.length}</strong> SKUs in catalog</p></div><div><span className={lowStock.length ? "is-amber" : "is-green"}><ShieldAlert size={17} /></span><p><strong>{lowStock.length}</strong> items need stock attention</p></div><div><span className="is-purple"><ClipboardList size={17} /></span><p><strong>{history.length}</strong> recorded stock movements</p></div></div></Card>
    </div>

    <Card className="kv-dashboard__activity-card"><div className="kv-dashboard__panel-heading"><div><p>Retail revenue</p><h2>Invoice register</h2></div></div><SearchBar placeholder="Find invoice by number, customer, or mobile…" value={invoiceSearch} onChange={(event) => setInvoiceSearch(event.target.value)} onClear={() => setInvoiceSearch("")} />{invoices.length ? <Table compact><thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th className="numeric">Total</th><th>Status</th></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id}><td><strong>{invoice.orderNumber}</strong></td><td>{invoice.customerName}<small>{invoice.customerMobile}</small></td><td>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(invoice.orderDate))}</td><td className="numeric">{money(invoice.totalAmount)}</td><td><Badge variant={invoice.balanceAmount > 0 ? "warning" : "success"}>{invoice.balanceAmount > 0 ? `Due ${money(invoice.balanceAmount)}` : "Paid"}</Badge></td></tr>)}</tbody></Table> : <DataUnavailable compact title={invoiceSearch ? "No matching invoice" : "No invoices yet"} description={invoiceSearch ? "Try an invoice number, customer name, or mobile number." : "Saved retail bills are the invoice register."} />}</Card>
  </section>;
}
