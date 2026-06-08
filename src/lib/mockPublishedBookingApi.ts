import type {
  AIInsight,
  BookingAvailability,
  BookingPageDraft,
  BookingSpecialist,
  BookingTimeSlot,
  ClientBookingConfirmation,
  ClientBookingRequest,
  PublishedBookingPage
} from "../types/adminBooking";

export function validateBookingPageDraft(
  draft: BookingPageDraft,
  selectedSpecialists: BookingSpecialist[],
  availability: BookingAvailability
) {
  const errors: string[] = [];

  if (!draft.businessName.trim()) {
    errors.push("Business name is required.");
  }

  if (!draft.title.trim()) {
    errors.push("Booking page title is required.");
  }

  if (!draft.serviceName.trim()) {
    errors.push("Service name is required.");
  }

  if (!draft.serviceDurationMinutes.trim()) {
    errors.push("Service duration is required.");
  }

  if (selectedSpecialists.length === 0) {
    errors.push("Select at least one specialist.");
  }

  if (!availability.timeSlots.some((slot) => slot.isAvailable)) {
    errors.push("Add at least one available time slot.");
  }

  return errors;
}

export function createPublishedBookingPage(
  draft: BookingPageDraft,
  selectedSpecialists: BookingSpecialist[],
  availability: BookingAvailability
): PublishedBookingPage {
  const slug = `${slugify(draft.serviceName || draft.title)}-${createShortId()}`;
  const publicUrl = `${getPublicBaseUrl()}/book/${slug}`;

  return {
    ...draft,
    id: `published-${Date.now()}`,
    slug,
    status: "published",
    publishedAt: new Date().toISOString(),
    publicUrl,
    selectedSpecialists,
    availability
  };
}

export function generatePublishedBookingInsight(
  availability: BookingAvailability,
  selectedTime: string,
  specialist?: BookingSpecialist
): AIInsight {
  const selectedSlot = availability.timeSlots.find((slot) => slot.time === selectedTime);
  const unavailableCount = availability.timeSlots.filter((slot) => !slot.isAvailable).length;
  const recommendedSlot = getRecommendedSlot(availability.timeSlots);
  const selectedHour = Number(selectedTime.split(":")[0]);
  const utilisation = unavailableCount >= 3 || specialist?.availabilityStatus === "Limited" ? "High utilisation" : "Balanced";

  if (!selectedSlot?.isAvailable) {
    return {
      conflictRisk: "High",
      recommendedSlot,
      utilisation,
      confidence: 61,
      explanation: "This slot is currently marked unavailable, so the client should choose another time before confirming."
    };
  }

  if (selectedHour >= 12) {
    return {
      conflictRisk: selectedHour >= 14 ? "Medium" : "Low",
      recommendedSlot,
      utilisation,
      confidence: selectedHour >= 14 ? 78 : 84,
      explanation:
        "This slot is open, but morning appointments are usually less likely to conflict with other bookings."
    };
  }

  return {
    conflictRisk: "Low",
    recommendedSlot,
    utilisation,
    confidence: 88,
    explanation:
      "This time is recommended because the specialist has fewer bookings around this period."
  };
}

export async function submitPublishedClientBooking(
  page: PublishedBookingPage,
  request: ClientBookingRequest
): Promise<ClientBookingConfirmation> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 400);
  });

  const specialist = page.selectedSpecialists.find((item) => item.id === request.specialistId);
  const slot = page.availability.timeSlots.find((item) => item.time === request.time);

  if (!specialist) {
    throw new Error("Please choose a valid specialist.");
  }

  if (!slot?.isAvailable) {
    throw new Error("Please choose an available time slot.");
  }

  if (!request.fullName.trim() || !request.email.trim() || !request.phone.trim()) {
    throw new Error("Please complete your name, email and phone number.");
  }

  return {
    id: `client-booking-${Date.now()}`,
    pageTitle: page.title,
    businessName: page.businessName,
    serviceName: page.serviceName,
    specialistName: specialist.name,
    date: request.date,
    time: request.time,
    clientName: request.fullName
  };
}

function getRecommendedSlot(timeSlots: BookingTimeSlot[]) {
  return (
    timeSlots.find((slot) => slot.isAvailable && Number(slot.time.split(":")[0]) < 12)?.time ??
    timeSlots.find((slot) => slot.isAvailable)?.time ??
    "No available slot"
  );
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "booking";
}

function createShortId() {
  return Math.random().toString(36).slice(2, 8);
}

function getPublicBaseUrl() {
  if (typeof window === "undefined") {
    return "http://localhost:5173";
  }

  return window.location.origin;
}
