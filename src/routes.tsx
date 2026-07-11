import { BrowserRouter, Routes, Route } from "react-router-dom";

import Billing from "./features/billing";
import Customers from "./features/customer";
import Dashboard from "./features/dashboard";
import InventoryPage, { StockHistoryPage } from "./features/inventory";
import OpticalJobsPage, { LabDispatchPage } from "./features/optical";
import PurchasesPage from "./features/purchase";
import InvoiceRegisterPage from "./features/invoice";
import SuppliersPage from "./features/supplier";
import CustomerDuesPage from "./features/dues";
import { MainLayout } from "./shared/layout";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/customers"
            element={<Customers />}
          />

          <Route
            path="/inventory"
            element={<InventoryPage />}
          />

          <Route
            path="/stock-history"
            element={<StockHistoryPage />}
          />

          <Route
            path="/billing"
            element={<Billing />}
          />

          <Route
            path="/suppliers"
            element={<SuppliersPage />}
          />

          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/invoices" element={<InvoiceRegisterPage />} />
          <Route path="/customer-dues" element={<CustomerDuesPage />} />
          <Route path="/optical-jobs" element={<OpticalJobsPage />} />
          <Route path="/lab-dispatch" element={<LabDispatchPage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}
