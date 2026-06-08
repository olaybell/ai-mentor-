import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AvailabilityEditor } from "./AvailabilityEditor";
import { BookingPreviewCard } from "./BookingPreviewCard";
import { BookingSetupForm } from "./BookingSetupForm";
import { PublishedBookingLink } from "./PublishedBookingLink";
import { SpecialistAssignment } from "./SpecialistAssignment";
import { publishPublicBookingPage } from "../../lib/api";
import { useAdminBookingStore } from "../../store/adminBookingStore";
import { validateBookingPageDraft } from "../../lib/mockPublishedBookingApi";

export function BookingPublisherPanel() {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [publishAttempted, setPublishAttempted] = useState(false);
  const [publishedPageLink, setPublishedPageLink] = useState("");

  const {
    draftBookingPage,
    selectedSpecialists,
    availability,
    isPublished,
    publishedLink,
    validationErrors,
    updateDraftBookingPage,
    selectSpecialist,
    removeSpecialist,
    updateAvailability,
    updateTimeSlot,
    resetDraftBookingPage
  } = useAdminBookingStore();

  const currentValidationErrors = useMemo(
    () => validateBookingPageDraft(draftBookingPage, selectedSpecialists, availability),
    [availability, draftBookingPage, selectedSpecialists]
  );
  const publishMutation = useMutation({
    mutationFn: () =>
      publishPublicBookingPage({
        draft: draftBookingPage,
        specialistIds: selectedSpecialists.map((specialist) => specialist.id),
        availability,
      }),
    onSuccess(result) {
      setPublishedPageLink(result.publicUrl);
      setCopyStatus("idle");
    }
  });
  const activePublishedLink = publishedPageLink || publishedLink;
  const publishStatus = activePublishedLink ? "Published" : currentValidationErrors.length > 0 ? "Missing required fields" : "Ready to publish";
  const visibleErrors = publishAttempted ? currentValidationErrors : validationErrors;

  function handlePublish() {
    setPublishAttempted(true);

    if (currentValidationErrors.length > 0) {
      return;
    }

    publishMutation.mutate();
  }

  async function handleCopy() {
    const link = activePublishedLink;
    let copied = false;

    if (link && typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(link);
        copied = true;
      } catch {
        copied = false;
      }
    }

    setCopyStatus(copied ? "copied" : "failed");
  }

  return (
    <section className="mt-6 space-y-6" id="booking-page-publisher">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Admin publisher</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">Booking Page Publisher</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Create a booking page, publish it, and share the link with clients so they can book appointments.
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(publishStatus)}`}>
            {publishStatus}
          </span>
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <BookingSetupForm draft={draftBookingPage} onChange={updateDraftBookingPage} />
          <SpecialistAssignment
            selectedSpecialists={selectedSpecialists}
            onSelect={selectSpecialist}
            onRemove={removeSpecialist}
          />
          <AvailabilityEditor
            availability={availability}
            onAvailabilityChange={updateAvailability}
            onTimeSlotChange={updateTimeSlot}
          />
        </div>

        <aside className="space-y-6 2xl:sticky 2xl:top-28 2xl:h-fit">
          <BookingPreviewCard
            draft={draftBookingPage}
            selectedSpecialists={selectedSpecialists}
            availability={availability}
          />

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Publish controls</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Publishing creates a frontend-only booking page and a shareable client link.
              </p>
            </div>

            {visibleErrors.length > 0 ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-semibold text-rose-700">Missing required fields</p>
                <ul className="mt-2 space-y-1 text-sm text-rose-700">
                  {visibleErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {publishMutation.isError ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {publishMutation.error instanceof Error ? publishMutation.error.message : "Unable to publish booking page."}
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
              <button
                type="button"
                className="btn-primary min-h-12 px-5 text-sm disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                onClick={handlePublish}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending ? "Publishing..." : "Publish Booking Page"}
              </button>
              <button type="button" className="btn-secondary min-h-12 px-5 text-sm" onClick={resetDraftBookingPage}>
                Reset draft
              </button>
            </div>
          </section>

          {activePublishedLink ? (
            <PublishedBookingLink link={activePublishedLink} copyStatus={copyStatus} onCopy={handleCopy} />
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function getStatusClass(status: string) {
  if (status === "Published") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "Ready to publish") {
    return "bg-sky-50 text-sky-700";
  }

  return "bg-rose-50 text-rose-700";
}
