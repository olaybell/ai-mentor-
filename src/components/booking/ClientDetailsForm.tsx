import type { ClientDetails } from "../../types/booking";

type ClientDetailsFormProps = {
  details: ClientDetails;
  errors: Partial<Record<keyof ClientDetails, string>>;
  onChange: (field: keyof ClientDetails, value: string) => void;
};

export function ClientDetailsForm({ details, errors, onChange }: ClientDetailsFormProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="form-field">
          <span>Full name</span>
          <input
            value={details.fullName}
            onChange={(event) => onChange("fullName", event.target.value)}
            placeholder="Avery Johnson"
            autoComplete="name"
          />
          {errors.fullName ? <p className="text-sm font-medium text-rose-600">{errors.fullName}</p> : null}
        </label>
        <label className="form-field">
          <span>Email address</span>
          <input
            type="email"
            value={details.email}
            onChange={(event) => onChange("email", event.target.value)}
            placeholder="avery@example.com"
            autoComplete="email"
          />
          {errors.email ? <p className="text-sm font-medium text-rose-600">{errors.email}</p> : null}
        </label>
      </div>
      <label className="form-field">
        <span>Phone number</span>
        <input
          value={details.phone}
          onChange={(event) => onChange("phone", event.target.value)}
          placeholder="+1 555 0148"
          autoComplete="tel"
        />
        {errors.phone ? <p className="text-sm font-medium text-rose-600">{errors.phone}</p> : null}
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-800">Optional note or reason for visit</span>
        <textarea
          value={details.note}
          onChange={(event) => onChange("note", event.target.value)}
          placeholder="Share anything helpful before your appointment."
          rows={4}
          className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
        />
      </label>
    </div>
  );
}
