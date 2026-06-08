import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import {
  generatePublishedBookingInsight,
  submitPublishedClientBooking
} from "../lib/mockPublishedBookingApi";
import { useAdminBookingStore } from "../store/adminBookingStore";
import type {
  BookingSpecialist,
  ClientBookingConfirmation,
  ClientBookingRequest
} from "../types/adminBooking";

type ClientDetailsState = Pick<ClientBookingRequest, "fullName" | "email" | "phone" | "note">;
type FormErrors = Partial<Record<keyof ClientDetailsState, string>>;

const emptyClientDetails: ClientDetailsState = {
  fullName: "",
  email: "",
  phone: "",
  note: ""
};

export function PublicBookingPage() {
  const { slug = "" } = useParams();
  const page = useAdminBookingStore((state) => state.getPublishedBookingBySlug(slug));
  const dateOptions = useMemo(
    () => (page ? getDateOptions(page.availability.availableDays) : []),
    [page]
  );
  const [selectedSpecialistId, setSelectedSpecialistId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [clientDetails, setClientDetails] = useState<ClientDetailsState>(emptyClientDetails);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<ClientBookingConfirmation | null>(null);

  useEffect(() => {
    if (!page) {
      return;
    }

    setSelectedSpecialistId((current) => current || page.selectedSpecialists[0]?.id || "");
    setSelectedDate((current) => current || dateOptions[0]?.value || "");
    setSelectedTime((current) => current || page.availability.timeSlots.find((slot) => slot.isAvailable)?.time || "");
  }, [dateOptions, page]);

  if (!page) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <Header />
        <main className="mx-auto max-w-3xl px-6 py-16 text-center">
          <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <p className="section-eyebrow">Booking link</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Booking page not found</h1>
            <p className="mt-3 text-slate-600">
              This published booking link does not exist in the local mock store on this browser.
            </p>
            <Link className="btn-primary mt-8 min-h-12 px-6 text-sm" to="/book">
              Open demo booking portal
            </Link>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  const publishedPage = page;
  const selectedSpecialist = publishedPage.selectedSpecialists.find((specialist) => specialist.id === selectedSpecialistId);
  const selectedSlot = publishedPage.availability.timeSlots.find((slot) => slot.time === selectedTime);
  const aiInsight = selectedTime
    ? generatePublishedBookingInsight(publishedPage.availability, selectedTime, selectedSpecialist)
    : null;
  const canConfirm =
    Boolean(selectedSpecialistId && selectedDate && selectedTime && selectedSlot?.isAvailable) && !isSubmitting;

  function updateClientDetails(field: keyof ClientDetailsState, value: string) {
    setClientDetails((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setErrorMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateClientDetails(clientDetails);

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const result = await submitPublishedClientBooking(publishedPage, {
        bookingPageId: publishedPage.id,
        specialistId: selectedSpecialistId,
        date: selectedDate,
        time: selectedTime,
        ...clientDetails
      });

      setConfirmation(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to confirm this booking.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
        <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700">
            OK
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">Booking confirmed</h1>
          <p className="mt-3 text-slate-600">
            Thanks, {confirmation.clientName}. Your appointment has been saved with frontend mock logic.
          </p>
          <dl className="mt-8 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5 text-left sm:grid-cols-2">
            <SummaryItem label="Business" value={confirmation.businessName} />
            <SummaryItem label="Service" value={confirmation.serviceName} />
            <SummaryItem label="Specialist" value={confirmation.specialistName} />
            <SummaryItem label="Date" value={formatDate(confirmation.date)} />
            <SummaryItem label="Time" value={confirmation.time} />
          </dl>
          <button
            type="button"
            className="btn-primary mt-8 min-h-12 px-6 text-sm"
            onClick={() => {
              setConfirmation(null);
              setClientDetails(emptyClientDetails);
            }}
          >
            Book Another Appointment
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <p className="section-eyebrow">{publishedPage.businessName}</p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_0.72fr] lg:items-end">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                  {publishedPage.title}
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                  {publishedPage.serviceDescription}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-950">{publishedPage.serviceName}</p>
                <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <SummaryItem label="Duration" value={`${publishedPage.serviceDurationMinutes} minutes`} />
                  <SummaryItem label="Price" value={formatPrice(publishedPage.servicePrice)} />
                  <SummaryItem label="Category" value={publishedPage.serviceCategory || "General"} />
                  <SummaryItem label="Location" value={`${publishedPage.locationType}${publishedPage.locationDetails ? ` - ${publishedPage.locationDetails}` : ""}`} />
                </dl>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <section>
              <SectionHeading
                step="1"
                title="Choose a specialist"
                body="Only specialists assigned by the business owner are shown on this page."
              />
              <div className="mt-5 grid gap-4">
                {publishedPage.selectedSpecialists.map((specialist) => (
                  <SpecialistOption
                    key={specialist.id}
                    specialist={specialist}
                    selected={selectedSpecialistId === specialist.id}
                    onSelect={() => setSelectedSpecialistId(specialist.id)}
                  />
                ))}
              </div>
            </section>

            <section>
              <SectionHeading
                step="2"
                title="Pick date and time"
                body="Unavailable time slots are disabled based on the published availability rules."
              />
              <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <label className="form-field max-w-sm">
                  <span>Date</span>
                  <select
                    className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                  >
                    {dateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {publishedPage.availability.timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`min-h-12 rounded-lg border px-4 text-sm font-semibold transition ${
                        selectedTime === slot.time
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-700"
                      } ${
                        slot.isAvailable
                          ? "hover:border-slate-400 hover:bg-slate-50"
                          : "cursor-not-allowed bg-slate-100 text-slate-400 line-through"
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {aiInsight ? (
              <section className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-300">AI Scheduling Insight</p>
                    <h2 className="mt-1 text-xl font-semibold">Suggested appointment quality</h2>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getRiskClass(aiInsight.conflictRisk)}`}>
                    Conflict Risk: {aiInsight.conflictRisk}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <InsightMetric label="Recommended Slot" value={aiInsight.recommendedSlot} />
                  <InsightMetric label="Utilisation" value={aiInsight.utilisation} />
                  <InsightMetric label="Confidence" value={`${aiInsight.confidence}%`} />
                </div>
                <p className="mt-5 text-sm leading-6 text-slate-300">{aiInsight.explanation}</p>
              </section>
            ) : null}

            <section>
              <SectionHeading
                step="3"
                title="Your details"
                body="Add the contact details needed to hold the appointment."
              />
              <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label="Full name"
                      value={clientDetails.fullName}
                      error={formErrors.fullName}
                      onChange={(value) => updateClientDetails("fullName", value)}
                    />
                    <TextField
                      label="Email address"
                      type="email"
                      value={clientDetails.email}
                      error={formErrors.email}
                      onChange={(value) => updateClientDetails("email", value)}
                    />
                  </div>
                  <TextField
                    label="Phone number"
                    value={clientDetails.phone}
                    error={formErrors.phone}
                    onChange={(value) => updateClientDetails("phone", value)}
                  />
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-800">Optional note</span>
                    <textarea
                      rows={4}
                      value={clientDetails.note}
                      onChange={(event) => updateClientDetails("note", event.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                      placeholder={publishedPage.notes || "Share anything useful before the appointment."}
                    />
                  </label>
                </div>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Appointment summary</h2>
              <div className="mt-5 space-y-4">
                <SummaryRow label="Business" value={publishedPage.businessName} />
                <SummaryRow label="Service" value={publishedPage.serviceName} />
                <SummaryRow label="Specialist" value={selectedSpecialist?.name ?? "Not selected"} />
                <SummaryRow label="Date" value={selectedDate ? formatDate(selectedDate) : "Not selected"} />
                <SummaryRow label="Time" value={selectedTime || "Not selected"} />
              </div>

              {publishedPage.notes ? (
                <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                  {publishedPage.notes}
                </p>
              ) : null}

              {errorMessage ? (
                <p className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!canConfirm}
                className="btn-primary mt-6 min-h-12 w-full px-5 text-sm disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                {isSubmitting ? "Confirming..." : "Confirm booking"}
              </button>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                This booking is submitted with local mock logic only.
              </p>
            </div>
          </aside>
        </form>
      </main>
      <Footer />
    </div>
  );
}

function SpecialistOption({
  specialist,
  selected,
  onSelect
}: {
  specialist: BookingSpecialist;
  selected: boolean;
  onSelect: () => void;
}) {
  const unavailable = specialist.availabilityStatus === "Unavailable";

  return (
    <button
      type="button"
      disabled={unavailable}
      aria-pressed={selected}
      onClick={onSelect}
      className={`rounded-lg border bg-white p-5 text-left shadow-sm transition ${
        selected ? "border-slate-950 ring-4 ring-slate-200" : "border-slate-200"
      } ${unavailable ? "cursor-not-allowed opacity-60" : "hover:border-slate-400 hover:shadow-md"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{specialist.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{specialist.role}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {specialist.availabilityStatus}
        </span>
      </div>
      <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
        <p>
          <span className="block font-semibold text-slate-950">{specialist.experienceYears} yrs</span>
          Experience
        </p>
        <p>
          <span className="block font-semibold text-slate-950">{specialist.rating.toFixed(1)}/5</span>
          Rating
        </p>
        <p>
          <span className="block font-semibold text-slate-950">Focus</span>
          {specialist.specialisation}
        </p>
      </div>
    </button>
  );
}

function SectionHeading({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-950 text-sm font-semibold text-white">
        {step}
      </span>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
      </div>
    </div>
  );
}

function TextField({
  label,
  type = "text",
  value,
  error,
  onChange
}: {
  label: string;
  type?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
    </label>
  );
}

function InsightMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value}</p>
    </div>
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

function validateClientDetails(details: ClientDetailsState): FormErrors {
  const errors: FormErrors = {};

  if (!details.fullName.trim()) {
    errors.fullName = "Full name is required.";
  }

  if (!details.email.trim()) {
    errors.email = "Email address is required.";
  }

  if (!details.phone.trim()) {
    errors.phone = "Phone number is required.";
  }

  return errors;
}

function getDateOptions(availableDays: string[]) {
  const allowedDays = new Set(availableDays);

  return Array.from({ length: 21 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);

    if (!allowedDays.has(dayName)) {
      return null;
    }

    const value = date.toISOString().slice(0, 10);
    const label =
      index === 0
        ? "Today"
        : new Intl.DateTimeFormat("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric"
          }).format(date);

    return { value, label };
  }).filter((option): option is { value: string; label: string } => Boolean(option));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function formatPrice(value: string) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "Price not set";
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0
  }).format(amount);
}

function getRiskClass(risk: "Low" | "Medium" | "High") {
  return {
    Low: "bg-emerald-50 text-emerald-700",
    Medium: "bg-amber-50 text-amber-700",
    High: "bg-rose-50 text-rose-700"
  }[risk];
}
