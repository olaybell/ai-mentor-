import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { AdminDashboardLayout } from "../components/AdminDashboardLayout";
import { BookingPublisherPanel } from "../components/admin/BookingPublisherPanel";

type BookingStatus = "Confirmed" | "Pending" | "Needs review";

type CalendarBooking = {
  id: string;
  date: string;
  time: string;
  customer: string;
  service: string;
  resource: string;
  staff: string;
  status: BookingStatus;
};

type BookingFormState = Omit<CalendarBooking, "id" | "status"> & {
  status: BookingStatus;
};

const initialBookings: CalendarBooking[] = [
  {
    id: "booking-1",
    date: "2026-05-20",
    time: "09:00",
    customer: "Amara Cole",
    service: "Initial consultation",
    resource: "Room 1",
    staff: "Dr. Mason",
    status: "Confirmed"
  },
  {
    id: "booking-2",
    date: "2026-05-20",
    time: "10:30",
    customer: "Jon Bell",
    service: "Follow-up session",
    resource: "Room 2",
    staff: "Dr. Mason",
    status: "Needs review"
  },
  {
    id: "booking-3",
    date: "2026-05-20",
    time: "11:15",
    customer: "Sofia King",
    service: "Equipment training",
    resource: "Studio A",
    staff: "Nadia Stone",
    status: "Pending"
  },
  {
    id: "booking-4",
    date: "2026-05-21",
    time: "13:00",
    customer: "Grace Owen",
    service: "Wellness review",
    resource: "Room 3",
    staff: "Ife Clarke",
    status: "Confirmed"
  }
];

const emptyBookingForm: BookingFormState = {
  date: "2026-05-20",
  time: "09:00",
  customer: "",
  service: "",
  resource: "",
  staff: "",
  status: "Pending"
};

const timelineHours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

