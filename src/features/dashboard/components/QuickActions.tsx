import type { ReactNode } from "react";
import { CreditCard, PackagePlus, UserPlus, WalletCards } from "lucide-react";
import { Button } from "../../../components/ui";

type ActionButtonProps = {
  variant: "primary" | "success" | "secondary" | "danger";
  title: string;
  icon: ReactNode;
};

function ActionButton({ variant, title, icon }: ActionButtonProps) {
  return (
    <Button variant={variant} className="action-button">
      {icon}
      {title}
    </Button>
  );
}

export default function QuickActions() {
  return (
    <section className="quick-actions">
      <div className="section-heading">
        <div>
          <p className="section-heading__eyebrow">Shortcuts</p>
          <h2>Quick actions</h2>
        </div>
      </div>

      <div className="actions-grid">
        <ActionButton variant="primary" icon={<CreditCard size={18} />} title="New Bill" />
        <ActionButton variant="success" icon={<UserPlus size={18} />} title="New Customer" />
        <ActionButton variant="secondary" icon={<PackagePlus size={18} />} title="Purchase" />
        <ActionButton variant="danger" icon={<WalletCards size={18} />} title="Expense" />
      </div>
    </section>
  );
}
