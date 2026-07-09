import type { Dispatch, SetStateAction } from "react";
import type { CreateCustomerDTO } from "../../../types/customer";

type Props = {
  form: CreateCustomerDTO;
  setForm: Dispatch<
    SetStateAction<CreateCustomerDTO>
  >;
};

export default function CustomerBasicInfo({
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
        Basic Information
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, 1fr)",
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
            Customer Name *
          </label>

          <input
            type="text"
            placeholder="Enter customer name"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                name: e.target.value,
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
            Mobile Number *
          </label>

          <input
            type="tel"
            placeholder="9876543210"
            maxLength={10}
            value={form.mobile}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                mobile: e.target.value.replace(
                  /\D/g,
                  ""
                ),
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
            Gender
          </label>

          <select
            value={form.gender}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                gender: e.target.value,
              }))
            }
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 10,
              border:
                "1px solid #CBD5E1",
            }}
          >
            <option value="">
              Select Gender
            </option>

            <option value="Male">
              Male
            </option>

            <option value="Female">
              Female
            </option>

            <option value="Other">
              Other
            </option>
          </select>
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            Date of Birth
          </label>

          <input
            type="date"
            value={
              form.dateOfBirth ?? ""
            }
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                dateOfBirth:
                  e.target.value,
              }))
            }
          />
        </div>
      </div>
    </section>
  );
}