import Sidebar from "./Sidebar";
import Header from "./Header";

type MainLayoutProps = {
  children: React.ReactNode;
};

export default function MainLayout({
  children,
}: MainLayoutProps) {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#F8FAFC",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header />

        <main
          style={{
            flex: 1,
            padding: 30,
            overflow: "auto",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
