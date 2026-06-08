import { useState } from "react";
import { AdminDashboardLayout } from "../components/AdminDashboardLayout";

type BookingRules = {
  smartSlotSelection: boolean;
  conflictResolution: boolean;
};

type AdminProfile = {
  name: string;
  email: string;
  role: string;
  businessName: string;
  phone: string;
  timezone: string;
};

const defaultAdminProfile: AdminProfile = {
  name: "Maya Johnson",
  email: "maya@brightstudio.example",
  role: "Business owner",
  businessName: "Bright Studio",
  phone: "+1 (555) 014-2281",
  timezone: "Africa/Lagos"
};

export function BusinessSettingsPage() {
  const [bookingRules, setBookingRules] = useState<BookingRules>({
    smartSlotSelection: true,
    conflictResolution: true
  });
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(defaultAdminProfile);
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  function updateBookingRule(rule: keyof BookingRules) {
    setBookingRules((currentRules) => ({
      ...currentRules,
      [rule]: !currentRules[rule]
    }));
  }

  function updateProfileField(field: keyof AdminProfile, value: string) {
    setAdminProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value
    }));
    setProfileSaved(false);
  }

  return (
    <AdminDashboardLayout title="Settings">
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-500">Settings</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Admin account and booking rules</h2>
        </div>

        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r"
            onSubmit={(event) => {
              event.preventDefault();
              setProfileSaved(true);
            }}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-950">Profile information</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Update the admin details shown across the business workspace.
                </p>
              </div>
              {profileSaved ? (
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
                  value={adminProfile.name}
                  onChange={(event) => updateProfileField("name", event.target.value)}
                  autoComplete="name"
                  required
                />
              </label>
              <label className="form-field">
                <span>Email address</span>
                <input
                  type="email"
                  value={adminProfile.email}
                  onChange={(event) => updateProfileField("email", event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              <label className="form-field">
                <span>Role</span>
                <input
                  type="text"
                  value={adminProfile.role}
                  onChange={(event) => updateProfileField("role", event.target.value)}
                  required
                />
              </label>
              <label className="form-field">
                <span>Business name</span>
                <input
                  type="text"
                  value={adminProfile.businessName}
                  onChange={(event) => updateProfileField("businessName", event.target.value)}
                  autoComplete="organization"
                  required
                />
              </label>
              <label className="form-field">
                <span>Phone</span>
                <input
                  type="tel"
                  value={adminProfile.phone}
                  onChange={(event) => updateProfileField("phone", event.target.value)}
                  autoComplete="tel"
                />
              </label>
              <label className="form-field">
                <span>Timezone</span>
                <input
                  type="text"
                  value={adminProfile.timezone}
                  onChange={(event) => updateProfileField("timezone", event.target.value)}
                  required
                />
              </label>
            </div>

            <button type="submit" className="btn-primary mt-5 min-h-10 px-4 text-sm">
              Save profile
            </button>
          </form>

          <div className="divide-y divide-slate-200">
            <div className="p-5">
              <h3 className="text-base font-semibold text-slate-950">Automation preferences</h3>
              <div className="mt-5 space-y-5">
                <ToggleSetting
                  checked={bookingRules.smartSlotSelection}
                  label="Smart slot selection"
                  description="Suggest the best available appointment times based on resource availability, staff workload and business hours."
                  onChange={() => updateBookingRule("smartSlotSelection")}
                />
                <ToggleSetting
                  checked={bookingRules.conflictResolution}
                  label="Conflict resolution"
                  description="Flag overlapping bookings and recommend a safer staff, room or time adjustment before confirmation."
                  onChange={() => updateBookingRule("conflictResolution")}
                />
              </div>
            </div>

            <form
              className="p-5"
              onSubmit={(event) => {
                event.preventDefault();
                setPasswordSaved(true);
              }}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">Password update</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Keep admin access protected with a fresh password.
                  </p>
                </div>
                {passwordSaved ? (
                  <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Password update prepared
                  </span>
                ) : null}
              </div>

              <div className="mt-5 grid max-w-md gap-4">
                <label className="form-field">
                  <span>Current password</span>
                  <input type="password" autoComplete="current-password" placeholder="Enter current password" required />
                </label>
                <label className="form-field">
                  <span>New password</span>
                  <input type="password" autoComplete="new-password" placeholder="Enter new password" required />
                </label>
                <label className="form-field">
                  <span>Confirm password</span>
                  <input type="password" autoComplete="new-password" placeholder="Repeat new password" required />
                </label>
              </div>

              <button type="submit" className="btn-primary mt-5 min-h-10 px-4 text-sm">
                Update password
              </button>
            </form>

            <div className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-xl">
                  <h3 className="text-base font-semibold text-rose-700">Delete account</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Deleting this admin account would remove access to business settings, staff management and booking history.
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
                </div>
                <button
                  type="button"
                  disabled={deleteConfirmation !== "DELETE"}
                  className="min-h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  Delete account
                </button>
              </div>
            </div>
          </div>
        </div>
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
