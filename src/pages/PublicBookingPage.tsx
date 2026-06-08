import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { AIInsightCard } from "../components/booking/AIInsightCard";
import { createPublicBooking, fetchPublicBookingPage, fetchSlotRecommendations, type BookingRecord } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { BookingSpecialist, BookingTimeSlot } from "../types/adminBooking";
import type { AIInsight } from "../types/booking";

type ClientDetailsState = {
  fullName: string;
  email: string;
  phone: string;
  note: string;
};
type FormErrors = Partial<Record<keyof ClientDetailsState, string>>;

const emptyClientDetails: ClientDetailsState = {
  fullName: "",
  email: "",
  phone: "",
  note: ""
};

export function PublicBookingPage() {
  const { slug = "" } = useParams();
  const setSession = useAuthStore((state) => state.setSession);
  const {
    data: page,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["public-booking-page", slug],
    queryFn: () => fetchPublicBookingPage(slug),
    enabled: Boolean(slug),
  });
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
  const [confirmation, setConfirmation] = useState<BookingRecord | null>(null);
  const [aiInsight, setAIInsight] = useState<AIInsight | null>(null);
  const [aiInsightLoading, setAIInsightLoading] = useState(false);

  const selectedDayName = selectedDate ? getDayName(selectedDate) : "";
  const slotsForSelectedDay = useMemo(() => {
    if (!page) {
      return [];
    }

    const matchingSlots = page.availability.timeSlots.filter((slot) => !slot.day || slot.day === selectedDayName);
    return matchingSlots.length > 0 ? matchingSlots : page.availability.timeSlots;
  }, [page, selectedDayName]);

  useEffect(() => {
    if (!page) {
      return;
    }

    setSelectedSpecialistId((current) => current || page.selectedSpecialists[0]?.id || "");
    setSelectedDate((current) => current || dateOptions[0]?.value || "");
  }, [dateOptions, page]);

  useEffect(() => {
    const firstAvailableSlot = slotsForSelectedDay.find((slot) => slot.isAvailable);
    setSelectedTime((current) => {
      if (current && slotsForSelectedDay.some((slot) => slot.time === current && slot.isAvailable)) {
        return current;
      }

      return firstAvailableSlot?.time || "";
    });
  }, [slotsForSelectedDay]);

  useEffect(() => {
    let active = true;

    async function loadInsight() {
      if (!page || !selectedSpecialistId || !selectedDate || !selectedTime) {
        setAIInsight(null);
        setAIInsightLoading(false);
        return;
      }

      setAIInsightLoading(true);
      try {
        const insight = await fetchSlotRecommendations({
          serviceId: page.serviceId,
          specialistId: selectedSpecialistId,
          serviceDurationMinutes: Number(page.serviceDurationMinutes),
          requestedStartTime: `${selectedDate}T${selectedTime}:00`,
          customerContext: {
            preferredTimeOfDay: inferPreferredTimeOfDay(selectedTime)
          }
        });
        if (active) {
          setAIInsight(insight);
        }
      } catch {
        if (active) {
          setAIInsight(null);
        }
      } finally {
        if (active) {
          setAIInsightLoading(false);
        }
      }
    }

    void loadInsight();

    return () => {
      active = false;
    };
  }, [page, selectedDate, selectedSpecialistId, selectedTime]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <Header />
        <main className="mx-auto max-w-3xl px-6 py-16 text-center">
          <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <p className="font-semibold text-slate-950">Loading booking page...</p>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <Header />
        <main className="mx-auto max-w-3xl px-6 py-16 text-center">
          <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <p className="section-eyebrow">Booking link</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Booking page not found</h1>
            <p className="mt-3 text-slate-600">
              {error instanceof Error ? error.message : "This published booking link does not exist."}
            </p>
            <Link className="btn-primary mt-8 min-h-12 px-6 text-sm" to="/book">
              Open booking portal
            </Link>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  const selectedSpecialist = page.selectedSpecialists.find((specialist) => specialist.id === selectedSpecialistId);
  const selectedSlot = slotsForSelectedDay.find((slot) => slot.time === selectedTime);
  const canConfirm =
    Boolean(page.serviceId && selectedSpecialistId && selectedDate && selectedTime && selectedSlot?.isAvailable) &&
    !isSubmitting;

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
    const loadedPage = page;

    if (!loadedPage) {
      setErrorMessage("This booking page is no longer available.");
      return;
    }

    const nextErrors = validateClientDetails(clientDetails);

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const result = await createPublicBooking({
        serviceId: loadedPage.serviceId,
        specialistId: selectedSpecialistId,
        startTime: `${selectedDate}T${selectedTime}:00`,
        status: "confirmed",
        note: clientDetails.note,
        clientDetails
      });

      if (result.customerSession) {
        setSession(result.customerSession);
      }
      setConfirmation(result.booking);
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
            Thanks, {confirmation.customerName}. Your appointment has been saved to the booking system.
          </p>
          <dl className="mt-8 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5 text-left sm:grid-cols-2">
            <SummaryItem label="Business" value={page.businessName} />
            <SummaryItem label="Service" value={confirmation.serviceName} />
            <SummaryItem label="Specialist" value={confirmation.specialistName} />
            <SummaryItem label="Date" value={formatDate(confirmation.date)} />
            <SummaryItem label="Time" value={confirmation.time} />
          </dl>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link className="btn-primary min-h-12 px-6 text-sm" to="/customer/dashboard">
              View My Bookings
            </Link>
            <button
              type="button"
              className="btn-secondary min-h-12 px-6 text-sm"
              onClick={() => {
                setConfirmation(null);
                setClientDetails(emptyClientDetails);
              }}
            >
              Book Another Appointment
            </button>
          </div>
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
            <p className="section-eyebrow">{page.businessName}</p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_0.72fr] lg:items-end">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                  {page.title}
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                  {page.serviceDescription}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-950">{page.serviceName}</p>
                <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <SummaryItem label="Duration" value={`${page.serviceDurationMinutes} minutes`} />
                  <SummaryItem label="Price" value={formatPrice(page.servicePrice)} />
                  <SummaryItem label="Category" value={page.serviceCategory || "General"} />
                  <SummaryItem label="Location" value={`${page.locationType}${page.locationDetails ? ` - ${page.locationDetails}` : ""}`} />
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
                {page.selectedSpecialists.map((specialist) => (
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
                  {slotsForSelectedDay.map((slot) => (
                    <SlotButton
                      key={`${slot.day ?? "any"}-${slot.id}`}
                      slot={slot}
                      selected={selectedTime === slot.time}
                      onSelect={() => setSelectedTime(slot.time)}
                    />
                  ))}
                </div>
              </div>
            </section>

            {aiInsightLoading ? <EmptyState message="Preparing AI scheduling recommendations." /> : null}
            {aiInsight ? <AIInsightCard insight={aiInsight} /> : null}

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
                      placeholder={page.notes || "Share anything useful before the appointment."}
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
                <SummaryRow label="Business" value={page.businessName} />
                <SummaryRow label="Service" value={page.serviceName} />
                <SummaryRow label="Specialist" value={selectedSpecialist?.name ?? "Not selected"} />
                <SummaryRow label="Date" value={selectedDate ? formatDate(selectedDate) : "Not selected"} />
                <SummaryRow label="Time" value={selectedTime || "Not selected"} />
              </div>

              {page.notes ? (
                <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                  {page.notes}
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
                This booking is saved to the backend and will appear in the company dashboard.
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

function SlotButton({
  slot,
  selected,
  onSelect
}: {
  slot: BookingTimeSlot;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!slot.isAvailable}
      onClick={onSelect}
      className={`min-h-12 rounded-lg border px-4 text-sm font-semibold transition ${
        selected ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700"
      } ${
        slot.isAvailable
          ? "hover:border-slate-400 hover:bg-slate-50"
          : "cursor-not-allowed bg-slate-100 text-slate-400 line-through"
      }`}
    >
      {slot.time}
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm font-medium text-slate-500">
      {message}
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

    if (allowedDays.size > 0 && !allowedDays.has(dayName)) {
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

function getDayName(value: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${value}T00:00:00`));
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

function inferPreferredTimeOfDay(time: string) {
  const hour = Number(time.split(":")[0]);

  if (hour < 12) {
    return "morning";
  }

  if (hour < 14) {
    return "midday";
  }

  if (hour < 17) {
    return "afternoon";
  }

  return "evening";
}
