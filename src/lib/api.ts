import type { AuthCredentials, AuthResponse, AuthUser, RegisterRequest } from "../types/auth";
import type {
  BookingAvailability,
  BookingPageDraft,
  BookingSpecialist,
  BookingTimeSlot,
  PublishedBookingPage
} from "../types/adminBooking";
import type {
  AIInsight,
  BookingConfirmation,
  ClientDetails,
  ConflictRisk,
  Service,
  SlotRecommendation,
  Specialist,
  TimeSlot
} from "../types/booking";

const DEFAULT_BASE_URL = "http://localhost:5000";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? DEFAULT_BASE_URL;

export type ApiErrorPayload = {
  success?: boolean;
  error?: string;
  message?: string;
};

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set("Content-Type", "application/json");

  const token = getStoredAuthToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const data = (await response.json().catch(() => ({}))) as T & ApiErrorPayload;

  if (!response.ok || (typeof data === "object" && data !== null && "success" in data && data.success === false)) {
    const message = data && typeof data === "object" && data.error ? data.error : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem("ai-booking-token") ?? sessionStorage.getItem("ai-booking-token") ?? "";
}

export async function loginRequest(credentials: AuthCredentials) {
  const response = await apiRequest<{ success: true; data: AuthResponse; message: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  return normalizeAuthResponse(response.data);
}

export async function registerRequest(payload: RegisterRequest) {
  const response = await apiRequest<{ success: true; data: AuthResponse; message: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return normalizeAuthResponse(response.data);
}

export type BusinessProfilePayload = {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  timezone: string;
  bookingRules: {
    smartSlotSelection: boolean;
    conflictResolution: boolean;
  };
};

export type PasswordUpdatePayload = {
  currentPassword: string;
  newPassword: string;
};

export async function fetchCurrentUser() {
  const response = await apiRequest<{ success: true; data: AuthUser }>("/api/auth/me");
  return normalizeAuthUser(response.data);
}

export async function updateCurrentUser(payload: BusinessProfilePayload) {
  const response = await apiRequest<{ success: true; data: AuthUser; message?: string }>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return normalizeAuthUser(response.data);
}

export async function updatePassword(payload: PasswordUpdatePayload) {
  const response = await apiRequest<{ success: true; message?: string }>("/api/auth/password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response;
}

export async function deleteCurrentAccount() {
  const response = await apiRequest<{ success: true; message?: string }>("/api/auth/me", {
    method: "DELETE",
  });
  return response;
}

export async function fetchServices() {
  const response = await apiRequest<{ success: true; data: RawService[] }>("/api/resources/services");
  return response.data.map(mapService);
}

export async function fetchSpecialists(serviceId?: string) {
  const qs = serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : "";
  const response = await apiRequest<{ success: true; data: RawSpecialist[] }>(`/api/resources/specialists${qs}`);
  return response.data.map(mapSpecialist);
}

export type BookingCreatePayload = {
  specialistId: number | string;
  serviceId: number | string;
  startTime: string;
  note?: string;
  status?: "pending" | "confirmed" | "cancelled";
  clientDetails?: ClientDetails;
};

export type BookingRecord = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  specialistId: string;
  specialistName: string;
  timeSlotId?: string;
  startTime: string;
  endTime: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled";
  note: string;
  service: Service;
  specialist: Specialist;
  createdAt: string;
  updatedAt: string;
};

export async function createBooking(payload: BookingCreatePayload) {
  const response = await apiRequest<{ success: true; data: RawBookingRecord; message?: string }>("/api/bookings", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return mapBookingConfirmation(response.data);
}

export async function createCalendarBooking(payload: BookingCreatePayload) {
  const response = await apiRequest<{ success: true; data: RawBookingRecord; message?: string }>("/api/bookings", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return mapBookingRecord(response.data);
}

export async function createPublicBooking(payload: BookingCreatePayload) {
  const response = await apiRequest<{ success: true; data: RawBookingRecord; message?: string }>("/api/bookings", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return {
    booking: mapBookingRecord(response.data),
    customerSession: response.data.customerSession
      ? normalizeAuthResponse(response.data.customerSession)
      : undefined,
  };
}

export async function fetchBookings() {
  const response = await apiRequest<{ success: true; data: RawBookingRecord[] }>("/api/bookings");
  return response.data.map(mapBookingRecord);
}

export async function updateBookingRecord(id: number | string, payload: Partial<BookingCreatePayload>) {
  const response = await apiRequest<{ success: true; data: RawBookingRecord; message?: string }>(`/api/bookings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

  return mapBookingRecord(response.data);
}

export async function cancelBooking(id: number | string) {
  const response = await apiRequest<{ success: true; message?: string }>(`/api/bookings/${id}`, {
    method: "DELETE"
  });
  return response;
}

export async function fetchAvailability(params: {
  specialistId: number | string;
  serviceId: number | string;
  date: string;
}) {
  const qs = new URLSearchParams({
    specialistId: String(params.specialistId),
    serviceId: String(params.serviceId),
    date: params.date
  });
  const response = await apiRequest<{ success: true; data: RawTimeSlot[] }>(`/api/availability?${qs.toString()}`);
  return response.data.map(mapTimeSlot);
}

export async function fetchSlotRecommendations(payload: {
  specialistId: number | string;
  serviceId: number | string;
  serviceDurationMinutes: number;
  requestedStartTime: string;
  customerContext?: Record<string, unknown>;
}) {
  const response = await apiRequest<{ success: true; data: RawRecommendationResponse }>("/api/ai/recommend-slot", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return mapAIInsight(response.data);
}

export async function publishPublicBookingPage(payload: {
  draft: BookingPageDraft;
  specialistIds: string[];
  availability: BookingAvailability;
}) {
  const response = await apiRequest<{
    success: true;
    data: { id: number | string; serviceId?: number | string; slug: string; status: "published"; publishedAt: string; publicUrl: string };
    message?: string;
  }>("/api/public-pages/publish", {
    method: "POST",
    body: JSON.stringify({
      ...payload.draft,
      specialistIds: payload.specialistIds,
      timeSlots: expandPublishedTimeSlots(payload.availability),
    }),
  });

  return {
    id: String(response.data.id),
    serviceId: String(response.data.serviceId ?? ""),
    slug: response.data.slug,
    status: response.data.status,
    publishedAt: response.data.publishedAt,
    publicUrl: response.data.publicUrl,
  };
}

export async function fetchPublicBookingPage(slug: string) {
  const response = await apiRequest<{ success: true; data: RawPublicBookingPage }>(`/api/public-pages/${encodeURIComponent(slug)}`);
  return mapPublicBookingPage(response.data);
}

export async function fetchPublicBookingPages() {
  const response = await apiRequest<{ success: true; data: RawPublicBookingPage[] }>("/api/public-pages");
  return response.data.map(mapPublicBookingPage);
}

export type DashboardMetricSummary = {
  bookingsToday: number;
  bookingDelta: number;
  resourceUtilisation: number;
  specialistUtilisation: number;
  potentialConflicts: number;
  cancelledSlots: number;
  rebookableGaps: number;
};

export type DashboardInsight = {
  title: string;
  body: string;
};

export type AnalyticsOverview = {
  weeklyBookingFrequency: Array<{ week: string; total: number }>;
  utilisation: Array<{
    specialist_id: number;
    specialist_name: string;
    total_bookings: number;
    booked_minutes: number;
  }>;
  metrics: DashboardMetricSummary;
  aiInsights: DashboardInsight[];
};

export async function fetchAnalyticsOverview() {
  const response = await apiRequest<{ success: true; data: AnalyticsOverview }>("/api/analytics/overview");
  return response.data;
}

export async function fetchResources() {
  const response = await apiRequest<{ success: true; data: any[] }>("/api/resources");
  return response.data;
}

export async function createResource(payload: any) {
  const response = await apiRequest<{ success: true; data: any }>("/api/resources", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function updateResource(id: number | string, payload: any) {
  const response = await apiRequest<{ success: true; data: any }>(`/api/resources/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function deleteResource(id: number | string) {
  const response = await apiRequest<{ success: true; message?: string }>(`/api/resources/${id}`, {
    method: "DELETE",
  });
  return response;
}

export type StaffMember = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  services: string;
  nextSlot: string;
  status: "Active" | "On leave" | "Inactive";
};

export type StaffMemberPayload = Omit<StaffMember, "id">;

export async function fetchStaff() {
  const response = await apiRequest<{ success: true; data: StaffMember[] }>("/api/staff");
  return response.data;
}

export async function createStaff(payload: StaffMemberPayload) {
  const response = await apiRequest<{ success: true; data: StaffMember; message?: string }>("/api/staff", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      next_slot: payload.nextSlot,
    }),
  });
  return response.data;
}

export async function updateStaff(id: number | string, payload: Partial<StaffMemberPayload>) {
  const response = await apiRequest<{ success: true; data: StaffMember; message?: string }>(`/api/staff/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...payload,
      ...(payload.nextSlot ? { next_slot: payload.nextSlot } : {}),
    }),
  });
  return response.data;
}

export async function deleteStaff(id: number | string) {
  const response = await apiRequest<{ success: true; message?: string }>(`/api/staff/${id}`, {
    method: "DELETE",
  });
  return response;
}

type RawService = {
  id: number | string;
  name: string;
  description: string;
  duration_minutes?: number;
  durationMinutes?: number;
  price: number;
  category: string;
};

function normalizeAuthResponse(response: AuthResponse): AuthResponse {
  return {
    ...response,
    user: normalizeAuthUser(response.user),
  };
}

function normalizeAuthUser(user: AuthUser): AuthUser {
  return {
    id: Number(user.id),
    email: user.email,
    fullName: user.fullName ?? "",
    phone: user.phone ?? "",
    businessName: user.businessName ?? "",
    timezone: user.timezone ?? "Africa/Lagos",
    role: user.role,
    roleLabel: user.roleLabel ?? getRoleLabel(user.role),
    bookingRules: {
      smartSlotSelection: user.bookingRules?.smartSlotSelection ?? true,
      conflictResolution: user.bookingRules?.conflictResolution ?? true,
    },
  };
}

function getRoleLabel(role: AuthUser["role"]) {
  return {
    admin: "Business owner",
    staff: "Staff member",
    customer: "Customer",
  }[role];
}

type RawSpecialist = {
  id: number | string;
  name: string;
  title?: string;
  role?: string;
  specialisation: string;
  experience_years?: number;
  experienceYears?: number;
  rating?: number;
  availabilityStatus?: Specialist["availabilityStatus"];
  serviceIds?: Array<number | string>;
};

type RawBookingRecord = {
  id: number | string;
  customer_id?: number | string;
  customerId?: number | string;
  customer_name?: string;
  customerName?: string;
  customer_email?: string;
  customerEmail?: string;
  customer_phone?: string;
  customerPhone?: string;
  service_id?: number | string;
  serviceId?: number | string;
  service_name?: string;
  serviceName?: string;
  specialist_id?: number | string;
  specialistId?: number | string;
  specialist_name?: string;
  specialistName?: string;
  time_slot_id?: number | string | null;
  timeSlotId?: number | string | null;
  start_time?: string;
  startTime?: string;
  end_time?: string;
  endTime?: string;
  date?: string;
  time?: string;
  status: "pending" | "confirmed" | "cancelled";
  note?: string;
  service?: RawService;
  specialist?: RawSpecialist;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  clientName?: string;
  customerSession?: AuthResponse;
};

type RawPublicBookingPage = {
  id: number | string;
  serviceId?: number | string;
  service_id?: number | string;
  title: string;
  businessName?: string;
  business_name?: string;
  serviceName?: string;
  service_name?: string;
  serviceDescription?: string;
  service_description?: string;
  serviceCategory?: string;
  service_category?: string;
  serviceDurationMinutes?: number | string;
  service_duration_minutes?: number | string;
  servicePrice?: number | string;
  service_price?: number | string;
  locationType?: string;
  location_type?: string;
  locationDetails?: string;
  location_details?: string;
  notes: string;
  slug: string;
  status: "published";
  publishedAt?: string;
  published_at?: string;
  publicUrl?: string;
  public_url?: string;
  availableDays?: string[];
  selectedSpecialists: Array<{
    id: number | string;
    name: string;
    title?: string;
    role?: string;
    specialisation: string;
    experience_years?: number;
    experienceYears?: number;
    rating: number;
    availabilityStatus?: BookingSpecialist["availabilityStatus"];
  }>;
  timeSlots: Array<{
    id: number | string;
    day?: string;
    time: string;
    isAvailable?: boolean;
    is_available?: boolean;
    maxBookingsPerSlot?: number;
    max_bookings_per_slot?: number;
  }>;
};

type RawTimeSlot = {
  id?: number | string;
  timeSlotId?: number | string;
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

type RawRecommendation = {
  slotId: number | string;
  timeSlotId?: number | string | null;
  rank: number;
  date: string;
  time: string;
  startTime: string;
  endTime: string;
  confidence: number;
  score?: number;
  rationale: string;
};

type RawRecommendationResponse = {
  recommendations: RawRecommendation[];
  fallbackUsed: boolean;
  aiUnavailable?: boolean;
  engine: "heuristic" | "llm";
};

function mapService(service: RawService): Service {
  return {
    id: String(service.id),
    name: service.name,
    description: service.description,
    durationMinutes: Number(service.durationMinutes ?? service.duration_minutes ?? 0),
    price: Number(service.price),
    category: service.category,
  };
}

function mapSpecialist(specialist: RawSpecialist): Specialist {
  return {
    id: String(specialist.id),
    name: specialist.name,
    title: specialist.title ?? specialist.role ?? "Specialist",
    initials: getInitials(specialist.name),
    experienceYears: Number(specialist.experienceYears ?? specialist.experience_years ?? 0),
    rating: Number(specialist.rating ?? 0),
    availabilityStatus: specialist.availabilityStatus ?? "Available",
    specialisation: specialist.specialisation,
    serviceIds: (specialist.serviceIds ?? []).map(String),
  };
}

function mapBookingRecord(record: RawBookingRecord): BookingRecord {
  const startTime = record.startTime ?? record.start_time ?? "";
  const fallbackDate = startTime ? startTime.slice(0, 10) : "";
  const fallbackTime = startTime ? startTime.slice(11, 16) : "";
  const service = record.service
    ? mapService(record.service)
    : {
        id: String(record.serviceId ?? record.service_id ?? ""),
        name: record.serviceName ?? record.service_name ?? "Service",
        description: "",
        durationMinutes: 0,
        price: 0,
        category: "General",
      };
  const specialist = record.specialist
    ? mapSpecialist(record.specialist)
    : {
        id: String(record.specialistId ?? record.specialist_id ?? ""),
        name: record.specialistName ?? record.specialist_name ?? "Specialist",
        title: "Specialist",
        initials: getInitials(record.specialistName ?? record.specialist_name ?? "Specialist"),
        experienceYears: 0,
        rating: 0,
        availabilityStatus: "Available" as const,
        specialisation: "",
        serviceIds: [String(record.serviceId ?? record.service_id ?? "")],
      };

  return {
    id: String(record.id),
    customerId: String(record.customerId ?? record.customer_id ?? ""),
    customerName: record.customerName ?? record.customer_name ?? record.clientName ?? record.customerEmail ?? record.customer_email ?? "Customer",
    customerEmail: record.customerEmail ?? record.customer_email ?? "",
    customerPhone: record.customerPhone ?? record.customer_phone ?? "",
    serviceId: String(record.serviceId ?? record.service_id ?? service.id),
    serviceName: record.serviceName ?? record.service_name ?? service.name,
    specialistId: String(record.specialistId ?? record.specialist_id ?? specialist.id),
    specialistName: record.specialistName ?? record.specialist_name ?? specialist.name,
    timeSlotId: record.timeSlotId || record.time_slot_id ? String(record.timeSlotId ?? record.time_slot_id) : undefined,
    startTime,
    endTime: record.endTime ?? record.end_time ?? "",
    date: record.date ?? fallbackDate,
    time: record.time ?? fallbackTime,
    status: record.status,
    note: record.note ?? "",
    service,
    specialist,
    createdAt: record.createdAt ?? record.created_at ?? "",
    updatedAt: record.updatedAt ?? record.updated_at ?? "",
  };
}

function mapBookingConfirmation(record: RawBookingRecord): BookingConfirmation {
  const booking = mapBookingRecord(record);
  return {
    id: booking.id,
    service: booking.service,
    specialist: booking.specialist,
    date: booking.date,
    time: booking.time,
    clientName: booking.customerName,
    createdAt: booking.createdAt,
  };
}

function mapPublicBookingPage(page: RawPublicBookingPage): PublishedBookingPage {
  const timeSlots: BookingTimeSlot[] = page.timeSlots.map((slot) => ({
    id: String(slot.id),
    day: slot.day,
    time: slot.time,
    isAvailable: Boolean(slot.isAvailable ?? slot.is_available),
    maxBookingsPerSlot: Number(slot.maxBookingsPerSlot ?? slot.max_bookings_per_slot ?? 1),
  }));
  const availableDays = page.availableDays?.length
    ? page.availableDays
    : Array.from(new Set(timeSlots.map((slot) => slot.day).filter((day): day is string => Boolean(day))));

  return {
    id: String(page.id),
    serviceId: String(page.serviceId ?? page.service_id ?? ""),
    title: page.title,
    businessName: page.businessName ?? page.business_name ?? "",
    serviceName: page.serviceName ?? page.service_name ?? "",
    serviceDescription: page.serviceDescription ?? page.service_description ?? "",
    serviceCategory: page.serviceCategory ?? page.service_category ?? "",
    serviceDurationMinutes: String(page.serviceDurationMinutes ?? page.service_duration_minutes ?? ""),
    servicePrice: String(page.servicePrice ?? page.service_price ?? ""),
    locationType: (page.locationType ?? page.location_type ?? "In-store") as PublishedBookingPage["locationType"],
    locationDetails: page.locationDetails ?? page.location_details ?? "",
    notes: page.notes ?? "",
    slug: page.slug,
    status: page.status,
    publishedAt: page.publishedAt ?? page.published_at ?? "",
    publicUrl: page.publicUrl ?? page.public_url ?? `/book/${page.slug}`,
    selectedSpecialists: page.selectedSpecialists.map((specialist) => ({
      id: String(specialist.id),
      name: specialist.name,
      role: specialist.role ?? specialist.title ?? "Specialist",
      specialisation: specialist.specialisation,
      experienceYears: Number(specialist.experienceYears ?? specialist.experience_years ?? 0),
      rating: Number(specialist.rating),
      availabilityStatus: specialist.availabilityStatus ?? "Available",
    })),
    availability: {
      availableDays,
      timeSlots,
    },
  };
}

function mapTimeSlot(slot: RawTimeSlot): TimeSlot {
  return {
    id: slot.id !== undefined ? String(slot.id) : undefined,
    timeSlotId: slot.timeSlotId !== undefined ? String(slot.timeSlotId) : undefined,
    time: slot.time,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    available: slot.available,
    conflictRisk: slot.conflictRisk,
    specialistUtilisation: slot.specialistUtilisation,
    serviceDuration: slot.serviceDuration,
    timeOfDay: slot.timeOfDay,
    dayOfWeek: slot.dayOfWeek,
  };
}

function expandPublishedTimeSlots(availability: BookingAvailability) {
  return availability.availableDays.flatMap((day) =>
    availability.timeSlots.map((slot) => ({
      day,
      time: slot.time,
      isAvailable: slot.isAvailable,
      maxBookingsPerSlot: slot.maxBookingsPerSlot,
    }))
  );
}

function mapAIInsight(response: RawRecommendationResponse): AIInsight {
  const recommendations: SlotRecommendation[] = response.recommendations.map((item) => ({
    slotId: String(item.slotId),
    timeSlotId: item.timeSlotId === null || item.timeSlotId === undefined ? null : String(item.timeSlotId),
    rank: item.rank,
    date: item.date,
    time: item.time,
    startTime: item.startTime,
    endTime: item.endTime,
    confidence: item.confidence,
    score: item.score,
    rationale: item.rationale,
  }));
  const topRecommendation = recommendations[0];
  const confidence = topRecommendation?.confidence ?? 0;
  const utilisation = confidence < 70 ? "High utilisation" : "Balanced utilisation";

  return {
    conflictRisk: "Low",
    recommendedSlot: topRecommendation?.time ?? "No available slot",
    utilisation,
    confidence,
    explanation:
      topRecommendation?.rationale ??
      "No conflict-free recommendation is available for this specialist and service on the selected date.",
    recommendations,
    fallbackUsed: response.fallbackUsed,
    engine: response.engine,
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
