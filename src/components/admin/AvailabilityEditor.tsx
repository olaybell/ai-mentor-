import { weekDays } from "../../data/adminBookingMockData";
import type { BookingAvailability, BookingTimeSlot } from "../../types/adminBooking";

type AvailabilityEditorProps = {
  availability: BookingAvailability;
  onAvailabilityChange: (updates: Partial<BookingAvailability>) => void;
  onTimeSlotChange: (slotId: string, updates: Partial<BookingTimeSlot>) => void;
};

export function AvailabilityEditor({
  availability,
  onAvailabilityChange,
  onTimeSlotChange
}: AvailabilityEditorProps) {
  const selectedDays = new Set(availability.availableDays);

  function toggleDay(day: string) {
    const nextDays = selectedDays.has(day)
      ? availability.availableDays.filter((item) => item !== day)
      : [...availability.availableDays, day];

    onAvailabilityChange({ availableDays: nextDays });
  }

  function addTimeSlot() {
    const time = "12:00";
    const nextSlot: BookingTimeSlot = {
      id: `slot-${Date.now()}`,
      time,
      isAvailable: true,
      maxBookingsPerSlot: 1
    };

    onAvailabilityChange({ timeSlots: [...availability.timeSlots, nextSlot] });
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">Step 3</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">Availability</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Choose available days, time slots and slot capacity for the public page.
          </p>
        </div>
        <button type="button" className="btn-secondary min-h-10 px-4 text-sm" onClick={addTimeSlot}>
          Add time slot
        </button>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-slate-800">Available days</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {weekDays.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                selectedDays.has(day)
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {availability.timeSlots.map((slot) => (
          <div
            key={slot.id}
            className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-[150px_1fr_170px]"
          >
            <label className="form-field">
              <span>Time</span>
              <input
                type="time"
                value={slot.time}
                onChange={(event) => onTimeSlotChange(slot.id, { time: event.target.value })}
              />
            </label>
            <label className="flex items-center gap-3 pt-2 md:pt-7">
              <input
                type="checkbox"
                checked={slot.isAvailable}
                onChange={(event) => onTimeSlotChange(slot.id, { isAvailable: event.target.checked })}
                className="h-5 w-5 rounded border-slate-300 text-slate-950 focus:ring-slate-300"
              />
              <span className="text-sm font-semibold text-slate-800">
                {slot.isAvailable ? "Bookable by clients" : "Marked unavailable"}
              </span>
            </label>
            <label className="form-field">
              <span>Max bookings</span>
              <input
                type="number"
                min="1"
                value={slot.maxBookingsPerSlot}
                onChange={(event) =>
                  onTimeSlotChange(slot.id, { maxBookingsPerSlot: Number(event.target.value) || 1 })
                }
              />
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}
