import {
  LayoutDashboard,
  Users,
  Receipt,
  Package,
  ShoppingCart,
  Wallet,
  BarChart3,
  Settings,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Users, label: "Customers" },
  { icon: Receipt, label: "Billing" },
  { icon: Package, label: "Inventory" },
  { icon: ShoppingCart, label: "Purchases" },
  { icon: Wallet, label: "Expenses" },
  { icon: BarChart3, label: "Reports" },
  { icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">
        👓
        <div>
          <h2>Klear Vision</h2>
          <span>Optical ERP</span>
        </div>
      </div>

      <nav>
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button key={item.label} className="menuButton">
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="version">
        Version 1.0
      </div>
    </aside>
  );
}