import type { CreateInventoryDTO } from "../../../../types/inventory";

type Props = {
  form: CreateInventoryDTO;
  setForm: React.Dispatch<
    React.SetStateAction<CreateInventoryDTO>
  >;
};

export default function InventoryStock({
  form,
  setForm,
}: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 18,
      }}
    >
      <div>
        <label>Opening Stock</label>

        <input
          type="number"
          min={0}
          value={form.openingStock}
          onChange={(e) =>
            setForm({
              ...form,
              openingStock: Number(
                e.target.value
              ),
            })
          }
        />
      </div>

      <div>
        <label>Minimum Stock Alert</label>

        <input
          type="number"
          min={0}
          value={form.minimumStock}
          onChange={(e) =>
            setForm({
              ...form,
              minimumStock: Number(
                e.target.value
              ),
            })
          }
        />
      </div>

      <div>
        <label>Unit</label>

        <select
          value={form.unit}
          onChange={(e) =>
            setForm({
              ...form,
              unit: e.target.value,
            })
          }
        >
          <option value="PCS">PCS</option>
          <option value="PAIR">PAIR</option>
          <option value="BOX">BOX</option>
          <option value="BOTTLE">
            BOTTLE
          </option>
          <option value="PACK">
            PACK
          </option>
          <option value="SET">SET</option>
        </select>
      </div>

      <div>
        <label>Status</label>

        <select
          value={
            form.isActive
              ? "active"
              : "inactive"
          }
          onChange={(e) =>
            setForm({
              ...form,
              isActive:
                e.target.value ===
                "active",
            })
          }
        >
          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>
        </select>
      </div>

      <div
        style={{
          gridColumn: "1 / 3",
          marginTop: 20,
          padding: 18,
          borderRadius: 12,
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            marginBottom: 12,
          }}
        >
          <span>Current Stock</span>

          <strong>
            {form.openingStock} {form.unit}
          </strong>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            marginBottom: 12,
          }}
        >
          <span>Low Stock Alert</span>

          <strong
            style={{
              color:
                form.openingStock <=
                form.minimumStock
                  ? "#DC2626"
                  : "#16A34A",
            }}
          >
            {form.openingStock <=
            form.minimumStock
              ? "YES"
              : "NO"}
          </strong>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            color: "#64748B",
          }}
        >
          <span>Inventory Status</span>

          <strong>
            {form.isActive
              ? "Available"
              : "Inactive"}
          </strong>
        </div>
      </div>
    </div>
  );
}
