import { Link } from "react-router-dom";

type BrandProps = {
  light?: boolean;
};

export function Brand({ light = false }: BrandProps) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="AI-Booking home">
      <span
        className={`grid h-9 w-9 place-items-center rounded-lg border ${
          light ? "border-white/30 bg-white/10 text-white" : "border-slate-200 bg-white text-slate-950"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path
            d="M7 3v3M17 3v3M5 8h14M6 5h12a2 2 0 0 1 2 2v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a2 2 0 0 1 2-2Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <path
            d="M8 12h2v5H8zM14 10h2v7h-2z"
            fill="currentColor"
            opacity="0.9"
          />
        </svg>
      </span>
      <span className={`text-xl font-bold tracking-tight ${light ? "text-white" : "text-slate-950"}`}>
        AI-Booking
      </span>
    </Link>
  );
}
