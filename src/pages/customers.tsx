import { useState } from "react";

import CustomerCard from "../components/customers/CustomerCard";
import CustomerModal from "../components/customers/CustomerModal";

const customers = [
  {
    name: "Rahul Sharma",
    mobile: "9876543210",
    balance: 1200,
  },
  {
    name: "Amit Verma",
    mobile: "9876543211",
    balance: 0,
  },
];

export default function Customers() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h1>Customers</h1>

        <button
          className="newCustomerButton"
          onClick={() => setOpen(true)}
        >
          + New Customer
        </button>
      </div>

      <input
        className="search-box"
        placeholder="Search customer..."
      />

      <div className="customer-list">
        {customers.map((customer) => (
          <CustomerCard
            key={customer.mobile}
            {...customer}
          />
        ))}
      </div>

      <CustomerModal
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
