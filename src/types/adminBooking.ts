export type BookingPublishStatus = "draft" | "ready" | "published" | "missing-required-fields";

export type BookingLocationType = "In-store" | "Online" | "Hybrid";

export type BookingPageDraft = {
  title: string;
  businessName: string;
  serviceName: string;
  serviceDescription: string;
  serviceCategory: string;
  serviceDurationMinutes: string;
  servicePrice: string;
  locationType: BookingLocationType;
  locationDetails: string;
  notes: string;
};

export type SpecialistAvailabilityStatus = "Available" | "Limited" | "Unavailable";

export type BookingSpecialist = {
  id: string;
  name: string;
  role: string;
  specialisation: string;
  experienceYears: number;
  rating: number;
  availabilityStatus: SpecialistAvailabilityStatus;
};

export type BookingTimeSlot = {
  id: string;
  day?: string;
  time: string;
  isAvailable: boolean;
  maxBookingsPerSlot: number;
};

export type BookingAvailability = {
  availableDays: string[];
  timeSlots: BookingTimeSlot[];
};

export type PublishedBookingPage = BookingPageDraft & {
  id: string;
  serviceId: string;
  slug: string;
  status: "published";
  publishedAt: string;
  publicUrl: string;
  selectedSpecialists: BookingSpecialist[];
  availability: BookingAvailability;
};

export type ConflictRisk = "Low" | "Medium" | "High";

export type UtilisationStatus = "Balanced" | "High utilisation";

export type AIInsight = {
  conflictRisk: ConflictRisk;
  recommendedSlot: string;
  utilisation: UtilisationStatus;
  confidence: number;
  explanation: string;
};

export type ClientBookingRequest = {
  bookingPageId: string;
  specialistId: string;
  date: string;
  time: string;
  fullName: string;
  email: string;
  phone: string;
  note: string;
};

export type ClientBookingConfirmation = {
  id: string;
  pageTitle: string;
  businessName: string;
  serviceName: string;
  specialistName: string;
  date: string;
  time: string;
  clientName: string;
};
