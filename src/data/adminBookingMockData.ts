import type { BookingAvailability, BookingPageDraft, BookingSpecialist } from "../types/adminBooking";

export const defaultAdminBookingDraft: BookingPageDraft = {
  title: "Hair Consultation Booking",
  businessName: "Bello Beauty Studio",
  serviceName: "Hair Consultation",
  serviceDescription: "A friendly style planning session with hair health advice and product recommendations.",
  serviceCategory: "Beauty",
  serviceDurationMinutes: "45",
  servicePrice: "35",
  locationType: "In-store",
  locationDetails: "Bello Beauty Studio, Main Street",
  notes: "Please arrive 10 minutes early if this is your first visit."
};

export const mockBookingSpecialists: BookingSpecialist[] = [
  {
    id: "amara-cole",
    name: "Amara Cole",
    role: "Senior Hair Specialist",
    specialisation: "Hair health and style planning",
    experienceYears: 8,
    rating: 4.9,
    availabilityStatus: "Available"
  },
  {
    id: "daniel-hart",
    name: "Daniel Hart",
    role: "Colour Consultant",
    specialisation: "Colour matching and scalp-safe treatments",
    experienceYears: 6,
    rating: 4.8,
    availabilityStatus: "Limited"
  },
  {
    id: "nadia-stone",
    name: "Nadia Stone",
    role: "Beauty Therapist",
    specialisation: "Consultations and care routines",
    experienceYears: 7,
    rating: 4.7,
    availabilityStatus: "Available"
  },
  {
    id: "ife-clarke",
    name: "Ife Clarke",
    role: "Studio Manager",
    specialisation: "First-time client planning",
    experienceYears: 9,
    rating: 4.8,
    availabilityStatus: "Unavailable"
  }
];

export const defaultAdminAvailability: BookingAvailability = {
  availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  timeSlots: ["09:00", "10:00", "11:30", "13:00", "14:30", "16:00"].map((time) => ({
    id: `slot-${time.replace(":", "")}`,
    time,
    isAvailable: !["14:30"].includes(time),
    maxBookingsPerSlot: 1
  }))
};

export const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
