import type { Service, Specialist } from "../types/booking";

export const services: Service[] = [
  {
    id: "hair-consultation",
    name: "Hair Consultation",
    description: "Style planning, scalp assessment and a care routine recommendation.",
    durationMinutes: 45,
    price: 35,
    category: "Beauty"
  },
  {
    id: "skin-treatment",
    name: "Skin Treatment",
    description: "A focused skin review with treatment planning for common concerns.",
    durationMinutes: 60,
    price: 70,
    category: "Wellness"
  },
  {
    id: "business-consultation",
    name: "Business Consultation",
    description: "Operational advice for bookings, customers, pricing and growth.",
    durationMinutes: 50,
    price: 95,
    category: "Consulting"
  },
  {
    id: "personal-training",
    name: "Personal Training Session",
    description: "One-to-one movement coaching with goals, form checks and a workout plan.",
    durationMinutes: 60,
    price: 55,
    category: "Fitness"
  },
  {
    id: "dental-checkup",
    name: "Dental Check-up",
    description: "Routine oral health check with simple follow-up recommendations.",
    durationMinutes: 30,
    price: 50,
    category: "Healthcare"
  }
];

export const specialists: Specialist[] = [
  {
    id: "amara-cole",
    name: "Amara Cole",
    title: "Senior Hair Specialist",
    initials: "AC",
    experienceYears: 8,
    rating: 4.9,
    availabilityStatus: "Available",
    specialisation: "Hair health and style planning",
    serviceIds: ["hair-consultation"]
  },
  {
    id: "daniel-hart",
    name: "Daniel Hart",
    title: "Aesthetic Therapist",
    initials: "DH",
    experienceYears: 6,
    rating: 4.8,
    availabilityStatus: "Limited",
    specialisation: "Facials and sensitive skin care",
    serviceIds: ["skin-treatment", "hair-consultation"]
  },
  {
    id: "ife-mason",
    name: "Ife Mason",
    title: "Business Advisor",
    initials: "IM",
    experienceYears: 10,
    rating: 4.9,
    availabilityStatus: "Available",
    specialisation: "Small business operations",
    serviceIds: ["business-consultation"]
  },
  {
    id: "maya-stone",
    name: "Maya Stone",
    title: "Personal Trainer",
    initials: "MS",
    experienceYears: 7,
    rating: 4.7,
    availabilityStatus: "Available",
    specialisation: "Strength training and mobility",
    serviceIds: ["personal-training"]
  },
  {
    id: "noah-reed",
    name: "Noah Reed",
    title: "Dental Practitioner",
    initials: "NR",
    experienceYears: 9,
    rating: 4.8,
    availabilityStatus: "Limited",
    specialisation: "Preventive dental care",
    serviceIds: ["dental-checkup"]
  }
];

export const baseTimeSlots = ["09:00", "10:00", "11:30", "13:00", "14:30", "16:00"];

export const unavailableSlots: Record<string, string[]> = {
  "amara-cole": ["13:00"],
  "daniel-hart": ["11:30", "14:30", "16:00"],
  "ife-mason": ["09:00"],
  "maya-stone": ["10:00", "16:00"],
  "noah-reed": ["11:30", "13:00", "14:30"]
};

export const existingMockBookings = [
  {
    id: "mock-001",
    serviceId: "hair-consultation",
    specialistId: "amara-cole",
    date: getDateOffset(1),
    time: "10:00",
    clientName: "Jon Bell"
  },
  {
    id: "mock-002",
    serviceId: "skin-treatment",
    specialistId: "daniel-hart",
    date: getDateOffset(2),
    time: "09:00",
    clientName: "Sara White"
  },
  {
    id: "mock-003",
    serviceId: "business-consultation",
    specialistId: "ife-mason",
    date: getDateOffset(3),
    time: "14:30",
    clientName: "Priya Shah"
  }
];

export function getDateOffset(daysFromToday: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}
