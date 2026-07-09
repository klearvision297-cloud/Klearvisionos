import type { Customer } from "../../types/customer";

type CustomerCardProps = {
  customer: Customer;
};

export default function CustomerCard({
  customer,
}: CustomerCardProps) {
  return (
    <div className="customer-card">
      <div>
        <h3>{customer.name}</h3>

        <p>{customer.mobile}</p>

        <small
          style={{
            color: "#6B7280",
          }}
        >
          {customer.customerCode}
        </small>
      </div>

      <div
        style={{
          textAlign: "right",
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
          }}
        >
          ₹{customer.totalSpent}
        </div>
      </div>
    </div>
  );
}