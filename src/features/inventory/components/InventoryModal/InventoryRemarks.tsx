import type { CreateInventoryDTO } from "../../../../types/inventory";

type Props = {
  form: CreateInventoryDTO;
  setForm: React.Dispatch<
    React.SetStateAction<CreateInventoryDTO>
  >;
};

export default function InventoryRemarks({
  form,
  setForm,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div>
        <label>Internal Notes</label>

        <textarea
          rows={8}
          value={form.remarks}
          onChange={(e) =>
            setForm({
              ...form,
              remarks: e.target.value,
            })
          }
          placeholder="Example:
• Purchased from Titan distributor
• Premium display piece
• Keep separate from regular stock
• Warranty applicable
• Special fitting instructions"
          style={{
            width: "100%",
            resize: "vertical",
            minHeight: 180,
          }}
        />
      </div>

      <div
        style={{
          padding: 18,
          borderRadius: 12,
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
        }}
      >
        <h4
          style={{
            marginBottom: 12,
            color: "#0F172A",
          }}
        >
          Notes
        </h4>

        <ul
          style={{
            margin: 0,
            paddingLeft: 20,
            color: "#64748B",
            lineHeight: 1.8,
          }}
        >
          <li>These notes are for internal use only.</li>
          <li>They will not appear on customer invoices.</li>
          <li>Useful for warranty, purchase history and staff instructions.</li>
          <li>You can edit these notes at any time.</li>
        </ul>
      </div>
    </div>
  );
}
