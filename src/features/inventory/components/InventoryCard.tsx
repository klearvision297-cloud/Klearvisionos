import { Boxes, IndianRupee, Package, Plus, TrendingUp } from "lucide-react";
import type { Inventory } from "../../../types/inventory";
import { Button, Card } from "../../../components/ui";

type InventoryCardProps = { item: Inventory; onClick: () => void; onAdjustStock: () => void };

export default function InventoryCard({ item, onClick, onAdjustStock }: InventoryCardProps) {
  const profit = item.sellingPrice - item.costPrice;
  const lowStock = item.currentStock <= item.minimumStock;

  return (
    <Card className="kv-inventory-card" interactive onClick={onClick}>
      <div className="kv-inventory-card__main">
        <div className="kv-inventory-card__product">
          <div className="kv-inventory-card__icon"><Package size={28} /></div>
          <div>
            <h3 className="kv-inventory-card__title">{item.brand} {item.model}</h3>
            <div className="kv-inventory-card__meta">{item.itemType}<span>•</span>{item.category}</div>
            <small className="kv-inventory-card__code">{item.itemCode}</small>
          </div>
        </div>
        <div className="kv-inventory-card__metrics">
          <div className="kv-inventory-card__metric"><span className="kv-inventory-card__metric-label"><Boxes size={15} /> Stock</span><strong className={lowStock ? "is-danger" : "is-success"}>{item.currentStock}</strong></div>
          <div className="kv-inventory-card__metric"><span className="kv-inventory-card__metric-label"><IndianRupee size={15} /> Sell</span><strong>₹{item.sellingPrice.toFixed(2)}</strong></div>
          <div className="kv-inventory-card__metric"><span className="kv-inventory-card__metric-label"><TrendingUp size={15} /> Profit</span><strong className={profit >= 0 ? "is-success" : "is-danger"}>₹{profit.toFixed(2)}</strong></div>
        </div>
      </div>
      <div className="kv-inventory-card__footer"><Button onClick={(event) => { event.stopPropagation(); onAdjustStock(); }}><Plus size={16} /> Adjust Stock</Button></div>
    </Card>
  );
}
