import type { Dispatch, SetStateAction } from "react";
import { Focus, PackageSearch, Plus } from "lucide-react";
import { Button, Card, EmptyState, Table } from "../../../components/ui";
import type { Inventory } from "../../../types/inventory";
import type { BillingItem } from "../types/billing";
import BillingRow from "./BillingRow";
import ProductSearch from "./ProductSearch";

type ProductTableProps = {
  items: BillingItem[];
  setItems: Dispatch<SetStateAction<BillingItem[]>>;
  workflowType: "RETAIL" | "PRESCRIPTION" | "REPAIR";
};

export default function ProductTable({
  items,
  setItems,
  workflowType,
}: ProductTableProps) {
  const frame = items.find((row) => row.item.itemType === "Frame");
  const frameAvailability = frame
    ? Math.max(0, frame.item.currentStock - frame.item.reservedStock)
    : 0;

  function focusProductSearch() {
    document
      .querySelector<HTMLInputElement>(".billing-product-search input")
      ?.focus();
  }

  function addProduct(product: Inventory) {
    setItems((currentItems) => {
      const existing = currentItems.find((row) => row.item.id === product.id);
      if (existing) {
        return currentItems.map((row) =>
          row.item.id === product.id
            ? { ...row, quantity: row.quantity + 1 }
            : row,
        );
      }

      return [...currentItems, { item: product, quantity: 1 }];
    });

    window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLInputElement>(
          `[data-billing-quantity-id="${product.id}"]`,
        )
        ?.focus();
    });
  }

  function updateQuantity(id: number, quantity: number) {
    if (quantity < 1) return;
    setItems((currentItems) =>
      currentItems.map((row) =>
        row.item.id === id ? { ...row, quantity } : row,
      ),
    );
  }

  function removeItem(id: number) {
    setItems((currentItems) =>
      currentItems.filter((row) => row.item.id !== id),
    );
  }

  const title =
    workflowType === "PRESCRIPTION" ? "Frame & bill items" : "Bill items";

  return (
    <Card className="billing-card billing-product-card">
      <div className="billing-card__header">
        <div>
          <p className="billing-card__eyebrow">
            {workflowType === "PRESCRIPTION"
              ? "Frame selection"
              : "Product selection"}
          </p>
          <h2>
            {title} <span>{items.length}</span>
          </h2>
        </div>
        <div className="billing-product-card__actions">
          {workflowType === "PRESCRIPTION" ? (
            <span
              className={`billing-frame-status ${frame ? "is-selected" : ""}`}
            >
              {frame
                ? `${frameAvailability} frame(s) available`
                : "Frame required"}
            </span>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            onClick={focusProductSearch}
            title="Focus product search"
          >
            <Focus size={15} /> Find
          </Button>
          <Button size="sm" onClick={focusProductSearch}>
            <Plus size={16} /> Add item
          </Button>
        </div>
      </div>

      <ProductSearch onSelect={addProduct} />

      <div className="billing-table">
        {items.length === 0 ? (
          <EmptyState
            icon={<PackageSearch size={22} />}
            title={
              workflowType === "PRESCRIPTION"
                ? "Choose a frame to start the optical job"
                : "No items added"
            }
            description="Search by barcode, item code, brand, or model. Use the arrow keys and Enter to add a match."
          />
        ) : (
          <Table compact>
            <thead>
              <tr>
                <th>Item</th>
                <th>Product & availability</th>
                <th>Price</th>
                <th>Qty</th>
                <th>GST</th>
                <th>Total</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <BillingRow
                  key={row.item.id}
                  item={row.item}
                  quantity={row.quantity}
                  onQuantityChange={(quantity) =>
                    updateQuantity(row.item.id, quantity)
                  }
                  onRemove={() => removeItem(row.item.id)}
                />
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </Card>
  );
}
