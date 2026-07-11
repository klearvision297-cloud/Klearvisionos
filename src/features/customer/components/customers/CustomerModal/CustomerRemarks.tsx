import type { Dispatch, SetStateAction } from "react";
import type { CreateCustomerDTO } from "../../../../../types/customer";

type Props = {
  form: CreateCustomerDTO;
  setForm: Dispatch<
    SetStateAction<CreateCustomerDTO>
  >;
};

export default function CustomerRemarks({
  form,
  setForm,
}: Props) {
  return (
    <section
      style={{
        marginBottom: 28,
      }}
    >
      <h3
        style={{
          marginBottom: 16,
          color: "#0F172A",
          borderBottom: "1px solid #E2E8F0",
          paddingBottom: 8,
        }}
      >
        Additional Information
      </h3>

      <div
        style={{
          display: "grid",
          gap: 16,
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            Reference
          </label>

          <input
            type="text"
            placeholder="Doctor, Friend, Facebook..."
            value={form.reference ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                reference: e.target.value,
              }))
            }
          />
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            padding: "12px 0",
            fontWeight: 600,
          }}
        >
          <input
            type="checkbox"
            checked={form.eyeTestDone ?? false}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                eyeTestDone: e.target.checked,
              }))
            }
            style={{
              width: 18,
              height: 18,
            }}
          />

          Eye Test Completed
        </label>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            Remarks
          </label>

          <textarea
            placeholder="Enter any notes about this customer..."
            rows={5}
            value={form.remarks ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                remarks: e.target.value,
              }))
            }
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 10,
              border: "1px solid #CBD5E1",
              resize: "vertical",
              fontFamily: "inherit",
              fontSize: 14,
            }}
          />
        </div>
      </div>
    </section>
  );
}
