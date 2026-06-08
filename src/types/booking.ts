export type BookingStatus = "idle" | "submitting" | "confirmed" | "error";

export type Service = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  category: string;
};

export type AvailabilityStatus = "Available" | "Limited" | "Unavailable";

export type Specialist = {
  id: string;
  name: string;
  title: string;
  initials: string;
  experienceYears: number;
  rating: number;
  availabilityStatus: AvailabilityStatus;
  specialisation: string;
  serviceIds: string[];
};

export type TimeSlot = {
  time: string;
  available: boolean;
};

export type ClientDetails = {
  fullName: string;
  email: string;
  phone: string;
  note: string;
};

export type ConflictRisk = "Low" | "Medium" | "High";

export type UtilisationStatus = "Balanced utilisation" | "High utilisation";

export type AIInsight = {
  conflictRisk: ConflictRisk;
  recommendedSlot: string;
  utilisation: UtilisationStatus;
  explanation: string;
  confidence: number;
};

export type BookingRequest = {
  serviceId: string;
  specialistId: string;
  date: string;
  time: string;
  clientDetails: ClientDetails;
};

export type BookingConfirmation = {
  id: string;
  service: Service;
  specialist: Specialist;
  date: string;
  time: string;
  clientName: string;
  createdAt: string;
};

export type AIInsightPayload = {
  serviceId: string;
  specialistId: string;
  date: string;
  time: string;
};
