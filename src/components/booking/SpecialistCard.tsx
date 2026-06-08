import type { Specialist } from "../../types/booking";

type SpecialistCardProps = {
  specialist: Specialist;
  selected: boolean;
  onSelect: (specialist: Specialist) => void;
};

const availabilityTone = {
  Available: "bg-emerald-50 text-emerald-700",
  Limited: "bg-amber-50 text-amber-700",
  Unavailable: "bg-rose-50 text-rose-700"
};

export function SpecialistCard({ specialist, selected, onSelect }: SpecialistCardProps) {
  const isUnavailable = specialist.availabilityStatus === "Unavailable";

  return (
    <button
      type="button"
      disabled={isUnavailable}
      aria-pressed={selected}
      onClick={() => onSelect(specialist)}
      className={`rounded-lg border bg-white p-5 text-left shadow-sm transition ${
        selected ? "border-slate-950 ring-4 ring-slate-200" : "border-slate-200"
      } ${
        isUnavailable
          ? "cursor-not-allowed opacity-60"
          : "hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-950 text-sm font-semibold text-white">
          {specialist.initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">{specialist.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{specialist.title}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                availabilityTone[specialist.availabilityStatus]
              }`}
            >
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
        </div>
      </div>
    </button>
  );
}
