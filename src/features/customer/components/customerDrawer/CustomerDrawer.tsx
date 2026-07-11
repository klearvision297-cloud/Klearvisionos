import { useEffect, useState } from "react";

import DrawerHeader from "./DrawerHeader";
import DrawerStats from "./DrawerStats";
import DrawerTabs from "./DrawerTabs";
import DrawerBody from "./DrawerBody";

import type { Customer } from "../../../../types/customer";
import type { DrawerTab } from "../../types/drawer";
import type { InvoiceRegisterRow, PaymentHistoryRow } from "../../../../types/report";

type CustomerDrawerProps = {
  open: boolean;
  loading?: boolean;
  customer: Customer | null;
  onClose: () => void;
  onEdit: () => void;
};

export default function CustomerDrawer({
  open,
  loading = false,
  customer,
  onClose,
  onEdit,
}: CustomerDrawerProps) {
  const [activeTab, setActiveTab] =
    useState<DrawerTab>("details");
  const [orders, setOrders] = useState<InvoiceRegisterRow[]>([]);
  const [payments, setPayments] = useState<PaymentHistoryRow[]>([]);

  useEffect(() => {
    if (!open || !customer) return;
    void Promise.all([
      window.report.getCustomerInvoices(customer.id),
      window.report.getCustomerPayments(customer.id),
    ]).then(([invoiceRows, paymentRows]) => {
      setOrders(invoiceRows);
      setPayments(paymentRows);
    }).catch(() => {
      setOrders([]);
      setPayments([]);
    });
  }, [customer, open]);

  useEffect(() => {
    if (!open) return;

    setActiveTab("details");
  }, [open]);

  useEffect(() => {
    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      document.addEventListener(
        "keydown",
        handleEscape
      );

      document.body.style.overflow =
        "hidden";
    }

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );

      document.body.style.overflow =
        "auto";
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
          onEdit={onEdit}
        />

        <DrawerStats customer={customer} />

        <DrawerTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <DrawerBody
          activeTab={activeTab}
          customer={customer}
          loading={loading}
          orders={orders}
          payments={payments}
        />
      </aside>
    </>
  );
}
