import { useMemo } from "react";
import { CreditCard, Landmark, Smartphone, Wallet } from "lucide-react";
import { Button, Card, Input } from "../../../components/ui";
import type { BillingItem } from "../types/billing";
import { calculateBill } from "../utils/billingCalculator";

type PaymentMethod = "Cash" | "UPI" | "Card" | "Bank";

type PaymentPanelProps = {
  items: BillingItem[];
  paymentMethod: string;
  setPaymentMethod: React.Dispatch<React.SetStateAction<string>>;
  received: number;
  setReceived: React.Dispatch<React.SetStateAction<number>>;
  onSave: () => void;
  isSaving: boolean;
};

const methods: {
  value: PaymentMethod;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "Cash", label: "Cash", icon: <Wallet size={16} /> },
  { value: "UPI", label: "UPI", icon: <Smartphone size={16} /> },
  { value: "Card", label: "Card", icon: <CreditCard size={16} /> },
  { value: "Bank", label: "Bank", icon: <Landmark size={16} /> },
];

export default function PaymentPanel({
  items,
  paymentMethod,
  setPaymentMethod,
  received,
  setReceived,
  onSave,
  isSaving,
}: PaymentPanelProps) {
  const summary = useMemo(
    () => calculateBill(items, "amount", 0, "included"),
    [items],
  );
  const outstanding = Math.max(0, summary.grandTotal - received);
  const change =
    received > summary.grandTotal ? received - summary.grandTotal : 0;
  const selectedMethodIndex = Math.max(
    0,
    methods.findIndex((method) => method.value === paymentMethod),
  );

  function handlePaymentMethodKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex =
      (selectedMethodIndex + direction + methods.length) % methods.length;
    const nextMethod = methods[nextIndex];
    setPaymentMethod(nextMethod.value);
    const methodButtons =
      event.currentTarget.querySelectorAll<HTMLButtonElement>("button");
    methodButtons[nextIndex]?.focus();
  }

  return (
    <Card className="billing-card billing-payment">
      <div className="billing-payment__heading">
        <div>
          <p>Collection</p>
          <h2>Payment</h2>
        </div>
        <span
          className={
            outstanding === 0 && summary.grandTotal > 0 ? "is-paid" : ""
          }
        >
          {outstanding === 0 && summary.grandTotal > 0 ? "Paid" : "Pending"}
        </span>
      </div>

      <div className="billing-payment__total">
        <div>
          <span>Amount due</span>
          <strong>₹{summary.grandTotal.toFixed(2)}</strong>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={summary.grandTotal === 0}
          onClick={() => setReceived(summary.grandTotal)}
        >
          Full amount
        </Button>
      </div>

      <Input
        label="Received"
        type="number"
        min={0}
        max={summary.grandTotal}
        value={received}
        error={received > summary.grandTotal ? "Received amount cannot exceed the invoice total." : undefined}
        onChange={(event) => setReceived(Number.isFinite(Number(event.target.value)) ? Number(event.target.value) : 0)}
        placeholder="0"
      />

      <div
        className="billing-payment__method-group"
        role="radiogroup"
        aria-label="Payment method"
        onKeyDown={handlePaymentMethodKeys}
      >
        <span className="kv-field__label">
          Method <small>Use ← →</small>
        </span>
        <div className="billing-payment-methods">
          {methods.map((method) => (
            <Button
              key={method.value}
              variant={paymentMethod === method.value ? "primary" : "secondary"}
              className="billing-payment-method"
              role="radio"
              aria-checked={paymentMethod === method.value}
              onClick={() => setPaymentMethod(method.value)}
            >
              {method.icon}
              {method.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="billing-payment__summary">
        <Row label="Received" value={`₹${received.toFixed(2)}`} />
        <Row
          label="Outstanding"
          value={`₹${outstanding.toFixed(2)}`}
          emphasis={outstanding > 0}
        />
        {change > 0 ? (
          <Row label="Change" value={`₹${change.toFixed(2)}`} />
        ) : null}
      </div>

      <Button
        size="lg"
        fullWidth
        onClick={onSave}
        disabled={isSaving}
      >
        {isSaving ? "Saving bill…" : <>Save Bill <kbd>Ctrl S</kbd></>}
      </Button>
      {items.length === 0 ? <p className="billing-payment__save-hint">Add an item before saving the bill.</p> : null}
    </Card>
  );
}

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className={`billing-summary-row ${emphasis ? "is-emphasis" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
