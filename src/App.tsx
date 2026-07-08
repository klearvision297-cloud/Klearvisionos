import Sidebar from "./components/layout/Sidebar";

export default function App() {
  return (
    <div
      style={{
        display: "flex",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          padding: 40,
        }}
      >
        <h1>Dashboard</h1>

        <p>Welcome back, Anmol 👋</p>
      </div>
    </div>
  );
}