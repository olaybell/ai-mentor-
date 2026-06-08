export type AuthRole = "customer" | "staff" | "admin";

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  businessName: string;
  timezone: string;
  role: AuthRole;
  roleLabel: string;
  bookingRules: {
    smartSlotSelection: boolean;
    conflictResolution: boolean;
  };
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type RegisterRequest = AuthCredentials & {
  role?: AuthRole;
  businessName?: string;
  fullName?: string;
};