export function BusinessCalendarPage() {
  const [bookings, setBookings] = useState<CalendarBooking[]>(initialBookings);
  const [selectedDate, setSelectedDate] = useState("2026-05-20");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | BookingStatus>("All");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingFormState>(emptyBookingForm);

  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return bookings
      .filter((booking) => booking.date === selectedDate)
      .filter((booking) => statusFilter === "All" || booking.status === statusFilter)
      .filter((booking) => {
        if (!query) {
          return true;
        }

        return [
          booking.customer,
          booking.service,
          booking.resource,
          booking.staff,
          booking.status,
          booking.time
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((firstBooking, secondBooking) => firstBooking.time.localeCompare(secondBooking.time));
  }, [bookings, searchQuery, selectedDate, statusFilter]);

  const conflictCount = filteredBookings.filter((booking) => booking.status === "Needs review").length;

  function updateBookingForm(field: keyof BookingFormState, value: string) {
    setBookingForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function saveBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookings((currentBookings) => [
      {
        id: `booking-${Date.now()}`,
        ...bookingForm
      },
      ...currentBookings
    ]);
    setSelectedDate(bookingForm.date);
    setBookingForm(emptyBookingForm);
    setIsFormOpen(false);
  }

  function cancelBooking(bookingId: string) {
    setBookings((currentBookings) => currentBookings.filter((booking) => booking.id !== bookingId));
  }

  return (
    <AdminDashboardLayout title="Calendar">
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Calendar</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">Booking schedule</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Review appointments, spot conflicts and add new bookings for the selected day.
            </p>
          </div>
          <button type="button" className="btn-primary min-h-10 px-4 text-sm" onClick={() => setIsFormOpen(true)}>
            Add booking
          </button>
        </div>

        <div className="grid gap-4 border-b border-slate-200 p-5 lg:grid-cols-[180px_1fr_170px]">
          <label className="form-field">
            <span>Date</span>
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </label>
          <label className="form-field">
            <span>Search booking</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search customer, service, resource or staff"
            />
          </label>
          <label className="form-field">
            <span>Status</span>
            <select
              className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "All" | BookingStatus)}
            >
              <option>All</option>
              <option>Confirmed</option>
              <option>Pending</option>
              <option>Needs review</option>
            </select>
          </label>
        </div>

        {isFormOpen ? (
          <form className="border-b border-slate-200 bg-slate-50 p-5" onSubmit={saveBooking}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-950">Add booking</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Add a booking to the calendar. Backend conflict checks can be connected later.
                </p>
              </div>
              <button type="button" className="btn-secondary min-h-10 px-4 text-sm" onClick={() => setIsFormOpen(false)}>
                Cancel
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="form-field">
                <span>Date</span>
                <input type="date" value={bookingForm.date} onChange={(event) => updateBookingForm("date", event.target.value)} required />
              </label>
              <label className="form-field">
                <span>Time</span>
                <input type="time" value={bookingForm.time} onChange={(event) => updateBookingForm("time", event.target.value)} required />
              </label>
              <label className="form-field">
                <span>Customer</span>
                <input type="text" value={bookingForm.customer} onChange={(event) => updateBookingForm("customer", event.target.value)} placeholder="Customer name" required />
              </label>
              <label className="form-field">
                <span>Service</span>
                <input type="text" value={bookingForm.service} onChange={(event) => updateBookingForm("service", event.target.value)} placeholder="Service name" required />
              </label>
              <label className="form-field">
                <span>Resource</span>
                <input type="text" value={bookingForm.resource} onChange={(event) => updateBookingForm("resource", event.target.value)} placeholder="Room 1" required />
              </label>
              <label className="form-field">
                <span>Staff</span>
                <input type="text" value={bookingForm.staff} onChange={(event) => updateBookingForm("staff", event.target.value)} placeholder="Assigned staff" required />
              </label>
              <label className="form-field">
                <span>Status</span>
                <select
                  className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                  value={bookingForm.status}
                  onChange={(event) => updateBookingForm("status", event.target.value as BookingStatus)}
                >
                  <option>Confirmed</option>
                  <option>Pending</option>
                  <option>Needs review</option>
                </select>
              </label>
            </div>

            <button type="submit" className="btn-primary mt-5 min-h-10 px-4 text-sm">
              Save booking
            </button>
          </form>
        ) : null}

        <div className="grid gap-0 xl:grid-cols-[0.72fr_1.28fr]">
          <div className="border-b border-slate-200 p-5 xl:border-b-0 xl:border-r">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-950">Day timeline</h3>
                <p className="mt-1 text-sm text-slate-500">{filteredBookings.length} bookings scheduled</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                {conflictCount} review
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {timelineHours.map((hour) => {
                const hourBookings = filteredBookings.filter((booking) => booking.time.startsWith(hour.slice(0, 2)));

                return (
                  <div key={hour} className="grid grid-cols-[60px_1fr] gap-3">
                    <p className="pt-3 text-xs font-semibold text-slate-500">{hour}</p>
                    <div className="min-h-12 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      {hourBookings.length > 0 ? (
                        <div className="space-y-2">
                          {hourBookings.map((booking) => (
                            <div key={booking.id} className="rounded-lg bg-white p-3 shadow-sm">
                              <p className="text-sm font-semibold text-slate-950">{booking.customer}</p>
                              <p className="mt-1 text-xs text-slate-500">{booking.service} with {booking.staff}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs font-medium text-slate-400">Available</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Resource</th>
                  <th className="px-5 py-3">Staff</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-950">{booking.time}</td>
                    <td className="px-5 py-4 text-slate-700">{booking.customer}</td>
                    <td className="px-5 py-4 text-slate-600">{booking.service}</td>
                    <td className="px-5 py-4 text-slate-600">{booking.resource}</td>
                    <td className="px-5 py-4 text-slate-600">{booking.staff}</td>
                    <td className="px-5 py-4">
                      <BookingStatusBadge status={booking.status} />
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                        onClick={() => cancelBooking(booking.id)}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredBookings.length === 0 ? (
              <div className="border-t border-slate-200 p-8 text-center">
                <p className="font-semibold text-slate-950">No bookings found</p>
                <p className="mt-2 text-sm text-slate-500">Adjust the date, search term or status filter.</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      <BookingPublisherPanel />
    </AdminDashboardLayout>
  );
}

function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const statusClass = {
    Confirmed: "bg-emerald-50 text-emerald-700",
    Pending: "bg-sky-50 text-sky-700",
    "Needs review": "bg-amber-50 text-amber-700"
  }[status];

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
      {status}
    </span>
  );
}
