import { create } from "zustand";
import { createPublicBooking as submitBookingRequest } from "../lib/api";
import { useAuthStore } from "./authStore";
import type {
  AIInsight,
  BookingConfirmation,
  BookingStatus,
  ClientDetails,
  Service,
  Specialist
} from "../types/booking";

type BookingStore = {
  selectedService: Service | null;
  selectedSpecialist: Specialist | null;
  selectedDate: string;
  selectedTime: string;
  clientDetails: ClientDetails;
  aiInsight: AIInsight | null;
  bookingStatus: BookingStatus;
  bookingConfirmation: BookingConfirmation | null;
  errorMessage: string;
  setService: (service: Service) => void;
  setSpecialist: (specialist: Specialist) => void;
  setDate: (date: string) => void;
  setTime: (time: string) => void;
  updateClientDetails: (details: Partial<ClientDetails>) => void;
  setAIInsight: (insight: AIInsight | null) => void;
  submitBooking: () => Promise<void>;
  resetBooking: () => void;
};

const emptyClientDetails: ClientDetails = {
  fullName: "",
  email: "",
  phone: "",
  note: ""
};

export const useBookingStore = create<BookingStore>((set, get) => ({
  selectedService: null,
  selectedSpecialist: null,
  selectedDate: "",
  selectedTime: "",
  clientDetails: emptyClientDetails,
  aiInsight: null,
  bookingStatus: "idle",
  bookingConfirmation: null,
  errorMessage: "",

  setService: (service) =>
    set({
      selectedService: service,
      selectedSpecialist: null,
      selectedTime: "",
      aiInsight: null,
      bookingStatus: "idle",
      bookingConfirmation: null,
      errorMessage: ""
    }),

  setSpecialist: (specialist) =>
    set({
      selectedSpecialist: specialist,
      selectedTime: "",
      aiInsight: null,
      bookingStatus: "idle",
      bookingConfirmation: null,
      errorMessage: ""
    }),

  setDate: (date) =>
    set({
      selectedDate: date,
      selectedTime: "",
      aiInsight: null,
      bookingStatus: "idle",
      bookingConfirmation: null,
      errorMessage: ""
    }),

  setTime: (time) =>
    set({
      selectedTime: time,
      bookingStatus: "idle",
      bookingConfirmation: null,
      errorMessage: ""
    }),

  updateClientDetails: (details) =>
    set((state) => ({
      clientDetails: {
        ...state.clientDetails,
        ...details
      },
      bookingStatus: "idle",
      errorMessage: ""
    })),

  setAIInsight: (insight) => set({ aiInsight: insight }),

  submitBooking: async () => {
    const state = get();

    if (!state.selectedService || !state.selectedSpecialist || !state.selectedDate || !state.selectedTime) {
      set({
        bookingStatus: "error",
        errorMessage: "Please complete the service, specialist, date and time selections."
      });
      return;
    }

    set({ bookingStatus: "submitting", errorMessage: "" });

    try {
      // Convert local date + time to ISO startTime expected by backend
      const startTime = `${state.selectedDate}T${state.selectedTime}:00`;

      const result = await submitBookingRequest({
        serviceId: state.selectedService.id,
        specialistId: state.selectedSpecialist.id,
        startTime,
        clientDetails: state.clientDetails,
        note: state.clientDetails.note || ""
      });
      if (result.customerSession) {
        useAuthStore.getState().setSession(result.customerSession);
      }
      const confirmation: BookingConfirmation = {
        id: result.booking.id,
        service: result.booking.service,
        specialist: result.booking.specialist,
        date: result.booking.date,
        time: result.booking.time,
        clientName: result.booking.customerName,
        createdAt: result.booking.createdAt,
      };

      set({
        bookingStatus: "confirmed",
        bookingConfirmation: confirmation,
        errorMessage: ""
      });
    } catch (error) {
      set({
        bookingStatus: "error",
        errorMessage: error instanceof Error ? error.message : "Unable to submit this booking."
      });
    }
  },

  resetBooking: () =>
    set({
      selectedService: null,
      selectedSpecialist: null,
      selectedDate: "",
      selectedTime: "",
      clientDetails: emptyClientDetails,
      aiInsight: null,
      bookingStatus: "idle",
      bookingConfirmation: null,
      errorMessage: ""
    })
}));
