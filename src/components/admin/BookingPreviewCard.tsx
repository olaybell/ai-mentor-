import type { BookingAvailability, BookingPageDraft, BookingSpecialist } from "../../types/adminBooking";

type BookingPreviewCardProps = {
  draft: BookingPageDraft;
  selectedSpecialists: BookingSpecialist[];
  availability: BookingAvailability;
};

export function BookingPreviewCard({
  draft,
  selectedSpecialists,
  availability
}: BookingPreviewCardProps) {
  const visibleSlots = availability.timeSlots.filter((slot) => slot.isAvailable);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">Preview</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">{draft.title || "Untitled booking page"}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{draft.businessName || "Business name missing"}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          Draft preview
        </span>
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">{draft.serviceCategory || "Category"}</p>
            <h4 className="mt-2 text-xl font-semibold text-slate-950">{draft.serviceName || "Service name"}</h4>
          </div>
          <div className="text-right">
            <p className="font-semibold text-slate-950">{formatPrice(draft.servicePrice)}</p>
            <p className="mt-1 text-sm text-slate-500">{draft.serviceDurationMinutes || "0"} minutes</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {draft.serviceDescription || "Service description will appear here."}
        </p>
        <p className="mt-4 text-sm font-semibold text-slate-700">
          {draft.locationType} {draft.locationDetails ? `- ${draft.locationDetails}` : ""}
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-slate-950">Specialists shown</p>
          <div className="mt-3 space-y-2">
            {selectedSpecialists.length > 0 ? (
              selectedSpecialists.map((specialist) => (
                <div key={specialist.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-950">{specialist.name}</p>
                  <p className="text-xs text-slate-500">{specialist.role}</p>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                No specialists selected yet.
              </p>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">Bookable slots</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {visibleSlots.length > 0 ? (
              visibleSlots.map((slot) => (
                <span key={slot.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  {slot.time}
                </span>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                No available slots yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
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
