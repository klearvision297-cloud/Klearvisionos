import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";

import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />

          <Route
            path="/customers"
            element={<Customers />}
          />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}
