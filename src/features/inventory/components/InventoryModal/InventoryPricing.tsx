import type { CreateInventoryDTO } from "../../../../types/inventory";

type Props = {
  form: CreateInventoryDTO;
  setForm: React.Dispatch<
    React.SetStateAction<CreateInventoryDTO>
  >;
};

export default function InventoryPricing({
  form,
  setForm,
}: Props) {
  const margin =
    form.sellingPrice > 0
      ? (
          ((form.sellingPrice -
            form.costPrice) /
            form.sellingPrice) *
          100
        ).toFixed(1)
      : "0.0";

  const profit =
    form.sellingPrice - form.costPrice;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 18,
      }}
    >
      <div>
        <label>Cost Price (₹)</label>

        <input
          type="number"
          value={form.costPrice}
          onChange={(e) =>
            setForm({
              ...form,
              costPrice:
                Number(e.target.value),
            })
          }
        />
      </div>

      <div>
        <label>MRP (₹)</label>

        <input
          type="number"
          value={form.mrp}
          onChange={(e) =>
            setForm({
              ...form,
              mrp: Number(
                e.target.value
              ),
            })
          }
        />
      </div>

      <div>
        <label>Selling Price (₹)</label>

        <input
          type="number"
          value={form.sellingPrice}
          onChange={(e) =>
            setForm({
              ...form,
              sellingPrice: Number(
                e.target.value
              ),
            })
          }
        />
      </div>

      <div>
        <label>GST Rate</label>

        <select
          value={form.gstRate}
          onChange={(e) =>
            setForm({
              ...form,
              gstRate: Number(
                e.target.value
              ),
            })
          }
        >
          <option value={0}>0%</option>
          <option value={5}>5%</option>
          <option value={12}>12%</option>
          <option value={18}>18%</option>
          <option value={28}>28%</option>
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
            marginBottom: 10,
          }}
        >
          <span>Profit</span>

          <strong
            style={{
              color:
                profit >= 0
                  ? "#16A34A"
                  : "#DC2626",
            }}
          >
            ₹{profit.toFixed(2)}
          </strong>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            marginBottom: 10,
          }}
        >
          <span>Margin</span>

          <strong>{margin}%</strong>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            color: "#64748B",
          }}
        >
          <span>Markup</span>

          <strong>
            {form.costPrice > 0
              ? (
                  ((form.sellingPrice -
                    form.costPrice) /
                    form.costPrice) *
                  100
                ).toFixed(1)
              : "0.0"}
            %
          </strong>
        </div>
      </div>
    </div>
  );
}
