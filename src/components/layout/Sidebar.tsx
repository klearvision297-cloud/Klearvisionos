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

import { NavLink } from "react-router-dom";

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/",
  },
  {
    icon: Users,
    label: "Customers",
    path: "/customers",
  },
  {
    icon: Receipt,
    label: "Billing",
    path: "/billing",
  },
  {
    icon: Package,
    label: "Inventory",
    path: "/inventory",
  },
  {
    icon: ShoppingCart,
    label: "Purchases",
    path: "/purchases",
  },
  {
    icon: Wallet,
    label: "Expenses",
    path: "/expenses",
  },
  {
    icon: BarChart3,
    label: "Reports",
    path: "/reports",
  },
  {
    icon: Settings,
    label: "Settings",
    path: "/settings",
  },
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
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? "menuButton activeMenu"
                  : "menuButton"
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="version">
        Version 1.0
      </div>
    </aside>
  );
}
