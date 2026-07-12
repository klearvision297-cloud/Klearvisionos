import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, Input } from "../../../components/ui";
import type { BillingItem } from "../types/billing";
import type { LensSeriesOption } from "./LensSelector";
import { calculateBill } from "../utils/billingCalculator";

type TotalsProps = { items: BillingItem[]; selectedLens?: LensSeriesOption | null };

export default function Totals({ items, selectedLens }: TotalsProps) {
  const [discountMode, setDiscountMode] = useState<"amount" | "percent">(
    "amount",
  );
  const [discountValue, setDiscountValue] = useState(0);
  const summary = useMemo(() => {
    return calculateBill(items, discountMode, discountValue, "included", selectedLens ? [{ sellingPrice: selectedLens.defaultSellingPrice }] : []);
  }, [items, discountMode, discountValue, selectedLens]);

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
