import { useEffect } from "react";

import DrawerHeader from "./DrawerHeader";
import DrawerStats from "./DrawerStats";
import DrawerTabs from "./DrawerTabs";
import DrawerBody from "./DrawerBody";

type CustomerDrawerProps = {
  open: boolean;
  onClose: () => void;
  customer?: {
    id: number;
    customerCode: string;
    name: string;
    mobile: string;
    whatsapp?: string;
    address?: string;
    totalOrders?: number;
    totalSpent?: number;
    outstanding?: number;
  } | null;
};

export default function CustomerDrawer({
  open,
  onClose,
  customer,
}: CustomerDrawerProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
      document.body.style.overflow = "auto";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="drawer-overlay"
        onClick={onClose}
      />

      <aside className="customer-drawer">
        <DrawerHeader
          customer={customer}
          onClose={onClose}
        />

        <DrawerStats customer={customer} />

        <DrawerTabs />

        <DrawerBody customer={customer} />
      </aside>
    </>
  );
}