import { FormEvent, useEffect, useMemo, useState } from "react";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { AIInsightCard } from "../components/booking/AIInsightCard";
import { BookingConfirmation } from "../components/booking/BookingConfirmation";
import { ClientDetailsForm } from "../components/booking/ClientDetailsForm";
import { ServiceCard } from "../components/booking/ServiceCard";
import { SpecialistCard } from "../components/booking/SpecialistCard";
import { TimeSlotPicker } from "../components/booking/TimeSlotPicker";
import {
  generateAIInsight,
  getAvailability,
  getServices,
  getSpecialistsByService
} from "../lib/mockBookingApi";
import { useBookingStore } from "../store/bookingStore";
import type { ClientDetails } from "../types/booking";

type FormErrors = Partial<Record<keyof ClientDetails, string>>;

export function ClientBookingPortal() {
  const services = useMemo(() => getServices(), []);
  const dateOptions = useMemo(() => getDateOptions(), []);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const {
    selectedService,
    selectedSpecialist,
    selectedDate,
    selectedTime,
    clientDetails,
    aiInsight,
    bookingStatus,
    bookingConfirmation,
    errorMessage,
    setService,
    setSpecialist,
    setDate,
    setTime,
    updateClientDetails,
    setAIInsight,
    submitMockBooking,
    resetBooking
  } = useBookingStore();

  const specialistsForService = selectedService ? getSpecialistsByService(selectedService.id) : [];
  const timeSlots =
    selectedSpecialist && selectedDate ? getAvailability(selectedSpecialist.id, selectedDate) : [];

  useEffect(() => {
    if (!selectedService || !selectedSpecialist || !selectedDate || !selectedTime) {
      setAIInsight(null);
      return;
    }

    setAIInsight(
      generateAIInsight({
        serviceId: selectedService.id,
        specialistId: selectedSpecialist.id,
        date: selectedDate,
        time: selectedTime
      })
    );
  }, [selectedService, selectedSpecialist, selectedDate, selectedTime, setAIInsight]);

  if (bookingStatus === "confirmed" && bookingConfirmation) {
    return <BookingConfirmation confirmation={bookingConfirmation} onReset={resetBooking} />;
  }

  const handleClientDetailsChange = (field: keyof ClientDetails, value: string) => {
    updateClientDetails({ [field]: value });
    setFormErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateClientDetails(clientDetails);

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    await submitMockBooking();
  };

  const canAttemptSubmit =
    Boolean(selectedService && selectedSpecialist && selectedDate && selectedTime) &&
    bookingStatus !== "submitting";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <p className="section-eyebrow">Client booking portal</p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_0.7fr] lg:items-end">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                  Bright Studio
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                  Welcome. Book an appointment with one of our specialists.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-950">How booking works</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Choose a service, pick a specialist, select an available slot and review the AI
                  scheduling insight before confirming.
                </p>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <section className="scroll-mt-24">
              <SectionHeading
                step="1"
                title="Choose a service"
                body="Select the appointment type that best matches your visit."
              />
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    selected={selectedService?.id === service.id}
                    onSelect={setService}
                  />
                ))}
              </div>
            </section>

            <section className="scroll-mt-24">
              <SectionHeading
                step="2"
                title="Choose a specialist"
                body="Only specialists who can provide the selected service are shown."
              />
              {!selectedService ? (
                <EmptyState message="Select a service first to view available specialists." />
              ) : (
                <div className="mt-5 grid gap-4">
                  {specialistsForService.map((specialist) => (
                    <SpecialistCard
                      key={specialist.id}
                      specialist={specialist}
                      selected={selectedSpecialist?.id === specialist.id}
                      onSelect={setSpecialist}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="scroll-mt-24">
              <SectionHeading
                step="3"
                title="Pick date and time"
                body="Unavailable slots are disabled to prevent local booking conflicts."
              />
              {!selectedSpecialist ? (
                <EmptyState message="Select a specialist before choosing a date and time." />
              ) : (
                <div className="mt-5 grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div>
                    <label className="form-field max-w-sm">
                      <span>Date</span>
                      <input
                        type="date"
                        min={dateOptions[0].value}
                        value={selectedDate}
                        onChange={(event) => setDate(event.target.value)}
                      />
                    </label>
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                      {dateOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setDate(option.value)}
                          className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                            selectedDate === option.value
                              ? "border-slate-950 bg-slate-950 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedDate ? (
                    <TimeSlotPicker slots={timeSlots} selectedTime={selectedTime} onSelect={setTime} />
                  ) : (
                    <EmptyState message="Choose a date to view available time slots." compact />
                  )}
                </div>
              )}
            </section>

            <section className="scroll-mt-24">
              <SectionHeading
                step="4"
                title="Your details"
                body="Add the contact details needed to hold the appointment."
              />
              <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <ClientDetailsForm
                  details={clientDetails}
                  errors={formErrors}
                  onChange={handleClientDetailsChange}
                />
              </div>
            </section>

            {aiInsight ? <AIInsightCard insight={aiInsight} /> : null}
          </div>

          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Appointment summary</h2>
              <div className="mt-5 space-y-4">
                <SummaryRow label="Service" value={selectedService?.name ?? "Not selected"} />
                <SummaryRow label="Specialist" value={selectedSpecialist?.name ?? "Not selected"} />
                <SummaryRow label="Date" value={selectedDate ? formatDate(selectedDate) : "Not selected"} />
                <SummaryRow label="Time" value={selectedTime || "Not selected"} />
              </div>

              {errorMessage ? (
                <p className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!canAttemptSubmit}
                className="btn-primary mt-6 min-h-12 w-full px-5 text-sm disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                {bookingStatus === "submitting" ? "Confirming..." : "Confirm Booking"}
              </button>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                This booking is submitted with frontend mock logic only. Backend integration will come later.
              </p>
            </div>
          </aside>
        </form>
      </main>
      <Footer />
    </div>
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

function EmptyState({ message, compact = false }: { message: string; compact?: boolean }) {
  return (
    <div
      className={`mt-5 rounded-lg border border-dashed border-slate-300 bg-white text-sm font-medium text-slate-500 ${
        compact ? "p-4" : "p-6"
      }`}
    >
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

function validateClientDetails(details: ClientDetails): FormErrors {
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

function getDateOptions() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
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
  });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}
