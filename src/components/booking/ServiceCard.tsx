import type { Service } from "../../types/booking";

type ServiceCardProps = {
  service: Service;
  selected: boolean;
  onSelect: (service: Service) => void;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

export function ServiceCard({ service, selected, onSelect }: ServiceCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(service)}
      className={`min-h-52 rounded-lg border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md ${
        selected ? "border-slate-950 ring-4 ring-slate-200" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
          {service.category}
        </span>
        <span className="text-lg font-semibold text-slate-950">
          {currencyFormatter.format(service.price)}
        </span>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-950">{service.name}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{service.description}</p>
      <p className="mt-5 text-sm font-semibold text-slate-700">{service.durationMinutes} minutes</p>
    </button>
  );
}
