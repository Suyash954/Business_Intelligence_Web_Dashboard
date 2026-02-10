import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage.jsx";
import { DashboardOverviewPage } from "./pages/DashboardOverviewPage.jsx";
import { SalesPerformancePage } from "./pages/SalesPerformancePage.jsx";
import { GrowthForecastPage } from "./pages/GrowthForecastPage.jsx";
import { DetailAnalysisPage } from "./pages/DetailAnalysisPage.jsx";
import { UnauthorizedPage } from "./pages/UnauthorizedPage.jsx";
import { DashboardLayout } from "./components/layout/DashboardLayout.jsx";
import { ProtectedRoute } from "./components/layout/ProtectedRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={["CEO", "SalesManager", "Analyst"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardOverviewPage />} />
        <Route
          path="sales-performance"
          element={
            <ProtectedRoute allowedRoles={["CEO", "SalesManager", "Analyst"]}>
              <SalesPerformancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="growth-forecast"
          element={
            <ProtectedRoute allowedRoles={["CEO", "SalesManager", "Analyst"]}>
              <GrowthForecastPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="details"
          element={
            <ProtectedRoute allowedRoles={["CEO", "SalesManager", "Analyst"]}>
              <DetailAnalysisPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

