import { Link } from "react-router-dom";

type PublishedBookingLinkProps = {
  link: string;
  copyStatus: "idle" | "copied" | "failed";
  onCopy: () => void;
};

export function PublishedBookingLink({ link, copyStatus, onCopy }: PublishedBookingLinkProps) {
  const path = getPathFromLink(link);

  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-emerald-950">Your booking page is live</h3>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Status: Published
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-emerald-800">
            Share this link with clients so they can choose a specialist and book an appointment.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary min-h-10 px-4 text-sm" onClick={onCopy}>
            Copy link
          </button>
          {path ? (
            <Link className="btn-primary min-h-10 px-4 text-sm" to={path}>
              Preview page
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase text-slate-500">Link</p>
        <p className="mt-2 break-all text-sm font-semibold text-slate-950">{link}</p>
      </div>

      {copyStatus === "copied" ? (
        <p className="mt-3 text-sm font-semibold text-emerald-700">Link copied to clipboard.</p>
      ) : null}
      {copyStatus === "failed" ? (
        <p className="mt-3 text-sm font-semibold text-amber-700">
          Clipboard access failed. The link is shown above for manual copying.
        </p>
      ) : null}
    </section>
  );
}

function getPathFromLink(link: string) {
  if (!link) {
    return "";
  }

  try {
    return new URL(link).pathname;
  } catch {
    return link.startsWith("/") ? link : "";
  }
}
