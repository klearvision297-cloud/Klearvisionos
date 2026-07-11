import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import CustomerBasicInfo from "./CustomerBasicInfo";
import CustomerContact from "./CustomerContact";
import CustomerAddress from "./CustomerAddress";
import CustomerRemarks from "./CustomerRemarks";
import CustomerOtherInfo from "./CustomerOtherInfo";
import { Button, Modal } from "../../../../../components/ui";

import type {
  Customer,
  CreateCustomerDTO,
} from "../../../../../types/customer";

type CustomerModalProps = {
  open: boolean;
  mode: "create" | "edit";
  customer?: Customer | null;
  onClose: () => void;
  onSave: (
    customer: CreateCustomerDTO
  ) => Promise<void>;
};

const emptyCustomer: CreateCustomerDTO = {
  name: "",
  mobile: "",
  whatsapp: "",
  email: "",
  gender: "",
  dateOfBirth: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  reference: "",
  eyeTestDone: false,
  remarks: "",
};

export default function CustomerModal({
  open,
  mode,
  customer,
  onClose,
  onSave,
}: CustomerModalProps) {
  const [form, setForm] =
    useState<CreateCustomerDTO>(emptyCustomer);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && customer) {
      setForm({
        name: customer.name,
        mobile: customer.mobile,
        whatsapp: customer.whatsapp ?? "",
        email: customer.email ?? "",
        gender: customer.gender ?? "",
        dateOfBirth:
          customer.dateOfBirth ?? "",
        address: customer.address ?? "",
        city: customer.city ?? "",
        state: customer.state ?? "",
        pincode: customer.pincode ?? "",
        reference:
          customer.reference ?? "",
        eyeTestDone:
          customer.eyeTestDone === 1,
        remarks: customer.remarks ?? "",
      });
    } else {
      setForm(emptyCustomer);
    }
  }, [open, mode, customer]);

  if (!open) return null;

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error(
        "Customer name is required."
      );
      return;
    }

    if (!form.mobile.trim()) {
      toast.error(
        "Mobile number is required."
      );
      return;
    }

    try {
      await onSave(form);

      toast.success(
        mode === "create"
          ? "Customer created successfully."
          : "Customer updated successfully."
      );

      setForm(emptyCustomer);

      onClose();
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(
          "Unable to save customer."
        );
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "New Customer" : "Edit Customer"}
      description="Create or update a customer profile and contact details."
      width={760}
      closeOnBackdrop={false}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={handleSave}>{mode === "create" ? "Create Customer" : "Save Changes"}</Button></>}
    >
      <div className="customer-form">
        <CustomerBasicInfo
          form={form}
          setForm={setForm}
        />

        <CustomerContact
          form={form}
          setForm={setForm}
        />

        <CustomerAddress
          form={form}
          setForm={setForm}
        />

        <CustomerRemarks
          form={form}
          setForm={setForm}
        />

        <CustomerOtherInfo
          form={form}
          setForm={setForm}
        />
      </div>
    </Modal>
  );
}
