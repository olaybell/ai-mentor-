import {
  baseTimeSlots,
  existingMockBookings,
  services,
  specialists,
  unavailableSlots
} from "../data/bookingMockData";
import type {
  AIInsight,
  AIInsightPayload,
  BookingConfirmation,
  BookingRequest,
  Service,
  Specialist,
  TimeSlot
} from "../types/booking";

export function getServices(): Service[] {
  return services;
}

export function getSpecialistsByService(serviceId: string): Specialist[] {
  return specialists.filter((specialist) => specialist.serviceIds.includes(serviceId));
}

export function getAvailability(specialistId: string, date: string): TimeSlot[] {
  const specialistUnavailable = unavailableSlots[specialistId] ?? [];
  const bookedTimes = existingMockBookings
    .filter((booking) => booking.specialistId === specialistId && booking.date === date)
    .map((booking) => booking.time);
  const unavailable = new Set([...specialistUnavailable, ...bookedTimes]);

  return baseTimeSlots.map((time) => ({
    time,
    available: !unavailable.has(time)
  }));
}

export function generateAIInsight(payload: AIInsightPayload): AIInsight {
  const availability = getAvailability(payload.specialistId, payload.date);
  const selectedSlot = availability.find((slot) => slot.time === payload.time);
  const selectedHour = Number(payload.time.split(":")[0]);
  const unavailableCount = availability.filter((slot) => !slot.available).length;
  const recommendedSlot =
    availability.find((slot) => slot.available && Number(slot.time.split(":")[0]) < 12)?.time ??
    availability.find((slot) => slot.available)?.time ??
    "No safe slot";

  if (!selectedSlot?.available) {
    return {
      conflictRisk: "High",
      recommendedSlot,
      utilisation: unavailableCount >= 3 ? "High utilisation" : "Balanced utilisation",
      confidence: 64,
      explanation:
        "This time slot is already unavailable for the selected specialist, so the booking should be moved before confirmation."
    };
  }

  if (selectedHour >= 14) {
    return {
      conflictRisk: "Medium",
      recommendedSlot,
      utilisation: unavailableCount >= 3 ? "High utilisation" : "Balanced utilisation",
      confidence: 78,
      explanation:
        "This afternoon slot is available, but demand is usually higher later in the day, so a morning slot may be safer."
    };
  }

  return {
    conflictRisk: selectedHour < 12 ? "Low" : "Medium",
    recommendedSlot,
    utilisation: unavailableCount >= 3 ? "High utilisation" : "Balanced utilisation",
    confidence: selectedHour < 12 ? 87 : 82,
    explanation:
      selectedHour < 12
        ? "This time slot has low demand and does not overlap with existing bookings."
        : "This midday slot is open and has a manageable level of demand for the selected specialist."
  };
}

export async function submitMockBooking(payload: BookingRequest): Promise<BookingConfirmation> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 450);
  });

  const service = services.find((item) => item.id === payload.serviceId);
  const specialist = specialists.find((item) => item.id === payload.specialistId);
  const slot = getAvailability(payload.specialistId, payload.date).find(
    (item) => item.time === payload.time
  );

  if (!service || !specialist) {
    throw new Error("Please choose a valid service and specialist.");
  }

  if (!slot?.available) {
    throw new Error("This time slot is unavailable. Please choose another slot.");
  }

  if (!payload.clientDetails.fullName || !payload.clientDetails.email || !payload.clientDetails.phone) {
    throw new Error("Please complete the required client details.");
  }

  return {
    id: `booking-${Date.now()}`,
    service,
    specialist,
    date: payload.date,
    time: payload.time,
    clientName: payload.clientDetails.fullName,
    createdAt: new Date().toISOString()
  };
}
