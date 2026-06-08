import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AdminDashboardLayout } from "../components/AdminDashboardLayout";
import {
  deleteCurrentAccount,
  fetchCurrentUser,
  updateCurrentUser,
  updatePassword,
  type BusinessProfilePayload
} from "../lib/api";
import { useAuthStore } from "../store/authStore";

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const emptyPasswordForm: PasswordFormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

const emptyProfileForm: BusinessProfilePayload = {
  fullName: "",
  email: "",
  phone: "",
  businessName: "",
  timezone: "Africa/Lagos",
  bookingRules: {
    smartSlotSelection: true,
    conflictResolution: true
  }
};

export function BusinessSettingsPage() {
  const [profileForm, setProfileForm] = useState<BusinessProfilePayload>(emptyProfileForm);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(emptyPasswordForm);
  const [passwordError, setPasswordError] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const updateStoredUser = useAuthStore((state) => state.updateUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: currentUser,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
  });

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setProfileForm({
      fullName: currentUser.fullName,
      email: currentUser.email,
      phone: currentUser.phone,
      businessName: currentUser.businessName,
      timezone: currentUser.timezone,
      bookingRules: currentUser.bookingRules
    });
    updateStoredUser(currentUser);
  }, [currentUser, updateStoredUser]);

  const profileMutation = useMutation({
    mutationFn: (payload: BusinessProfilePayload) => updateCurrentUser(payload),
    onSuccess(user) {
      updateStoredUser(user);
      queryClient.setQueryData(["current-user"], user);
    }
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }),
    onSuccess() {
      setPasswordForm(emptyPasswordForm);
      setPasswordError("");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCurrentAccount,
    onSuccess() {
      clearSession();
      queryClient.clear();
      navigate("/signin", { replace: true });
    }
  });

  function updateProfileField(field: keyof Omit<BusinessProfilePayload, "bookingRules">, value: string) {
    setProfileForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateBookingRule(rule: keyof BusinessProfilePayload["bookingRules"]) {
    setProfileForm((current) => ({
      ...current,
      bookingRules: {
        ...current.bookingRules,
        [rule]: !current.bookingRules[rule]
      }
    }));
  }

  function updatePasswordField(field: keyof PasswordFormState, value: string) {
    setPasswordForm((current) => ({
      ...current,
      [field]: value
    }));
    setPasswordError("");
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    profileMutation.mutate(profileForm);
  }

  function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    passwordMutation.mutate();
  }

  function deleteAccount() {
    if (deleteConfirmation !== "DELETE") {
      return;
    }

    deleteMutation.mutate();
  }

  return (
    <AdminDashboardLayout title="Settings">
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-500">Settings</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Account and booking rules</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            These settings are loaded from the backend account record and saved to the database.
          </p>
        </div>

        {isLoading ? (
          <div className="p-5 text-sm text-slate-500">Loading account settings...</div>
        ) : null}

        {isError ? (
          <div className="border-b border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            Unable to load account settings: {error instanceof Error ? error.message : "Unknown error"}
          </div>
        ) : null}

        {!isLoading && currentUser ? (
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <form className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r" onSubmit={saveProfile}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">Profile information</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Update the account details shown across the business workspace.
                  </p>
                </div>
                {profileMutation.isSuccess ? (
                  <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Profile saved
                  </span>
                ) : null}
              </div>

              <div className="mt-5 grid gap-4">
                <label className="form-field">
                  <span>Full name</span>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(event) => updateProfileField("fullName", event.target.value)}
                    autoComplete="name"
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Email address</span>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(event) => updateProfileField("email", event.target.value)}
                    autoComplete="email"
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Role</span>
                  <input type="text" value={currentUser.roleLabel} readOnly />
                </label>
                <label className="form-field">
                  <span>Business name</span>
                  <input
                    type="text"
                    value={profileForm.businessName}
                    onChange={(event) => updateProfileField("businessName", event.target.value)}
                    autoComplete="organization"
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Phone</span>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(event) => updateProfileField("phone", event.target.value)}
                    autoComplete="tel"
                  />
                </label>
                <label className="form-field">
                  <span>Timezone</span>
                  <input
                    type="text"
                    value={profileForm.timezone}
                    onChange={(event) => updateProfileField("timezone", event.target.value)}
                    required
                  />
                </label>
              </div>

              {profileMutation.isError ? (
                <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {profileMutation.error instanceof Error ? profileMutation.error.message : "Unable to save profile."}
                </p>
              ) : null}

              <button type="submit" className="btn-primary mt-5 min-h-10 px-4 text-sm" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? "Saving..." : "Save profile"}
              </button>
            </form>

            <div className="divide-y divide-slate-200">
              <div className="p-5">
                <h3 className="text-base font-semibold text-slate-950">Automation preferences</h3>
                <div className="mt-5 space-y-5">
                  <ToggleSetting
                    checked={profileForm.bookingRules.smartSlotSelection}
                    label="Smart slot selection"
                    description="Suggest the best appointment times based on availability, workload and business hours."
                    onChange={() => updateBookingRule("smartSlotSelection")}
                  />
                  <ToggleSetting
                    checked={profileForm.bookingRules.conflictResolution}
                    label="Conflict resolution"
                    description="Flag overlapping bookings and recommend a safer specialist or time before confirmation."
                    onChange={() => updateBookingRule("conflictResolution")}
                  />
                </div>
              </div>

              <form className="p-5" onSubmit={savePassword}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">Password update</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Keep admin access protected with a fresh password.
                    </p>
                  </div>
                  {passwordMutation.isSuccess ? (
                    <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Password updated
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 grid max-w-md gap-4">
                  <label className="form-field">
                    <span>Current password</span>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(event) => updatePasswordField("currentPassword", event.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </label>
                  <label className="form-field">
                    <span>New password</span>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) => updatePasswordField("newPassword", event.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </label>
                  <label className="form-field">
                    <span>Confirm password</span>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) => updatePasswordField("confirmPassword", event.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </label>
                </div>

                {passwordError || passwordMutation.isError ? (
                  <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {passwordError || (passwordMutation.error instanceof Error ? passwordMutation.error.message : "Unable to update password.")}
                  </p>
                ) : null}

                <button type="submit" className="btn-primary mt-5 min-h-10 px-4 text-sm" disabled={passwordMutation.isPending}>
                  {passwordMutation.isPending ? "Updating..." : "Update password"}
                </button>
              </form>

              <div className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-xl">
                    <h3 className="text-base font-semibold text-rose-700">Delete account</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Deleting this account removes backend access for {currentUser.email}. This action cannot be undone.
                    </p>
                    <label className="form-field mt-4 max-w-sm">
                      <span>Type DELETE to confirm</span>
                      <input
                        type="text"
                        value={deleteConfirmation}
                        onChange={(event) => setDeleteConfirmation(event.target.value)}
                        placeholder="DELETE"
                      />
                    </label>
                    {deleteMutation.isError ? (
                      <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                        {deleteMutation.error instanceof Error ? deleteMutation.error.message : "Unable to delete account."}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={deleteConfirmation !== "DELETE" || deleteMutation.isPending}
                    className="min-h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    onClick={deleteAccount}
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete account"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </AdminDashboardLayout>
  );
}

function ToggleSetting({
  checked,
  label,
  description,
  onChange
}: {
  checked: boolean;
  label: string;
  description: string;
  onChange: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-xl">
        <p className="text-sm font-semibold text-slate-950">{label}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
          checked ? "bg-slate-950" : "bg-slate-300"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
