import { useState } from "react";
import toast from "react-hot-toast";
import type { CreateCustomerDTO } from "../../types/customer";

type CustomerModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (customer: CreateCustomerDTO) => Promise<void>;
};

export default function CustomerModal({
  open,
  onClose,
  onSave,
}: CustomerModalProps) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");

  if (!open) return null;

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Customer name is required.");
      return;
    }

    if (!mobile.trim()) {
      toast.error("Mobile number is required.");
      return;
    }

    try {
      await onSave({
        name,
        mobile,
        address,
      });

      toast.success("Customer created successfully.");

      setName("");
      setMobile("");
      setAddress("");

      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Unable to save customer.");
      }
    }
  }

  return (
    <div className="modal-overlay">
      <div className="customer-modal">
        <h2>Add Customer</h2>

        <input
          placeholder="Customer Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />

        <input
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <div className="modal-buttons">
          <button onClick={onClose}>
            Cancel
          </button>

          <button onClick={handleSave}>
            Save Customer
          </button>
        </div>
      </div>
    </div>
  );
}