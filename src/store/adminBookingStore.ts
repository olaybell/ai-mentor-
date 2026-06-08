import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultAdminAvailability, defaultAdminBookingDraft } from "../data/adminBookingMockData";
import {
  createPublishedBookingPage,
  validateBookingPageDraft
} from "../lib/mockPublishedBookingApi";
import type {
  BookingAvailability,
  BookingPageDraft,
  BookingSpecialist,
  BookingTimeSlot,
  PublishedBookingPage
} from "../types/adminBooking";

type PublishResult = {
  success: boolean;
  errors: string[];
  page?: PublishedBookingPage;
};

type AdminBookingStore = {
  draftBookingPage: BookingPageDraft;
  publishedBookingPages: PublishedBookingPage[];
  selectedSpecialists: BookingSpecialist[];
  availability: BookingAvailability;
  isPublished: boolean;
  publishedLink: string;
  validationErrors: string[];
  updateDraftBookingPage: (updates: Partial<BookingPageDraft>) => void;
  selectSpecialist: (specialist: BookingSpecialist) => void;
  removeSpecialist: (specialistId: string) => void;
  updateAvailability: (updates: Partial<BookingAvailability>) => void;
  updateTimeSlot: (slotId: string, updates: Partial<BookingTimeSlot>) => void;
  publishBookingPage: () => PublishResult;
  copyPublishedLink: () => Promise<boolean>;
  resetDraftBookingPage: () => void;
  getPublishedBookingBySlug: (slug: string) => PublishedBookingPage | undefined;
};

export const useAdminBookingStore = create<AdminBookingStore>()(
  persist(
    (set, get) => ({
      draftBookingPage: defaultAdminBookingDraft,
      publishedBookingPages: [],
      selectedSpecialists: [],
      availability: defaultAdminAvailability,
      isPublished: false,
      publishedLink: "",
      validationErrors: [],

      updateDraftBookingPage: (updates) =>
        set((state) => ({
          draftBookingPage: {
            ...state.draftBookingPage,
            ...updates
          },
          isPublished: false,
          validationErrors: []
        })),

      selectSpecialist: (specialist) =>
        set((state) => {
          if (state.selectedSpecialists.some((item) => item.id === specialist.id)) {
            return state;
          }

          return {
            selectedSpecialists: [...state.selectedSpecialists, specialist],
            isPublished: false,
            validationErrors: []
          };
        }),

      removeSpecialist: (specialistId) =>
        set((state) => ({
          selectedSpecialists: state.selectedSpecialists.filter((specialist) => specialist.id !== specialistId),
          isPublished: false,
          validationErrors: []
        })),

      updateAvailability: (updates) =>
        set((state) => ({
          availability: {
            ...state.availability,
            ...updates
          },
          isPublished: false,
          validationErrors: []
        })),

      updateTimeSlot: (slotId, updates) =>
        set((state) => ({
          availability: {
            ...state.availability,
            timeSlots: state.availability.timeSlots.map((slot) =>
              slot.id === slotId ? { ...slot, ...updates } : slot
            )
          },
          isPublished: false,
          validationErrors: []
        })),

      publishBookingPage: () => {
        const state = get();
        const errors = validateBookingPageDraft(
          state.draftBookingPage,
          state.selectedSpecialists,
          state.availability
        );

        if (errors.length > 0) {
          set({ validationErrors: errors, isPublished: false });
          return { success: false, errors };
        }

        const page = createPublishedBookingPage(
          state.draftBookingPage,
          state.selectedSpecialists,
          state.availability
        );

        set((current) => ({
          publishedBookingPages: [page, ...current.publishedBookingPages],
          isPublished: true,
          publishedLink: page.publicUrl,
          validationErrors: []
        }));

        return { success: true, errors: [], page };
      },

      copyPublishedLink: async () => {
        const link = get().publishedLink;

        if (!link || typeof navigator === "undefined" || !navigator.clipboard) {
          return false;
        }

        try {
          await navigator.clipboard.writeText(link);
          return true;
        } catch {
          return false;
        }
      },

      resetDraftBookingPage: () =>
        set({
          draftBookingPage: defaultAdminBookingDraft,
          selectedSpecialists: [],
          availability: defaultAdminAvailability,
          isPublished: false,
          publishedLink: "",
          validationErrors: []
        }),

      getPublishedBookingBySlug: (slug) =>
        get().publishedBookingPages.find((page) => page.slug === slug)
    }),
    {
      name: "ai-booking-admin-pages",
      partialize: (state) => ({
        draftBookingPage: state.draftBookingPage,
        publishedBookingPages: state.publishedBookingPages,
        selectedSpecialists: state.selectedSpecialists,
        availability: state.availability,
        isPublished: state.isPublished,
        publishedLink: state.publishedLink,
        validationErrors: state.validationErrors
      })
    }
  )
);
