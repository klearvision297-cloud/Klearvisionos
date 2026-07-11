import {
  ShoppingBag,
  IndianRupee,
  Wallet,
  Clock3,
} from "lucide-react";

type DrawerStatsProps = {
  customer?: {
    totalOrders?: number;
    totalSpent?: number;
    outstanding?: number;
    lastVisit?: string;
  } | null;
};

export default function DrawerStats({
  customer,
}: DrawerStatsProps) {
  const stats = [
    {
      title: "Orders",
      value: customer?.totalOrders ?? 0,
      icon: <ShoppingBag size={18} />,
      color: "#2563EB",
      background: "#DBEAFE",
    },
    {
      title: "Total Spent",
      value: `₹${(
        customer?.totalSpent ?? 0
      ).toLocaleString()}`,
      icon: <IndianRupee size={18} />,
      color: "#16A34A",
      background: "#DCFCE7",
    },
    {
      title: "Outstanding",
      value: `₹${(
        customer?.outstanding ?? 0
      ).toLocaleString()}`,
      icon: <Wallet size={18} />,
      color: "#DC2626",
      background: "#FEE2E2",
    },
    {
      title: "Last Visit",
      value:
        customer?.lastVisit ??
        "No Orders",
      icon: <Clock3 size={18} />,
      color: "#F59E0B",
      background: "#FEF3C7",
    },
  ];

  return (
    <div
      style={{
        padding: "24px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px",
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.title}
            style={{
              background: "white",
              border: "1px solid #E2E8F0",
              borderRadius: 18,
              padding: 18,
              transition: ".25s",
              cursor: "pointer",
              boxShadow:
                "0 2px 10px rgba(0,0,0,.04)",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: stat.background,
                color: stat.color,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              {stat.icon}
            </div>

            <div
              style={{
                fontSize: 13,
                color: "#64748B",
                marginBottom: 6,
              }}
            >
              {stat.title}
            </div>

            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#0F172A",
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}