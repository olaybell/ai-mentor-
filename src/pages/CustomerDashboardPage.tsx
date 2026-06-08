import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import {
  cancelBooking,
  fetchAvailability,
  fetchBookings,
  updateBookingRecord,
  type BookingRecord
} from "../lib/api";
import { useAuthStore } from "../store/authStore";

type EditFormState = {
  date: string;
  time: string;
  note: string;
};

export function CustomerDashboardPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [editingBooking, setEditingBooking] = useState<BookingRecord | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({ date: "", time: "", note: "" });

  const {
    data: bookings = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["customer-bookings"],
    queryFn: fetchBookings,
    enabled: isAuthenticated,
  });

  const availabilityQuery = useQuery({
    queryKey: ["customer-edit-availability", editingBooking?.id, editForm.date],
    queryFn: () =>
      fetchAvailability({
        serviceId: editingBooking?.serviceId ?? "",
        specialistId: editingBooking?.specialistId ?? "",
        date: editForm.date
      }),
    enabled: Boolean(editingBooking && editForm.date),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingBooking) {
        throw new Error("Select a booking to update.");
      }

      return updateBookingRecord(editingBooking.id, {
        serviceId: editingBooking.serviceId,
        specialistId: editingBooking.specialistId,
        startTime: `${editForm.date}T${editForm.time}:00`,
        note: editForm.note,
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["customer-bookings"] });
      setEditingBooking(null);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["customer-bookings"] });
    }
  });

  const activeBookings = useMemo(
    () => bookings.filter((booking) => booking.status !== "cancelled"),
    [bookings]
  );
  const cancelledBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "cancelled"),
    [bookings]
  );

  useEffect(() => {
    if (!editingBooking) {
      setEditForm({ date: "", time: "", note: "" });
      return;
    }

    setEditForm({
      date: editingBooking.date,
      time: editingBooking.time,
      note: editingBooking.note
    });
  }, [editingBooking]);

  function updateEditField(field: keyof EditFormState, value: string) {
    setEditForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function saveBookingUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateMutation.mutate();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-eyebrow">Customer dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">My bookings</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Track upcoming appointments, move a booking to an available slot or cancel when plans change.
            </p>
          </div>
          <Link className="btn-primary min-h-11 px-5 text-sm" to="/book">
            Book Appointment
          </Link>
        </div>

        {!isAuthenticated ? (
          <section className="mt-8 rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Sign in or book first</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Confirming a public booking creates your customer session automatically. You can also sign in if you already have access.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link className="btn-primary min-h-11 px-5 text-sm" to="/book">
                Book appointment
              </Link>
              <Link className="btn-secondary min-h-11 px-5 text-sm" to="/signin">
                Sign in
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-3">
              <MetricCard label="Customer" value={user?.fullName || user?.email || "Customer"} />
              <MetricCard label="Active bookings" value={String(activeBookings.length)} />
              <MetricCard label="Cancelled" value={String(cancelledBookings.length)} />
            </section>

            {isError ? (
              <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                Unable to load bookings: {error instanceof Error ? error.message : "Unknown error"}
              </div>
            ) : null}

            <section className="mt-6 rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-xl font-semibold text-slate-950">Appointments</h2>
              </div>

              <div className="divide-y divide-slate-200">
                {isLoading ? (
                  <p className="p-5 text-sm text-slate-500">Loading your bookings...</p>
                ) : bookings.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="font-semibold text-slate-950">No bookings yet</p>
                    <p className="mt-2 text-sm text-slate-500">Create your first appointment to see it here.</p>
                  </div>
                ) : (
                  bookings.map((booking) => (
                    <BookingListItem
                      key={booking.id}
                      booking={booking}
                      onEdit={() => setEditingBooking(booking)}
                      onCancel={() => cancelMutation.mutate(booking.id)}
                      actionDisabled={cancelMutation.isPending || updateMutation.isPending}
                    />
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {editingBooking ? (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Edit booking</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Move {editingBooking.serviceName} with {editingBooking.specialistName} to another open slot.
                </p>
              </div>
              <button type="button" className="btn-secondary min-h-10 px-4 text-sm" onClick={() => setEditingBooking(null)}>
                Close
              </button>
            </div>

            <form className="mt-5 grid gap-4 md:grid-cols-3" onSubmit={saveBookingUpdate}>
              <label className="form-field">
                <span>Date</span>
                <input type="date" value={editForm.date} onChange={(event) => updateEditField("date", event.target.value)} required />
              </label>
              <label className="form-field">
                <span>Time</span>
                <select
                  className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                  value={editForm.time}
                  onChange={(event) => updateEditField("time", event.target.value)}
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
              <label className="form-field md:col-span-3">
                <span>Note</span>
                <textarea
                  rows={3}
                  value={editForm.note}
                  onChange={(event) => updateEditField("note", event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                />
              </label>

              {availabilityQuery.isError || updateMutation.isError ? (
                <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 md:col-span-3">
                  {availabilityQuery.error instanceof Error
                    ? availabilityQuery.error.message
                    : updateMutation.error instanceof Error
                      ? updateMutation.error.message
                      : "Unable to update booking."}
                </p>
              ) : null}

              <div className="md:col-span-3">
                <button type="submit" className="btn-primary min-h-10 px-4 text-sm" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </article>
  );
}

function BookingListItem({
  booking,
  onEdit,
  onCancel,
  actionDisabled
}: {
  booking: BookingRecord;
  onEdit: () => void;
  onCancel: () => void;
  actionDisabled: boolean;
}) {
  const canChange = booking.status !== "cancelled";

  return (
    <article className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-950">{booking.serviceName}</h3>
          <StatusBadge status={booking.status} />
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {formatDate(booking.date)} at {booking.time} with {booking.specialistName}
        </p>
        {booking.note ? <p className="mt-1 text-sm text-slate-500">{booking.note}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onEdit}
          disabled={!canChange || actionDisabled}
        >
          Edit
        </button>
        <button
          type="button"
          className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onCancel}
          disabled={!canChange || actionDisabled}
        >
          Cancel
        </button>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: BookingRecord["status"] }) {
  const statusClass = {
    confirmed: "bg-emerald-50 text-emerald-700",
    pending: "bg-sky-50 text-sky-700",
    cancelled: "bg-slate-100 text-slate-600",
  }[status];

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>{formatStatus(status)}</span>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function formatStatus(status: string) {
  return status[0].toUpperCase() + status.slice(1);
}
