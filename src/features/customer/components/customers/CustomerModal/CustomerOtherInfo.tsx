import type { Dispatch, SetStateAction } from "react";
import type { CreateCustomerDTO } from "../../../../../types/customer";

type Props = {
  form: CreateCustomerDTO;
  setForm: Dispatch<
    SetStateAction<CreateCustomerDTO>
  >;
};

export default function CustomerOtherInfo({
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
        Other Information
      </h3>

      <textarea
        placeholder="Write any additional information about the customer..."
        rows={8}
        value={form.remarks ?? ""}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            remarks: e.target.value,
          }))
        }
        style={{
          width: "100%",
          minHeight: 180,
          padding: 16,
          border: "1px solid #CBD5E1",
          borderRadius: 12,
          resize: "vertical",
          fontSize: 15,
          fontFamily: "inherit",
          lineHeight: 1.6,
        }}
      />
    </section>
  );
}