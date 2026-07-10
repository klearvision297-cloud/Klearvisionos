import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Boxes,
  CalendarDays,
  ClipboardList,
  CreditCard,
  IndianRupee,
  PackagePlus,
  PackageSearch,
  ReceiptText,
  ShieldAlert,
  TrendingUp,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  DataUnavailable,
  PageHeader,
  StatCard,
} from "../components/ui";
import type { Inventory, StockHistoryItem } from "../types/inventory";

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function productName(item: Pick<Inventory, "brand" | "model" | "itemCode">) {
  return `${item.brand ?? ""} ${item.model ?? ""}`.trim() || item.itemCode;
}

function movementLabel(entry: StockHistoryItem) {
  const type = entry.changeType.toUpperCase();
  if (type === "BILLING") return "Bill created";
  if (type === "PURCHASE") return "Stock received";
  if (type === "SALE") return "Stock sold";
  return "Stock adjusted";
}

function movementBadge(entry: StockHistoryItem) {
  const type = entry.changeType.toUpperCase();
  if (type === "PURCHASE") return "success" as const;
  if (type === "SALE" || type === "BILLING") return "info" as const;
  return "warning" as const;
}

function formatActivityTime(value: string) {
  const date = new Date(value);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(date)
    : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(date);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [history, setHistory] = useState<StockHistoryItem[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadDashboardData() {
      const [inventoryResult, customerResult, historyResult] = await Promise.allSettled([
        window.inventory.getAll(),
        window.customer.getAll(),
        window.inventory.getStockHistory(),
      ]);

      if (inventoryResult.status === "fulfilled") setInventory(inventoryResult.value);
      if (customerResult.status === "fulfilled") setCustomerCount(customerResult.value.length);
      if (historyResult.status === "fulfilled") setHistory(historyResult.value);
    }

    void loadDashboardData();
  }, []);

  const lowStock = useMemo(
    () => inventory.filter((item) => item.currentStock <= item.minimumStock),
    [inventory],
  );
  const recentActivity = useMemo(
    () => [...history].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5),
    [history],
  );
  const dateText = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(now);

  const kpis = [
    { label: "Today's Sales", value: "—", detail: "Sales reporting pending", icon: <IndianRupee size={20} /> },
    { label: "Bills Created", value: "—", detail: "Billing feed pending", icon: <ReceiptText size={20} /> },
    { label: "Profit", value: "—", detail: "Profit reporting pending", icon: <TrendingUp size={20} /> },
    { label: "Customers", value: customerCount ?? "—", detail: customerCount === null ? "Loading customer records" : "Total customer records", icon: <Users size={20} /> },
    { label: "Outstanding Payments", value: "—", detail: "Payment aging pending", icon: <WalletCards size={20} /> },
    { label: "Inventory Worth", value: "—", detail: "Valuation reporting pending", icon: <Boxes size={20} /> },
  ];

  return (
    <section className="kv-dashboard">
      <PageHeader
        eyebrow="Command center"
        title={`${greetingFor(now.getHours())}, Anmol`}
        subtitle={dateText}
        action={<Badge variant="info"><CalendarDays size={14} /> Live workspace</Badge>}
      />

      <div className="kv-dashboard__kpis">
        {kpis.map((kpi) => <StatCard key={kpi.label} {...kpi} />)}
      </div>

      <div className="kv-dashboard__primary-grid">
        <Card className="kv-dashboard__sales-card">
          <div className="kv-dashboard__panel-heading">
            <div><p>Performance</p><h2>Weekly sales</h2></div>
            <Badge>Last 7 days</Badge>
          </div>
          <div className="kv-dashboard__chart" aria-label="Weekly sales placeholder chart">
            {[34, 58, 42, 70, 52, 80, 64].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
          </div>
          <DataUnavailable compact title="Sales analytics will appear here" description="Connect the billing summary feed to populate this chart." />
        </Card>

        <Card className="kv-dashboard__payment-card">
          <div className="kv-dashboard__panel-heading"><div><p>Collections</p><h2>Payment methods</h2></div><CreditCard size={19} /></div>
          <div className="kv-dashboard__payment-placeholder">
            <div className="kv-dashboard__donut"><span>—<small>Total</small></span></div>
            <div className="kv-dashboard__payment-legend"><span><i className="cash" />Cash <strong>—</strong></span><span><i className="card" />Card <strong>—</strong></span><span><i className="upi" />UPI <strong>—</strong></span></div>
          </div>
          <DataUnavailable compact title="No payment breakdown yet" description="Payment-method reporting needs billing data." />
        </Card>
      </div>

      <div className="kv-dashboard__work-grid">
        <Card className="kv-dashboard__quick-actions">
          <div className="kv-dashboard__panel-heading"><div><p>Shortcuts</p><h2>Quick actions</h2></div></div>
          <div className="kv-dashboard__action-list">
            <Button onClick={() => navigate("/billing")}><ReceiptText size={17} /> New bill</Button>
            <Button variant="secondary" onClick={() => navigate("/customers")}><UserPlus size={17} /> New customer</Button>
            <Button variant="secondary" onClick={() => navigate("/inventory")}><PackagePlus size={17} /> Add inventory</Button>
            <Button variant="secondary" onClick={() => navigate("/stock-history")}><ClipboardList size={17} /> Stock history</Button>
          </div>
        </Card>

        <Card className="kv-dashboard__low-stock">
          <div className="kv-dashboard__panel-heading"><div><p>Inventory control</p><h2>Low stock alerts</h2></div><Badge variant={lowStock.length ? "danger" : "success"}>{lowStock.length} alert{lowStock.length === 1 ? "" : "s"}</Badge></div>
          {lowStock.length ? <div className="kv-dashboard__alert-list">{lowStock.slice(0, 3).map((item) => <div key={item.id} className="kv-dashboard__alert-row"><span className="kv-dashboard__alert-icon"><PackageSearch size={17} /></span><div><strong>{productName(item)}</strong><small>{item.itemCode} · Minimum {item.minimumStock} {item.unit}</small></div><b>{item.currentStock} {item.unit}</b></div>)}</div> : <DataUnavailable compact title="Stock levels are healthy" description="Items below their minimum quantity will be listed here." icon={<ShieldAlert size={20} />} />}
          <Button variant="ghost" size="sm" onClick={() => navigate("/inventory")}>Review inventory <ArrowUpRight size={15} /></Button>
        </Card>
      </div>

      <div className="kv-dashboard__detail-grid">
        <Card className="kv-dashboard__activity-card">
          <div className="kv-dashboard__panel-heading"><div><p>Inventory ledger</p><h2>Recent activity</h2></div><Button variant="ghost" size="sm" onClick={() => navigate("/stock-history")}>View all <ArrowUpRight size={15} /></Button></div>
          {recentActivity.length ? <ol className="kv-dashboard__timeline">{recentActivity.map((entry) => <li key={entry.id}><span className="kv-dashboard__timeline-dot" /><div><strong>{movementLabel(entry)} · {productName(entry)}</strong><p>{entry.reason ?? entry.remarks ?? "Inventory movement recorded"}</p></div><time>{formatActivityTime(entry.createdAt)}</time><Badge variant={movementBadge(entry)}>{entry.difference > 0 ? `+${entry.difference}` : entry.difference} units</Badge></li>)}</ol> : <DataUnavailable title="No stock activity yet" description="The latest entries from Stock History will appear here." icon={<ClipboardList size={22} />} />}
        </Card>

        <div className="kv-dashboard__side-stack">
          <Card className="kv-dashboard__insights-card"><div className="kv-dashboard__panel-heading"><div><p>At a glance</p><h2>Business insights</h2></div></div><div className="kv-dashboard__insights"><div><span className="is-blue"><Boxes size={17} /></span><p><strong>{inventory.length}</strong> SKUs in catalog</p></div><div><span className={lowStock.length ? "is-amber" : "is-green"}><ShieldAlert size={17} /></span><p><strong>{lowStock.length}</strong> items need stock attention</p></div><div><span className="is-purple"><ClipboardList size={17} /></span><p><strong>{history.length}</strong> recorded stock movements</p></div></div></Card>
          <Card className="kv-dashboard__tasks-card"><div className="kv-dashboard__panel-heading"><div><p>Today</p><h2>Pending tasks</h2></div><Badge variant="warning">{lowStock.length + 1} open</Badge></div><ul className="kv-dashboard__tasks"><li><span /><div><strong>Review outstanding payments</strong><small>Awaiting payment aging integration</small></div></li>{lowStock.slice(0, 2).map((item) => <li key={item.id}><span className="is-alert" /><div><strong>Restock {productName(item)}</strong><small>{item.currentStock} {item.unit} remaining</small></div></li>)}</ul></Card>
        </div>
      </div>
    </section>
  );
}
