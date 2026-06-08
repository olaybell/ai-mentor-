import { useQuery } from "@tanstack/react-query";
import { fetchSpecialists } from "../../lib/api";
import type { BookingSpecialist } from "../../types/adminBooking";

type SpecialistAssignmentProps = {
  selectedSpecialists: BookingSpecialist[];
  onSelect: (specialist: BookingSpecialist) => void;
  onRemove: (specialistId: string) => void;
};

const availabilityTone = {
  Available: "bg-emerald-50 text-emerald-700",
  Limited: "bg-amber-50 text-amber-700",
  Unavailable: "bg-rose-50 text-rose-700"
};

export function SpecialistAssignment({
  selectedSpecialists,
  onSelect,
  onRemove
}: SpecialistAssignmentProps) {
  const { data: specialists = [], isLoading, isError, error } = useQuery({
    queryKey: ["specialists"],
    queryFn: () => fetchSpecialists(),
  });
  const selectedIds = new Set(selectedSpecialists.map((specialist) => specialist.id));
  const bookingSpecialists: BookingSpecialist[] = specialists.map((specialist) => ({
    id: specialist.id,
    name: specialist.name,
    role: specialist.title,
    specialisation: specialist.specialisation,
    experienceYears: specialist.experienceYears,
    rating: specialist.rating,
    availabilityStatus: specialist.availabilityStatus,
  }));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-slate-500">Step 2</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-950">Assign specialists</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Select the team members clients can choose from on this booking page.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading specialists...</p>
        ) : null}
        {isError ? (
          <p className="text-sm text-rose-700">
            Unable to load specialists: {error instanceof Error ? error.message : "Unknown error"}
          </p>
        ) : null}
        {bookingSpecialists.map((specialist) => {
          const selected = selectedIds.has(specialist.id);
          const unavailable = specialist.availabilityStatus === "Unavailable";

          return (
            <button
              key={specialist.id}
              type="button"
              disabled={unavailable}
              onClick={() => (selected ? onRemove(specialist.id) : onSelect(specialist))}
              className={`rounded-lg border bg-white p-4 text-left transition ${
                selected ? "border-slate-950 ring-4 ring-slate-200" : "border-slate-200"
              } ${unavailable ? "cursor-not-allowed opacity-60" : "hover:border-slate-400 hover:bg-slate-50"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-slate-950">{specialist.name}</h4>
                  <p className="mt-1 text-sm text-slate-500">{specialist.role}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${availabilityTone[specialist.availabilityStatus]}`}>
                  {specialist.availabilityStatus}
                </span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                <div>
                  <dt className="font-semibold text-slate-950">{specialist.experienceYears} yrs</dt>
                  <dd>Experience</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-950">{specialist.rating.toFixed(1)}/5</dt>
                  <dd>Rating</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-950">Focus</dt>
                  <dd>{specialist.specialisation}</dd>
                </div>
              </dl>
            </button>
          );
        })}
      </div>
    </section>
  );
}
