import { Link } from "react-router-dom";
import type { BookingConfirmation as BookingConfirmationType } from "../../types/booking";

type BookingConfirmationProps = {
  confirmation: BookingConfirmationType;
  onReset: () => void;
};

export function BookingConfirmation({ confirmation, onReset }: BookingConfirmationProps) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${confirmation.date}T00:00:00`));

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700">
          OK
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">
          Booking confirmed
        </h1>
        <p className="mt-3 text-slate-600">
          Thanks, {confirmation.clientName}. Your appointment has been saved in the booking system.
        </p>

        <dl className="mt-8 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5 text-left sm:grid-cols-2">
          <SummaryItem label="Service" value={confirmation.service.name} />
          <SummaryItem label="Specialist" value={confirmation.specialist.name} />
          <SummaryItem label="Date" value={formattedDate} />
          <SummaryItem label="Time" value={confirmation.time} />
        </dl>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="btn-primary min-h-12 px-6 text-sm" to="/customer/dashboard">
            View My Bookings
          </Link>
          <button type="button" onClick={onReset} className="btn-secondary min-h-12 px-6 text-sm">
            Book Another Appointment
          </button>
        </div>
      </section>
    </main>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-950">{value}</dd>
    </div>
  );
}
