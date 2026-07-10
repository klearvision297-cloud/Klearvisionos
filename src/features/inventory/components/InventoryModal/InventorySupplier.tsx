import type { CreateInventoryDTO } from "../../../../types/inventory";

type Props = {
  form: CreateInventoryDTO;
  setForm: React.Dispatch<
    React.SetStateAction<CreateInventoryDTO>
  >;
};

export default function InventorySupplier({
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
        <label>Supplier</label>

        <select
          value={form.supplierId ?? ""}
          onChange={(e) =>
            setForm({
              ...form,
              supplierId: e.target.value
                ? Number(e.target.value)
                : undefined,
            })
          }
        >
          <option value="">
            Select Supplier
          </option>

          {/* Dynamic suppliers will be loaded here */}
        </select>
      </div>

      <div>
        <label>HSN / SAC Code</label>

        <input
          value={form.hsnCode}
          onChange={(e) =>
            setForm({
              ...form,
              hsnCode: e.target.value,
            })
          }
          placeholder="9003"
        />
      </div>

      <div
        style={{
          gridColumn: "1 / 3",
        }}
      >
        <label>Remarks</label>

        <textarea
          rows={5}
          value={form.remarks}
          onChange={(e) =>
            setForm({
              ...form,
              remarks: e.target.value,
            })
          }
          placeholder="Internal notes about this item..."
        />
      </div>

      <div
        style={{
          gridColumn: "1 / 3",
          padding: 18,
          marginTop: 10,
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
          <span>Supplier</span>

          <strong>
            {form.supplierId
              ? `#${form.supplierId}`
              : "Not Selected"}
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
          <span>HSN / SAC</span>

          <strong>
            {form.hsnCode || "--"}
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
          <span>Purchase Ready</span>

          <strong
            style={{
              color: form.supplierId
                ? "#16A34A"
                : "#DC2626",
            }}
          >
            {form.supplierId
              ? "YES"
              : "NO"}
          </strong>
        </div>
      </div>
    </div>
  );
}
