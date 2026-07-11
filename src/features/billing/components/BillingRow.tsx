import { Minus, Plus, Trash2 } from "lucide-react";
import { Button, Input } from "../../../components/ui";
import type { Inventory } from "../../../types/inventory";

type BillingRowProps = {
  item: Inventory;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
};

function availableStock(item: Inventory) {
  return Math.max(0, item.currentStock - item.reservedStock);
}

export default function BillingRow({
  item,
  quantity,
  onQuantityChange,
  onRemove,
}: BillingRowProps) {
  const total = item.sellingPrice * quantity;
  const available = availableStock(item);
  const hasStockWarning = available < quantity;
  const productName =
    `${item.brand ?? ""} ${item.model ?? ""}`.trim() || item.itemCode;
  const metadata = [item.color, item.size, item.category]
    .filter(Boolean)
    .join(" · ");

  return (
    <tr className={hasStockWarning ? "is-stock-warning" : undefined}>
      <td>
        <code>{item.itemCode}</code>
      </td>
      <td>
        <div className="billing-row__product">
          <strong>{productName}</strong>
          <small>{metadata || item.itemType}</small>
          <span className={hasStockWarning ? "is-warning" : ""}>
            {available} available
            {item.reservedStock > 0 ? ` · ${item.reservedStock} reserved` : ""}
          </span>
        </div>
      </td>
      <td className="billing-row__number">₹{item.sellingPrice.toFixed(2)}</td>
      <td>
        <div className="billing-row__quantity-control">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Decrease quantity for ${item.itemCode}`}
            disabled={quantity <= 1}
            onClick={() => onQuantityChange(quantity - 1)}
          >
            <Minus size={14} />
          </Button>
          <Input
            aria-label={`Quantity for ${item.itemCode}`}
            className="billing-row__quantity"
            data-billing-quantity-id={item.id}
            type="number"
            min={1}
            max={available}
            value={quantity}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => onQuantityChange(Number(event.target.value))}
          />
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Increase quantity for ${item.itemCode}`}
            disabled={quantity >= available}
            onClick={() => onQuantityChange(quantity + 1)}
          >
            <Plus size={14} />
          </Button>
        </div>
      </td>
      <td className="billing-row__number">{item.gstRate}%</td>
      <td className="billing-row__number">
        <strong>₹{total.toFixed(2)}</strong>
      </td>
      <td>
        <Button
          variant="ghost"
          size="sm"
          className="billing-row__remove"
          aria-label={`Remove ${item.itemCode}`}
          onClick={onRemove}
        >
          <Trash2 size={16} />
        </Button>
      </td>
    </tr>
  );
}
