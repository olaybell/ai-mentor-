import type { AIInsight as BookingAIInsight, UtilisationStatus } from "../types/booking";

const baseTimeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00"
];

export type TimeSlot = {
  time: string;
  available: boolean;
};

export function getAvailability(_specialistId: string, _date: string): TimeSlot[] {
  // Minimal client-side availability: mark all base slots as available.
  return baseTimeSlots.map((time) => ({ time, available: true }));
}

export type AIInsight = BookingAIInsight;

export type AIInsightPayload = {
  serviceId: string;
  specialistId: string;
  date: string;
  time: string;
};

export function generateAIInsight(payload: AIInsightPayload): AIInsight {
  const selectedHour = Number(payload.time.split(":")[0]);
  const recommendedSlot = baseTimeSlots.find((t) => Number(t.split(":")[0]) < 12) ?? baseTimeSlots[0];

  if (selectedHour >= 14) {
    return {
      conflictRisk: "Medium",
      recommendedSlot,
      utilisation: "Balanced utilisation",
      confidence: 72,
      explanation: "This afternoon slot is available, but demand is usually higher later in the day."
    };
  }

  return {
    conflictRisk: selectedHour < 12 ? "Low" : "Medium",
    recommendedSlot,
    utilisation: "Balanced utilisation",
    confidence: selectedHour < 12 ? 87 : 82,
    explanation:
      selectedHour < 12 ? "This time slot has low demand and does not overlap with existing bookings." : "This midday slot is open and has a manageable level of demand."
  };
}
