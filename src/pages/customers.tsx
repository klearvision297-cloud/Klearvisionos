import CustomerCard from "../components/customers/CustomerCard";

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
  {
    name: "Neha Singh",
    mobile: "9876543212",
    balance: 350,
  },
];

export default function Customers() {
  return (
    <>
      <h1>Customers</h1>

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
    </>
  );
}
