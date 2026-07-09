import type { Dispatch, SetStateAction } from "react";
import type { CreateCustomerDTO } from "../../../types/customer";

type Props = {
  form: CreateCustomerDTO;
  setForm: Dispatch<
    SetStateAction<CreateCustomerDTO>
  >;
};

export default function CustomerAddress({
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
        Address Information
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
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
            Address
          </label>

          <textarea
            placeholder="House No., Street, Area..."
            rows={3}
            value={form.address ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                address: e.target.value,
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, 1fr)",
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
              City
            </label>

            <input
              type="text"
              placeholder="Kanpur"
              value={form.city ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  city: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              State
            </label>

            <input
              type="text"
              placeholder="Uttar Pradesh"
              value={form.state ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  state: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              PIN Code
            </label>

            <input
              type="text"
              placeholder="208025"
              maxLength={6}
              value={form.pincode ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  pincode: e.target.value.replace(
                    /\D/g,
                    ""
                  ),
                }))
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}
