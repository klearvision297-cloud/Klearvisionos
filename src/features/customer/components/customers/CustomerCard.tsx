import type { Customer } from "../../../../types/customer";
import { Card } from "../../../../components/ui";

type CustomerCardProps = {
  customer: Customer;
  onClick: () => void;
};

export default function CustomerCard({
  customer,
  onClick,
}: CustomerCardProps) {
  return (
    <Card
      className="customer-card"
      padded={false}
      interactive
      onClick={onClick}
    >
      <div>
        <h3>{customer.name}</h3>

        <p>{customer.mobile}</p>

        <small className="customer-card__code">
          {customer.customerCode}
        </small>
      </div>

      <div className="customer-card__summary">
        <div className="customer-card__orders">
          {customer.totalOrders} Orders
        </div>

        <div className="customer-card__spent">
          ₹{customer.totalSpent.toLocaleString()}
        </div>

        <small className="customer-card__hint">
          Click to view →
        </small>
      </div>
    </Card>
  );
}
