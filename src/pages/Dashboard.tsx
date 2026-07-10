import QuickActions from "../features/customers/components/Dashboard/QuickActions";
import { PageHeader, StatCard } from "../components/ui";

export default function Dashboard() {
  return (
    <>
      <PageHeader title="Good Evening, Anmol" subtitle="Welcome back to Klear Vision OS" />

      <div className="stats-grid">
        <StatCard label="Today's Sales" value="₹0" icon="💰" />
        <StatCard label="Today's Profit" value="₹0" icon="📈" />
        <StatCard label="Pending Orders" value="0" icon="👓" />
        <StatCard label="Low Stock" value="0" icon="⚠" />
      </div>

      <QuickActions />
    </>
  );
}
