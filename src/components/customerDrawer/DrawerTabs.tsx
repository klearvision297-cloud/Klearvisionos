import {
  User,
  Glasses,
  ShoppingCart,
  Wallet,
  FileText,
} from "lucide-react";

import type { DrawerTab } from "./CustomerDrawer";

type DrawerTabsProps = {
  activeTab: DrawerTab;
  onChange: (tab: DrawerTab) => void;
};

const tabs: {
  id: DrawerTab;
  label: string;
  icon: React.ElementType;
}[] = [
  {
    id: "details",
    label: "Details",
    icon: User,
  },
  {
    id: "prescriptions",
    label: "Rx",
    icon: Glasses,
  },
  {
    id: "orders",
    label: "Orders",
    icon: ShoppingCart,
  },
  {
    id: "payments",
    label: "Payments",
    icon: Wallet,
  },
  {
    id: "notes",
    label: "Notes",
    icon: FileText,
  },
];

export default function DrawerTabs({
  activeTab,
  onChange,
}: DrawerTabsProps) {
  return (
    <div
      style={{
        padding: "0 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          paddingBottom: 18,
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;

          const active =
            activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() =>
                onChange(tab.id)
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,

                padding: "10px 16px",

                borderRadius: 12,

                border: active
                  ? "none"
                  : "1px solid #E2E8F0",

                background: active
                  ? "#2563EB"
                  : "white",

                color: active
                  ? "white"
                  : "#475569",

                fontWeight: 600,

                cursor: "pointer",

                transition:
                  "all .2s ease",

                whiteSpace:
                  "nowrap",
              }}
            >
              <Icon size={16} />

              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
