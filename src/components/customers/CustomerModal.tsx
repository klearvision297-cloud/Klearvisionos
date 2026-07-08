import { useState } from "react";

type CustomerModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function CustomerModal({
  open,
  onClose,
}: CustomerModalProps) {
  const [name, setName] = useState("");

  const [mobile, setMobile] = useState("");

  const [address, setAddress] = useState("");

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="customer-modal">
        <h2>Add Customer</h2>

        <input
          placeholder="Customer Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />

        <input
          placeholder="Mobile Number"
          value={mobile}
          onChange={(e) =>
            setMobile(e.target.value)
          }
        />

        <input
          placeholder="Address"
          value={address}
          onChange={(e) =>
            setAddress(e.target.value)
          }
        />

        <div className="modal-buttons">
          <button onClick={onClose}>
            Cancel
          </button>

          <button>
            Save Customer
          </button>
        </div>
      </div>
    </div>
  );
}
