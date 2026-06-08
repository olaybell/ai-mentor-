import { AdminDashboardLayout } from "../components/AdminDashboardLayout";
import { BookingPublisherPanel } from "../components/admin/BookingPublisherPanel";

export function BusinessBookingPagesPage() {
  return (
    <AdminDashboardLayout title="Booking Pages">
      <BookingPublisherPanel />
    </AdminDashboardLayout>
  );
}
