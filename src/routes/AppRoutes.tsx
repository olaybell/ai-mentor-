import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthPage } from "../pages/AuthPage";
import { BusinessBookingPagesPage } from "../pages/BusinessBookingPagesPage";
import { BusinessCalendarPage } from "../pages/BusinessCalendarPage";
import { BusinessDashboardPage } from "../pages/BusinessDashboardPage";
import { BusinessResourcesPage } from "../pages/BusinessResourcesPage";
import { BusinessSettingsPage } from "../pages/BusinessSettingsPage";
import { BusinessStaffPage } from "../pages/BusinessStaffPage";
import { ClientBookingPortal } from "../pages/ClientBookingPortal";
import { CustomerDashboardPage } from "../pages/CustomerDashboardPage";
import { HomePage } from "../pages/HomePage";
import { PublicBookingPage } from "../pages/PublicBookingPage";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/book" element={<ClientBookingPortal />} />
        <Route path="/book/:slug" element={<PublicBookingPage />} />
        <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
        <Route path="/dashboard" element={<BusinessDashboardPage />} />
        <Route path="/dashboard/booking-pages" element={<BusinessBookingPagesPage />} />
        <Route path="/dashboard/calendar" element={<BusinessCalendarPage />} />
        <Route path="/dashboard/resources" element={<BusinessResourcesPage />} />
        <Route path="/dashboard/staff" element={<BusinessStaffPage />} />
        <Route path="/dashboard/settings" element={<BusinessSettingsPage />} />
        <Route path="/signin" element={<AuthPage mode="signin" />} />
        <Route path="/login" element={<Navigate to="/signin" replace />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
        <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
