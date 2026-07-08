type ActionButtonProps = {
  color: string;
  title: string;
};

function ActionButton({ color, title }: ActionButtonProps) {
  return (
    <button
      className="action-button"
      style={{
        background: color,
      }}
    >
      {title}
    </button>
  );
}

export default function QuickActions() {
  return (
    <div className="quick-actions">
      <h2>⚡ Quick Actions</h2>

      <div className="actions-grid">
        <ActionButton
          color="#2563EB"
          title="🧾 New Bill"
        />

        <ActionButton
          color="#16A34A"
          title="👤 New Customer"
        />

        <ActionButton
          color="#CA8A04"
          title="📦 Purchase"
        />

        <ActionButton
          color="#DC2626"
          title="💸 Expense"
        />
      </div>
    </div>
  );
}