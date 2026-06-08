import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { fetchPublicBookingPages } from "../lib/api";

export function ClientBookingPortal() {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    data: pages = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["public-booking-pages"],
    queryFn: fetchPublicBookingPages,
  });

  const filteredPages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return pages;
    }

    return pages.filter((page) =>
      [
        page.businessName,
        page.title,
        page.serviceName,
        page.serviceCategory,
        page.locationDetails
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [pages, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <p className="section-eyebrow">Booking marketplace</p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_0.7fr] lg:items-end">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                  Choose a business to book with
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                  AI-Booking is a platform for many businesses. Pick a published booking page before choosing a specialist and appointment time.
                </p>
              </div>
              <label className="form-field">
                <span>Find a booking page</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search business, service or location"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-10">
          {isError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
              Unable to load booking pages: {error instanceof Error ? error.message : "Unknown error"}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-500">
              Loading published booking pages...
            </div>
          ) : null}

          {!isLoading && filteredPages.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
              <p className="font-semibold text-slate-950">No published booking pages found</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Try a different search term or ask the business for its booking link.
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredPages.map((page) => (
              <article key={page.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{page.businessName}</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-950">{page.serviceName}</h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {page.serviceCategory || "Service"}
                  </span>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{page.serviceDescription}</p>
                <dl className="mt-5 grid gap-3 text-sm text-slate-600">
                  <SummaryItem label="Duration" value={`${page.serviceDurationMinutes} minutes`} />
                  <SummaryItem label="Location" value={`${page.locationType}${page.locationDetails ? ` - ${page.locationDetails}` : ""}`} />
                  <SummaryItem label="Specialists" value={String(page.selectedSpecialists.length)} />
                </dl>
                <Link className="btn-primary mt-5 min-h-11 w-full px-4 text-sm" to={`/book/${page.slug}`}>
                  Book appointment
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-950">{value}</dd>
    </div>
  );
}
