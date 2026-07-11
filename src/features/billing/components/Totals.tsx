import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, Input } from "../../../components/ui";
import type { BillingItem } from "../types/billing";

type TotalsProps = { items: BillingItem[] };

export default function Totals({ items }: TotalsProps) {
  const [discountMode, setDiscountMode] = useState<"amount" | "percent">(
    "amount",
  );
  const [discountValue, setDiscountValue] = useState(0);
  const summary = useMemo(() => {
    const subtotal = items.reduce(
      (sum, row) => sum + row.item.sellingPrice * row.quantity,
      0,
    );
    const gst = items.reduce(
      (sum, row) =>
        sum + row.item.sellingPrice * row.quantity * (row.item.gstRate / 100),
      0,
    );
    const discount =
      discountMode === "percent"
        ? subtotal * (discountValue / 100)
        : discountValue;
    const beforeRound = subtotal + gst - discount;
    const grandTotal = Math.round(beforeRound);
    return {
      subtotal,
      gst,
      discount,
      grandTotal,
      roundOff: grandTotal - beforeRound,
    };
  }, [items, discountMode, discountValue]);

  return (
    <Card className="billing-card billing-totals">
      <details>
        <summary>
          <span>Invoice breakdown & discount</span>
          <strong>
            ₹{summary.grandTotal.toFixed(2)} <ChevronDown size={15} />
          </strong>
        </summary>
        <div className="billing-totals__details">
          <Row label="Subtotal" value={summary.subtotal} />
          <Row label="GST" value={summary.gst} />
          <div className="billing-discount">
            <span>Discount</span>
            <div>
              <select
                aria-label="Discount type"
                value={discountMode}
                onChange={(event) =>
                  setDiscountMode(event.target.value as "amount" | "percent")
                }
              >
                <option value="amount">₹</option>
                <option value="percent">%</option>
              </select>
              <Input
                aria-label="Discount value"
                type="number"
                min={0}
                value={discountValue}
                onChange={(event) =>
                  setDiscountValue(Number(event.target.value))
                }
              />
            </div>
          </div>
          <Row label="Discount" value={summary.discount} />
          <Row label="Round off" value={summary.roundOff} />
        </div>
      </details>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="billing-summary-row">
      <span>{label}</span>
      <strong>₹{value.toFixed(2)}</strong>
    </div>
  );
}
