import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminDashboardLayout } from "../components/AdminDashboardLayout";
import {
  cancelBooking as cancelBookingRequest,
  createCalendarBooking,
  fetchAvailability,
  fetchBookings,
  fetchServices,
  fetchSpecialists,
  type BookingRecord
} from "../lib/api";

type BookingStatus = "pending" | "confirmed" | "cancelled";

type BookingFormState = {
  date: string;
  time: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  specialistId: string;
  note: string;
  status: Exclude<BookingStatus, "cancelled">;
};

const timelineHours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

export function BusinessCalendarPage() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | BookingStatus>("All");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingFormState>(() => createEmptyBookingForm(getToday()));
  const queryClient = useQueryClient();

  const {
    data: bookings = [],
    isLoading: bookingsLoading,
    isError: bookingsHasError,
    error: bookingsError
  } = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });

  const { data: specialists = [] } = useQuery({
    queryKey: ["specialists"],
    queryFn: () => fetchSpecialists(),
  });

  const availabilityQuery = useQuery({
    queryKey: ["availability", bookingForm.serviceId, bookingForm.specialistId, bookingForm.date],
    queryFn: () =>
      fetchAvailability({
        serviceId: bookingForm.serviceId,
        specialistId: bookingForm.specialistId,
        date: bookingForm.date
      }),
    enabled: isFormOpen && Boolean(bookingForm.serviceId && bookingForm.specialistId && bookingForm.date),
  });

  const createMutation = useMutation({
    mutationFn: (payload: BookingFormState) =>
      createCalendarBooking({
        serviceId: payload.serviceId,
        specialistId: payload.specialistId,
        startTime: `${payload.date}T${payload.time}:00`,
        status: payload.status,
        note: payload.note,
        clientDetails: {
          fullName: payload.customerName,
          email: payload.customerEmail,
          phone: payload.customerPhone,
          note: payload.note
        }
      }),
    onSuccess(_, payload) {
      setSelectedDate(payload.date);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      setBookingForm(createEmptyBookingForm(payload.date));
      setIsFormOpen(false);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelBookingRequest(id),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    }
  });

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
          booking.customerName,
          booking.customerEmail,
          booking.customerPhone,
          booking.serviceName,
          booking.specialistName,
          booking.status,
          booking.time
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((firstBooking, secondBooking) => firstBooking.time.localeCompare(secondBooking.time));
  }, [bookings, searchQuery, selectedDate, statusFilter]);

  const pendingCount = filteredBookings.filter((booking) => booking.status === "pending").length;
  const specialistsForForm = useMemo(() => {
    if (!bookingForm.serviceId) {
      return specialists;
    }

    return specialists.filter((specialist) => specialist.serviceIds.includes(bookingForm.serviceId));
  }, [bookingForm.serviceId, specialists]);

  function openBookingForm() {
    setBookingForm(createEmptyBookingForm(selectedDate));
    setIsFormOpen(true);
  }

  function closeBookingForm() {
    setBookingForm(createEmptyBookingForm(selectedDate));
    setIsFormOpen(false);
  }

  function updateBookingForm(field: keyof BookingFormState, value: string) {
    setBookingForm((currentForm) => {
      const nextForm = {
        ...currentForm,
        [field]: value
      } as BookingFormState;

      if (field === "serviceId") {
        nextForm.specialistId = "";
        nextForm.time = "";
      }

      if (field === "specialistId" || field === "date") {
        nextForm.time = "";
      }

      return nextForm;
    });
  }

  function saveBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate(bookingForm);
  }

  function cancelBooking(bookingId: string) {
    cancelMutation.mutate(bookingId);
  }

  return (
    <AdminDashboardLayout title="Calendar">
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Calendar</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">Booking schedule</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Review backend bookings, detect occupied slots and add customer appointments.
            </p>
          </div>
          <button type="button" className="btn-primary min-h-10 px-4 text-sm" onClick={openBookingForm}>
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
              placeholder="Search customer, service, specialist or status"
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
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        </div>

        {bookingsHasError ? (
          <div className="border-b border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            Unable to load bookings: {bookingsError instanceof Error ? bookingsError.message : "Unknown error"}
          </div>
        ) : null}

        {isFormOpen ? (
          <form className="border-b border-slate-200 bg-slate-50 p-5" onSubmit={saveBooking}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-950">Add booking</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Choose a backend availability slot. Conflicting specialist intervals are disabled.
                </p>
              </div>
              <button type="button" className="btn-secondary min-h-10 px-4 text-sm" onClick={closeBookingForm}>
                Cancel
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="form-field">
                <span>Date</span>
                <input type="date" value={bookingForm.date} onChange={(event) => updateBookingForm("date", event.target.value)} required />
              </label>
              <label className="form-field">
                <span>Service</span>
                <select
                  className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                  value={bookingForm.serviceId}
                  onChange={(event) => updateBookingForm("serviceId", event.target.value)}
                  required
                >
                  <option value="">Select service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Specialist</span>
                <select
                  className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                  value={bookingForm.specialistId}
                  onChange={(event) => updateBookingForm("specialistId", event.target.value)}
                  required
                >
                  <option value="">Select specialist</option>
                  {specialistsForForm.map((specialist) => (
                    <option key={specialist.id} value={specialist.id}>
                      {specialist.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Time slot</span>
                <select
                  className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200 disabled:bg-slate-100"
                  value={bookingForm.time}
                  onChange={(event) => updateBookingForm("time", event.target.value)}
                  disabled={!bookingForm.serviceId || !bookingForm.specialistId || availabilityQuery.isLoading}
                  required
                >
                  <option value="">{availabilityQuery.isLoading ? "Loading slots" : "Select time"}</option>
                  {(availabilityQuery.data ?? []).map((slot) => (
                    <option key={slot.startTime ?? slot.time} value={slot.time} disabled={!slot.available}>
                      {slot.time}{slot.available ? "" : " - unavailable"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Customer name</span>
                <input
                  type="text"
                  value={bookingForm.customerName}
                  onChange={(event) => updateBookingForm("customerName", event.target.value)}
                  placeholder="Customer name"
                  required
                />
              </label>
              <label className="form-field">
                <span>Email</span>
                <input
                  type="email"
                  value={bookingForm.customerEmail}
                  onChange={(event) => updateBookingForm("customerEmail", event.target.value)}
                  placeholder="customer@example.com"
                  required
                />
              </label>
              <label className="form-field">
                <span>Phone</span>
                <input
                  type="tel"
                  value={bookingForm.customerPhone}
                  onChange={(event) => updateBookingForm("customerPhone", event.target.value)}
                  placeholder="+1 555 0100"
                  required
                />
              </label>
              <label className="form-field">
                <span>Status</span>
                <select
                  className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                  value={bookingForm.status}
                  onChange={(event) => updateBookingForm("status", event.target.value)}
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                </select>
              </label>
              <label className="form-field md:col-span-2 xl:col-span-4">
                <span>Note</span>
                <textarea
                  rows={3}
                  value={bookingForm.note}
                  onChange={(event) => updateBookingForm("note", event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                  placeholder="Optional booking note"
                />
              </label>
            </div>

            {availabilityQuery.isError ? (
              <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {availabilityQuery.error instanceof Error ? availabilityQuery.error.message : "Unable to load slots."}
              </p>
            ) : null}

            {createMutation.isError ? (
              <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {createMutation.error instanceof Error ? createMutation.error.message : "Unable to save booking."}
              </p>
            ) : null}

            <button type="submit" className="btn-primary mt-5 min-h-10 px-4 text-sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Save booking"}
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
                {pendingCount} pending
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
                              <p className="text-sm font-semibold text-slate-950">{booking.customerName}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {booking.serviceName} with {booking.specialistName}
                              </p>
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
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Time slot</th>
                  <th className="px-5 py-3">Specialist</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bookingsLoading ? (
                  <tr>
                    <td className="px-5 py-6 text-slate-500" colSpan={7}>
                      Loading bookings...
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                      onCancel={cancelBooking}
                      cancelling={cancelMutation.isPending}
                    />
                  ))
                )}
              </tbody>
            </table>

            {!bookingsLoading && filteredBookings.length === 0 ? (
              <div className="border-t border-slate-200 p-8 text-center">
                <p className="font-semibold text-slate-950">No bookings found</p>
                <p className="mt-2 text-sm text-slate-500">Adjust the date, search term or status filter.</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </AdminDashboardLayout>
  );
}

function BookingRow({
  booking,
  onCancel,
  cancelling
}: {
  booking: BookingRecord;
  onCancel: (bookingId: string) => void;
  cancelling: boolean;
}) {
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-5 py-4 font-semibold text-slate-950">{booking.time}</td>
      <td className="px-5 py-4">
        <p className="font-semibold text-slate-700">{booking.customerName}</p>
        <p className="mt-1 text-xs text-slate-500">{booking.customerEmail}</p>
      </td>
      <td className="px-5 py-4 text-slate-600">{booking.serviceName}</td>
      <td className="px-5 py-4 text-slate-600">{booking.timeSlotId ? `Slot ${booking.timeSlotId}` : booking.startTime.slice(11, 16)}</td>
      <td className="px-5 py-4 text-slate-600">{booking.specialistName}</td>
      <td className="px-5 py-4">
        <BookingStatusBadge status={booking.status} />
      </td>
      <td className="px-5 py-4">
        <button
          type="button"
          className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onCancel(booking.id)}
          disabled={booking.status === "cancelled" || cancelling}
        >
          Cancel
        </button>
      </td>
    </tr>
  );
}

function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const statusClass = {
    confirmed: "bg-emerald-50 text-emerald-700",
    pending: "bg-sky-50 text-sky-700",
    cancelled: "bg-slate-100 text-slate-600"
  }[status];

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
      {formatStatus(status)}
    </span>
  );
}

function createEmptyBookingForm(date: string): BookingFormState {
  return {
    date,
    time: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    serviceId: "",
    specialistId: "",
    note: "",
    status: "confirmed"
  };
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatStatus(status: BookingStatus) {
  return status[0].toUpperCase() + status.slice(1);
}
