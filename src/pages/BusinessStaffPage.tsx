import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { AdminDashboardLayout } from "../components/AdminDashboardLayout";

type StaffStatus = "Active" | "On leave" | "Inactive";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  services: string;
  nextSlot: string;
  status: StaffStatus;
};

type StaffFormState = Omit<StaffMember, "id">;

const initialStaff: StaffMember[] = [
  {
    id: "staff-1",
    name: "Dr. Mason",
    email: "mason@brightstudio.example",
    phone: "+1 (555) 014-1102",
    role: "Consultant",
    services: "Consultations, follow-ups",
    nextSlot: "14:30",
    status: "Active"
  },
  {
    id: "staff-2",
    name: "Nadia Stone",
    email: "nadia@brightstudio.example",
    phone: "+1 (555) 014-1188",
    role: "Trainer",
    services: "Equipment training",
    nextSlot: "12:45",
    status: "Active"
  },
  {
    id: "staff-3",
    name: "Ife Clarke",
    email: "ife@brightstudio.example",
    phone: "+1 (555) 014-1910",
    role: "Specialist",
    services: "Wellness reviews",
    nextSlot: "15:00",
    status: "On leave"
  },
  {
    id: "staff-4",
    name: "Leah Hart",
    email: "leah@brightstudio.example",
    phone: "+1 (555) 014-2017",
    role: "Reception",
    services: "Front desk, booking support",
    nextSlot: "Now",
    status: "Active"
  }
];

const emptyStaffForm: StaffFormState = {
  name: "",
  email: "",
  phone: "",
  role: "",
  services: "",
  nextSlot: "",
  status: "Active"
};

export function BusinessStaffPage() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(initialStaff);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState<StaffFormState>(emptyStaffForm);

  const filteredStaff = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return staffMembers;
    }

    return staffMembers.filter((member) =>
      [
        member.name,
        member.email,
        member.phone,
        member.role,
        member.services,
        member.nextSlot,
        member.status
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [searchQuery, staffMembers]);

  function openAddStaffForm() {
    setEditingStaffId(null);
    setStaffForm(emptyStaffForm);
    setIsFormOpen(true);
  }

  function openEditStaffForm(member: StaffMember) {
    setEditingStaffId(member.id);
    setStaffForm({
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      services: member.services,
      nextSlot: member.nextSlot,
      status: member.status
    });
    setIsFormOpen(true);
  }

  function closeStaffForm() {
    setEditingStaffId(null);
    setStaffForm(emptyStaffForm);
    setIsFormOpen(false);
  }

  function updateStaffForm(field: keyof StaffFormState, value: string) {
    setStaffForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function saveStaffMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editingStaffId) {
      setStaffMembers((currentStaff) =>
        currentStaff.map((member) =>
          member.id === editingStaffId ? { ...member, ...staffForm } : member
        )
      );
    } else {
      setStaffMembers((currentStaff) => [
        {
          id: `staff-${Date.now()}`,
          ...staffForm
        },
        ...currentStaff
      ]);
    }

    closeStaffForm();
  }

  function deleteStaffMember(staffId: string) {
    setStaffMembers((currentStaff) => currentStaff.filter((member) => member.id !== staffId));
  }

  return (
    <AdminDashboardLayout title="Staff">
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Staff</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">Team members</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage staff records, service coverage and availability from one place.
            </p>
          </div>
          <button type="button" className="btn-primary min-h-10 px-4 text-sm" onClick={openAddStaffForm}>
            Add staff
          </button>
        </div>

        <div className="border-b border-slate-200 p-5">
          <label className="form-field max-w-lg">
            <span>Search staff</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, email, role, service or status"
            />
          </label>
        </div>

        {isFormOpen ? (
          <form className="border-b border-slate-200 bg-slate-50 p-5" onSubmit={saveStaffMember}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-950">
                  {editingStaffId ? "Edit staff member" : "Add staff member"}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Keep contact details and working coverage accurate for booking assignments.
                </p>
              </div>
              <button type="button" className="btn-secondary min-h-10 px-4 text-sm" onClick={closeStaffForm}>
                Cancel
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="form-field">
                <span>Full name</span>
                <input
                  type="text"
                  value={staffForm.name}
                  onChange={(event) => updateStaffForm("name", event.target.value)}
                  placeholder="Staff name"
                  required
                />
              </label>
              <label className="form-field">
                <span>Email</span>
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={(event) => updateStaffForm("email", event.target.value)}
                  placeholder="staff@example.com"
                  required
                />
              </label>
              <label className="form-field">
                <span>Phone</span>
                <input
                  type="tel"
                  value={staffForm.phone}
                  onChange={(event) => updateStaffForm("phone", event.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </label>
              <label className="form-field">
                <span>Role</span>
                <input
                  type="text"
                  value={staffForm.role}
                  onChange={(event) => updateStaffForm("role", event.target.value)}
                  placeholder="Consultant"
                  required
                />
              </label>
              <label className="form-field">
                <span>Services</span>
                <input
                  type="text"
                  value={staffForm.services}
                  onChange={(event) => updateStaffForm("services", event.target.value)}
                  placeholder="Consultations, training"
                  required
                />
              </label>
              <label className="form-field">
                <span>Next slot</span>
                <input
                  type="text"
                  value={staffForm.nextSlot}
                  onChange={(event) => updateStaffForm("nextSlot", event.target.value)}
                  placeholder="14:30"
                  required
                />
              </label>
              <label className="form-field md:max-w-sm">
                <span>Status</span>
                <select
                  className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                  value={staffForm.status}
                  onChange={(event) => updateStaffForm("status", event.target.value as StaffStatus)}
                >
                  <option>Active</option>
                  <option>On leave</option>
                  <option>Inactive</option>
                </select>
              </label>
            </div>

            <button type="submit" className="btn-primary mt-5 min-h-10 px-4 text-sm">
              {editingStaffId ? "Save changes" : "Add staff"}
            </button>
          </form>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Staff member</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Services</th>
                <th className="px-5 py-3">Next slot</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-950">{member.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{member.id}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-700">{member.email}</p>
                    <p className="mt-1 text-xs text-slate-500">{member.phone}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{member.role}</td>
                  <td className="px-5 py-4 text-slate-600">{member.services}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{member.nextSlot}</td>
                  <td className="px-5 py-4">
                    <StaffStatusBadge status={member.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                        onClick={() => openEditStaffForm(member)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                        onClick={() => deleteStaffMember(member.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStaff.length === 0 ? (
            <div className="border-t border-slate-200 p-8 text-center">
              <p className="font-semibold text-slate-950">No staff found</p>
              <p className="mt-2 text-sm text-slate-500">Try a different search term or add a new staff member.</p>
            </div>
          ) : null}
        </div>
      </section>
    </AdminDashboardLayout>
  );
}

function StaffStatusBadge({ status }: { status: StaffStatus }) {
  const statusClass = {
    Active: "bg-emerald-50 text-emerald-700",
    "On leave": "bg-amber-50 text-amber-700",
    Inactive: "bg-slate-100 text-slate-600"
  }[status];

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
      {status}
    </span>
  );
}
