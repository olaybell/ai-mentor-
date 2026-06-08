import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, AuthUser } from "../types/auth";

const STORAGE_TOKEN_KEY = "ai-booking-token";
const STORAGE_USER_KEY = "ai-booking-user";

type AuthStore = {
  user: AuthUser | null;
  token: string;
  isAuthenticated: boolean;
  setSession: (session: AuthResponse) => void;
  updateUser: (user: AuthUser) => void;
  clearSession: () => void;
};

function writeSessionStorage(user: AuthUser | null, token: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(STORAGE_TOKEN_KEY, token);
    sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    return;
  }

  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
  sessionStorage.removeItem(STORAGE_TOKEN_KEY);
  sessionStorage.removeItem(STORAGE_USER_KEY);
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: "",
      isAuthenticated: false,
      setSession: ({ user, token }) => {
        writeSessionStorage(user, token);
        set({ user, token, isAuthenticated: true });
      },
      updateUser: (user) =>
        set((state) => {
          writeSessionStorage(user, state.token);
          return { user };
        }),
      clearSession: () => {
        writeSessionStorage(null, "");
        set({ user: null, token: "", isAuthenticated: false });
      },
    }),
    {
      name: "ai-booking-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
