import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import type { Inventory } from "../../../types/inventory";

type Props = {
  open: boolean;
  item: Inventory | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

export default function StockAdjustmentModal({
  open,
  item,
  onClose,
  onSaved,
}: Props) {
  const [newStock, setNewStock] =
    useState(0);

  const [reason, setReason] =
    useState("Purchase");

  const [remarks, setRemarks] =
    useState("");

  useEffect(() => {
    if (item) {
      setNewStock(item.currentStock);
      setReason("Purchase");
      setRemarks("");
    }
  }, [item]);

  if (!open || item === null) return null;

  // TypeScript now knows this can never be null
  const inventory = item;

  const difference =
    newStock - inventory.currentStock;

  async function save() {
    if (newStock < 0) {
      toast.error(
        "Stock cannot be negative."
      );
      return;
    }

    if (
      newStock ===
      inventory.currentStock
    ) {
      toast.error(
        "No stock change detected."
      );
      return;
    }

    try {
      await window.inventory.adjustStock(
        inventory.id,
        newStock,
        reason,
        remarks
      );

      toast.success(
        "Stock adjusted successfully."
      );

      await onSaved();

      onClose();
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(
          "Unable to adjust stock."
        );
      }
    }
  }

  return (
    <div className="modal-overlay">
      <div
        className="customer-modal"
        style={{
          width: 550,
        }}
      >
        <h2>Adjust Stock</h2>

        <div
          style={{
            display: "grid",
            gap: 18,
            marginTop: 25,
          }}
        >
          <div>
            <label>Product</label>

            <input
              disabled
              value={`${inventory.brand ?? ""} ${
                inventory.model ?? ""
              }`}
            />
          </div>

          <div>
            <label>Item Code</label>

            <input
              disabled
              value={inventory.itemCode}
            />
          </div>

          <div>
            <label>Current Stock</label>

            <input
              disabled
              value={`${inventory.currentStock} ${inventory.unit}`}
            />
          </div>

          <div>
            <label>New Stock</label>

            <input
              type="number"
              min={0}
              value={newStock}
              onChange={(e) =>
                setNewStock(
                  Number(e.target.value)
                )
              }
            />
          </div>

          <div>
            <label>Difference</label>

            <input
              disabled
              value={
                difference > 0
                  ? `+${difference}`
                  : difference
              }
            />
          </div>

          <div>
            <label>Reason</label>

            <select
              value={reason}
              onChange={(e) =>
                setReason(
                  e.target.value
                )
              }
            >
              <option value="Purchase">
                Purchase
              </option>

              <option value="Manual Adjustment">
                Manual Adjustment
              </option>

              <option value="Damage">
                Damage
              </option>

              <option value="Return">
                Return
              </option>

              <option value="Correction">
                Correction
              </option>
            </select>
          </div>

          <div>
            <label>Remarks</label>

            <textarea
              rows={4}
              placeholder="Optional remarks..."
              value={remarks}
              onChange={(e) =>
                setRemarks(
                  e.target.value
                )
              }
            />
          </div>
        </div>

        <div
          className="modal-buttons"
          style={{
            marginTop: 30,
          }}
        >
          <button
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            onClick={save}
          >
            Save Stock
          </button>
        </div>
      </div>
    </div>
  );
}
