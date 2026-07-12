import {
  MapPin,
  Phone,
  MessageCircle,
  Calendar,
  UserCircle,
  Mail,
  FileText,
} from "lucide-react";

import type { Customer } from "../../../../types/customer";
import type { DrawerTab } from "../../types/drawer";
import type { InvoiceRegisterRow, PaymentHistoryRow } from "../../../../types/report";

type DrawerBodyProps = {
  activeTab: DrawerTab;
  loading: boolean;
  customer: Customer | null;
  orders: InvoiceRegisterRow[];
  payments: PaymentHistoryRow[];
};

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        padding: "14px 0",
        borderBottom: "1px solid #F1F5F9",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "#EFF6FF",
          color: "#2563EB",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            color: "#64748B",
            marginBottom: 4,
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontWeight: 600,
            color: "#0F172A",
            wordBreak: "break-word",
          }}
        >
          {value && value.trim() !== ""
            ? value
            : "Not Available"}
        </div>
      </div>
    </div>
  );
}

export default function DrawerBody({
  activeTab,
  loading,
  customer,
  orders,
  payments,
}: DrawerBodyProps) {
  if (loading) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#64748B",
          fontSize: 16,
        }}
      >
        Loading customer...
      </div>
    );
  }

  if (!customer) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#64748B",
          fontSize: 16,
        }}
      >
        No customer selected.
      </div>
    );
  }

  switch (activeTab) {
    case "details":
      return (
        <div
          style={{
            padding: 24,
            overflowY: "auto",
            flex: 1,
          }}
        >
          <DetailRow
            icon={<Phone size={18} />}
            label="Mobile"
            value={customer.mobile}
          />

          <DetailRow
            icon={<MessageCircle size={18} />}
            label="WhatsApp"
            value={customer.whatsapp}
          />

          <DetailRow
            icon={<Mail size={18} />}
            label="Email"
            value={customer.email}
          />

          <DetailRow
            icon={<UserCircle size={18} />}
            label="Gender"
            value={customer.gender}
          />

          <DetailRow
            icon={<Calendar size={18} />}
            label="Date of Birth"
            value={customer.dateOfBirth}
          />

          <DetailRow
            icon={<MapPin size={18} />}
            label="Address"
            value={customer.address}
          />

          <DetailRow
            icon={<MapPin size={18} />}
            label="City"
            value={customer.city}
          />

          <DetailRow
            icon={<MapPin size={18} />}
            label="State"
            value={customer.state}
          />

          <DetailRow
            icon={<MapPin size={18} />}
            label="Pincode"
            value={customer.pincode}
          />

          <DetailRow
            icon={<FileText size={18} />}
            label="Remarks"
            value={customer.remarks}
          />
        </div>
      );

    case "prescriptions":
      return (
        <div
          style={{
            padding: 30,
            textAlign: "center",
            color: "#64748B",
          }}
        >
          <h3>No Prescriptions Yet</h3>

          <p
            style={{
              marginTop: 12,
            }}
          >
            This module will be added in
            Pack 1.6.
          </p>
        </div>
      );

    case "orders":
      return (
        <HistoryList
          emptyTitle="No Orders Yet"
          emptyText="Retail invoices for this customer will appear here."
          rows={orders.map((order) => ({
            title: order.orderNumber,
            detail: [new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(order.orderDate)), order.paymentStatus, order.lensSeries ? `Lens: ${order.lensSeries}` : null].filter(Boolean).join(" · "),
            amount: `₹${order.totalAmount.toFixed(2)}`,
          }))}
        />
      );

    case "payments":
      return (
        <HistoryList
          emptyTitle="No Payments Yet"
          emptyText="Payments received for this customer's retail invoices will appear here."
          rows={payments.map((payment) => ({
            title: payment.paymentNumber,
            detail: `${payment.orderNumber} · ${payment.paymentMethod}`,
            amount: `₹${payment.amount.toFixed(2)}`,
          }))}
        />
      );

    case "notes":
      return (
        <div
          style={{
            padding: 30,
          }}
        >
          <textarea
            placeholder="Customer notes..."
            style={{
              width: "100%",
              minHeight: 220,
              border: "1px solid #CBD5E1",
              borderRadius: 12,
              padding: 16,
              resize: "vertical",
              fontFamily: "inherit",
              fontSize: 15,
            }}
          />
        </div>
      );

    default:
      return null;
  }
}

function HistoryList({
  emptyTitle,
  emptyText,
  rows,
}: {
  emptyTitle: string;
  emptyText: string;
  rows: { title: string; detail: string; amount: string }[];
}) {
  if (!rows.length) {
    return <div style={{ padding: 30, textAlign: "center", color: "#64748B" }}><h3>{emptyTitle}</h3><p style={{ marginTop: 12 }}>{emptyText}</p></div>;
  }

  return <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>{rows.map((row) => <div key={row.title} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "14px 0", borderBottom: "1px solid #F1F5F9" }}><div><strong>{row.title}</strong><small style={{ display: "block", marginTop: 4, color: "#64748B" }}>{row.detail}</small></div><strong>{row.amount}</strong></div>)}</div>;
}
