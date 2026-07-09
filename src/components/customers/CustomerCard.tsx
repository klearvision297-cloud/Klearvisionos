import type { Customer } from "../../types/customer";

type CustomerCardProps = {
  customer: Customer;
  onClick: () => void;
};

export default function CustomerCard({
  customer,
  onClick,
}: CustomerCardProps) {
  return (
    <div
      className="customer-card"
      onClick={onClick}
    >
      <div>
        <h3>{customer.name}</h3>

        <p>{customer.mobile}</p>

        <small
          style={{
            color: "#64748B",
            fontWeight: 600,
          }}
        >
          {customer.customerCode}
        </small>
      </div>

      <div
        style={{
          textAlign: "right",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          style={{
            color: "#2563EB",
            fontWeight: 700,
          }}
        >
          {customer.totalOrders} Orders
        </div>

        <div
          style={{
            color: "#16A34A",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ₹{customer.totalSpent.toLocaleString()}
        </div>

        <small
          style={{
            color: "#94A3B8",
          }}
        >
          Click to view →
        </small>
      </div>
    </div>
  );
}