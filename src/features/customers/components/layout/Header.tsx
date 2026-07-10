import dayjs from "dayjs";

export default function Header() {
  return (
    <header
      style={{
        height: 70,
        background: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 30px",
        borderBottom: "1px solid #E5E7EB",
      }}
    >
      <div>
        <h2>Dashboard</h2>

        <small style={{ color: "#64748B" }}>
          {dayjs().format("dddd, DD MMMM YYYY")}
        </small>
      </div>

      <div
        style={{
          display: "flex",
          gap: 20,
          alignItems: "center",
        }}
      >
        <span>🔔</span>

        <span>🌙</span>

        <strong>Anmol</strong>
      </div>
    </header>
  );
}