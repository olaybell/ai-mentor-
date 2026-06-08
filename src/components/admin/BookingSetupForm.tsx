import type { BookingLocationType, BookingPageDraft } from "../../types/adminBooking";

type BookingSetupFormProps = {
  draft: BookingPageDraft;
  onChange: (updates: Partial<BookingPageDraft>) => void;
};

const locationOptions: BookingLocationType[] = ["In-store", "Online", "Hybrid"];

export function BookingSetupForm({ draft, onChange }: BookingSetupFormProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-slate-500">Step 1</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-950">Service details</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Define the booking offer clients will see on the public page.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="form-field">
          <span>Booking page title</span>
          <input
            value={draft.title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="Hair Consultation Booking"
          />
        </label>
        <label className="form-field">
          <span>Business name</span>
          <input
            value={draft.businessName}
            onChange={(event) => onChange({ businessName: event.target.value })}
            placeholder="Bello Beauty Studio"
          />
        </label>
        <label className="form-field">
          <span>Service name</span>
          <input
            value={draft.serviceName}
            onChange={(event) => onChange({ serviceName: event.target.value })}
            placeholder="Hair Consultation"
          />
        </label>
        <label className="form-field">
          <span>Service category</span>
          <input
            value={draft.serviceCategory}
            onChange={(event) => onChange({ serviceCategory: event.target.value })}
            placeholder="Beauty"
          />
        </label>
        <label className="form-field">
          <span>Service duration</span>
          <input
            type="number"
            min="1"
            value={draft.serviceDurationMinutes}
            onChange={(event) => onChange({ serviceDurationMinutes: event.target.value })}
            placeholder="45"
          />
        </label>
        <label className="form-field">
          <span>Service price</span>
          <input
            type="number"
            min="0"
            value={draft.servicePrice}
            onChange={(event) => onChange({ servicePrice: event.target.value })}
            placeholder="35"
          />
        </label>
        <label className="form-field">
          <span>Appointment option</span>
          <select
            className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
            value={draft.locationType}
            onChange={(event) => onChange({ locationType: event.target.value as BookingLocationType })}
          >
            {locationOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Location or meeting details</span>
          <input
            value={draft.locationDetails}
            onChange={(event) => onChange({ locationDetails: event.target.value })}
            placeholder="In-store address or online meeting note"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-800">Service description</span>
          <textarea
            value={draft.serviceDescription}
            onChange={(event) => onChange({ serviceDescription: event.target.value })}
            rows={4}
            className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
            placeholder="Describe what the client receives."
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-800">Booking notes/instructions</span>
          <textarea
            value={draft.notes}
            onChange={(event) => onChange({ notes: event.target.value })}
            rows={4}
            className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
            placeholder="Add arrival instructions, preparation notes or policies."
          />
        </label>
      </div>
    </section>
  );
}
