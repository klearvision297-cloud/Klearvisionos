import { Button } from "../../../../components/ui";

type ActionButtonProps = {
  color: string;
  title: string;
};

function ActionButton({ color, title }: ActionButtonProps) {
  return (
    <Button className={`action-button action-button--${color}`}>
      {title}
    </Button>
  );
}

export default function QuickActions() {
  return (
    <div className="quick-actions">
      <h2>⚡ Quick Actions</h2>

      <div className="actions-grid">
        <ActionButton
          color="primary"
          title="🧾 New Bill"
        />

        <ActionButton
          color="success"
          title="👤 New Customer"
        />

        <ActionButton
          color="warning"
          title="📦 Purchase"
        />

        <ActionButton
          color="danger"
          title="💸 Expense"
        />
      </div>
    </div>
  );
}
