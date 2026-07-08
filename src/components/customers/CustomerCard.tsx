type CustomerCardProps = {
  name: string;
  mobile: string;
  balance: number;
};

export default function CustomerCard({
  name,
  mobile,
  balance,
}: CustomerCardProps) {
  return (
    <div className="customer-card">
      <div>
        <h3>{name}</h3>

        <p>{mobile}</p>
      </div>

      <div
        style={{
          color: balance > 0 ? "#DC2626" : "#16A34A",
          fontWeight: 700,
        }}
      >
        {balance > 0
          ? `₹${balance}`
          : "Paid"}
      </div>
    </div>
  );
}