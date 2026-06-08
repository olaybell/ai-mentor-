import type { TimeSlot } from "../../types/booking";

type TimeSlotPickerProps = {
  slots: TimeSlot[];
  selectedTime: string;
  onSelect: (time: string) => void;
};

export function TimeSlotPicker({ slots, selectedTime, onSelect }: TimeSlotPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {slots.map((slot) => (
        <button
          key={slot.time}
          type="button"
          disabled={!slot.available}
          onClick={() => onSelect(slot.time)}
          className={`min-h-12 rounded-lg border px-4 text-sm font-semibold transition ${
            selectedTime === slot.time
              ? "border-slate-950 bg-slate-950 text-white"
              : "border-slate-200 bg-white text-slate-700"
          } ${
            slot.available
              ? "hover:border-slate-400 hover:bg-slate-50"
              : "cursor-not-allowed bg-slate-100 text-slate-400 line-through"
          }`}
        >
          {slot.time}
        </button>
      ))}
    </div>
  );
}
