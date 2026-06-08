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
  id?: string;
  timeSlotId?: string;
  time: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  available: boolean;
  conflictRisk?: ConflictRisk;
  specialistUtilisation?: number;
  serviceDuration?: number;
  timeOfDay?: string;
  dayOfWeek?: number;
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
  recommendations?: SlotRecommendation[];
  fallbackUsed?: boolean;
  engine?: "heuristic" | "llm";
};

export type SlotRecommendation = {
  slotId: string;
  timeSlotId?: string | null;
  rank: number;
  date: string;
  time: string;
  startTime: string;
  endTime: string;
  confidence: number;
  score?: number;
  rationale: string;
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
