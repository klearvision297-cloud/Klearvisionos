import type { Dispatch, SetStateAction } from "react";
import type { CreateCustomerDTO } from "../../../types/customer";

type Props = {
  form: CreateCustomerDTO;
  setForm: Dispatch<
    SetStateAction<CreateCustomerDTO>
  >;
};

export default function CustomerContact({
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
        Contact Information
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
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
            WhatsApp Number
          </label>

          <input
            type="tel"
            placeholder="9876543210"
            maxLength={10}
            value={form.whatsapp ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                whatsapp: e.target.value.replace(/\D/g, ""),
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
            Email Address
          </label>

          <input
            type="email"
            placeholder="customer@email.com"
            value={form.email ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
          />
        </div>
      </div>
    </section>
  );
}
