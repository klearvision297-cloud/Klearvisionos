import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./features/customers/components/layout/MainLayout";

import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";

import InventoryPage from "./features/inventory/pages";
import StockHistory from "./features/inventory/components/StockHistory";
import Billing from "./pages/Billing";

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
            element={<StockHistory />}
          />

          <Route
            path="/billing"
            element={<Billing />}
          />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}
