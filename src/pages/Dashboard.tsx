import StatCard from "../components/dashboard/StatCard";

export default function Dashboard() {
  return (
    <>
      <h1>Good Evening, Anmol 👋</h1>

      <p className="dashboard-subtitle">
        Welcome back to Klear Vision OS
      </p>

      <div className="stats-grid">
        <StatCard
          title="Today's Sales"
          value="₹0"
          icon="💰"
        />

        <StatCard
          title="Today's Profit"
          value="₹0"
          icon="📈"
        />

        <StatCard
          title="Pending Orders"
          value="0"
          icon="👓"
        />

        <StatCard
          title="Low Stock"
          value="0"
          icon="⚠"
        />
      </div>
    </>
  );
}