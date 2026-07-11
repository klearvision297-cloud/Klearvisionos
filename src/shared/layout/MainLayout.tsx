import Sidebar from "./Sidebar";
import Header from "./Header";

type MainLayoutProps = {
  children: React.ReactNode;
};

export default function MainLayout({
  children,
}: MainLayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="app-shell__content">
        <Header />

        <main className="app-shell__main">{children}</main>
      </div>
    </div>
  );
}
