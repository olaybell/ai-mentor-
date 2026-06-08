import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminDashboardLayout } from "../components/AdminDashboardLayout";
import { createResource, deleteResource as deleteResourceRequest, fetchResources, updateResource } from "../lib/api";

type ResourceStatus = "Available" | "Busy" | "Maintenance" | "Inactive";

type Resource = {
  id: number;
  name: string;
  type: string;
  location: string;
  capacity: string;
  usage: number;
  status: ResourceStatus;
};

type ResourceFormState = Omit<Resource, "id">;

// resources are loaded from the backend via React Query

const emptyResourceForm: ResourceFormState = {
  name: "",
  type: "",
  location: "",
  capacity: "",
  usage: 0,
  status: "Available"
};

export function BusinessResourcesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ResourceStatus>("All");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<number | null>(null);
  const [resourceForm, setResourceForm] = useState<ResourceFormState>(emptyResourceForm);
  const queryClient = useQueryClient();

  const {
    data: resourcesData = [],
    isLoading: resourcesLoading,
    isError: resourcesHasError,
    error: resourcesError
  } = useQuery<Resource[]>({
    queryKey: ["resources"],
    queryFn: fetchResources,
  });

  const createMutation = useMutation({
    mutationFn: (payload: ResourceFormState) => createResource(payload),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      closeResourceForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ResourceFormState }) => updateResource(id, payload),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      closeResourceForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteResourceRequest(id),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    }
  });

  const filteredResources = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return resourcesData
      .filter((resource) => statusFilter === "All" || resource.status === statusFilter)
      .filter((resource) => {
        if (!query) {
          return true;
        }

        return [
          resource.name,
          resource.type,
          resource.location,
          resource.capacity,
          resource.status
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      });
  }, [resourcesData, searchQuery, statusFilter]);

  function openAddResourceForm() {
    setEditingResourceId(null);
    setResourceForm(emptyResourceForm);
    setIsFormOpen(true);
  }

  function openEditResourceForm(resource: Resource) {
    setEditingResourceId(resource.id);
    setResourceForm({
      name: resource.name,
      type: resource.type,
      location: resource.location,
      capacity: resource.capacity,
      usage: resource.usage,
      status: resource.status
    });
    setIsFormOpen(true);
  }

  function closeResourceForm() {
    setEditingResourceId(null);
    setResourceForm(emptyResourceForm);
    setIsFormOpen(false);
  }

  function updateResourceForm(field: keyof ResourceFormState, value: string | number) {
    setResourceForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function saveResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingResourceId) {
      updateMutation.mutate({ id: editingResourceId, payload: resourceForm });
      return;
    }

    createMutation.mutate(resourceForm);
  }

  function deleteResource(resourceId: number) {
    deleteMutation.mutate(resourceId);
  }

  return (
    <AdminDashboardLayout title="Resources">
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Resource</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">Bookable resources</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage rooms, equipment, service stations and shared spaces that can create booking conflicts.
            </p>
          </div>
          <button type="button" className="btn-primary min-h-10 px-4 text-sm" onClick={openAddResourceForm}>
            Add resource
          </button>
        </div>

        <div className="grid gap-4 border-b border-slate-200 p-5 lg:grid-cols-[1fr_180px]">
          <label className="form-field">
            <span>Search resources</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, type, location, capacity or status"
            />
          </label>
          <label className="form-field">
            <span>Status</span>
            <select
              className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "All" | ResourceStatus)}
            >
              <option>All</option>
              <option>Available</option>
              <option>Busy</option>
              <option>Maintenance</option>
              <option>Inactive</option>
            </select>
          </label>
        </div>

        {resourcesHasError ? (
          <div className="border-b border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            Unable to load resources: {resourcesError instanceof Error ? resourcesError.message : "Unknown error"}
          </div>
        ) : null}

        {isFormOpen ? (
          <form className="border-b border-slate-200 bg-slate-50 p-5" onSubmit={saveResource}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-950">
                  {editingResourceId ? "Edit resource" : "Add resource"}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Keep resource details accurate so staff and bookings do not overlap.
                </p>
              </div>
              <button type="button" className="btn-secondary min-h-10 px-4 text-sm" onClick={closeResourceForm}>
                Cancel
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="form-field">
                <span>Name</span>
                <input
                  type="text"
                  value={resourceForm.name}
                  onChange={(event) => updateResourceForm("name", event.target.value)}
                  placeholder="Room 1"
                  required
                />
              </label>
              <label className="form-field">
                <span>Type</span>
                <input
                  type="text"
                  value={resourceForm.type}
                  onChange={(event) => updateResourceForm("type", event.target.value)}
                  placeholder="Consultation room"
                  required
                />
              </label>
              <label className="form-field">
                <span>Location</span>
                <input
                  type="text"
                  value={resourceForm.location}
                  onChange={(event) => updateResourceForm("location", event.target.value)}
                  placeholder="First floor"
                  required
                />
              </label>
              <label className="form-field">
                <span>Capacity</span>
                <input
                  type="text"
                  value={resourceForm.capacity}
                  onChange={(event) => updateResourceForm("capacity", event.target.value)}
                  placeholder="1 staff, 2 customers"
                  required
                />
              </label>
              <label className="form-field">
                <span>Usage today (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={resourceForm.usage}
                  onChange={(event) => updateResourceForm("usage", Number(event.target.value))}
                  required
                />
              </label>
              <label className="form-field">
                <span>Status</span>
                <select
                  className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-200"
                  value={resourceForm.status}
                  onChange={(event) => updateResourceForm("status", event.target.value as ResourceStatus)}
                >
                  <option>Available</option>
                  <option>Busy</option>
                  <option>Maintenance</option>
                  <option>Inactive</option>
                </select>
              </label>
            </div>

            <button type="submit" className="btn-primary mt-5 min-h-10 px-4 text-sm">
              {editingResourceId ? "Save changes" : "Add resource"}
            </button>
          </form>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Resource</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Capacity</th>
                <th className="px-5 py-3">Usage</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {resourcesLoading ? (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={7}>
                    Loading resources...
                  </td>
                </tr>
              ) : (
                filteredResources.map((resource) => (
                <tr key={resource.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-950">{resource.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{resource.id}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{resource.type}</td>
                  <td className="px-5 py-4 text-slate-600">{resource.location}</td>
                  <td className="px-5 py-4 text-slate-600">{resource.capacity}</td>
                  <td className="px-5 py-4">
                    <div className="h-2 w-32 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-slate-950" style={{ width: `${resource.usage}%` }} />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{resource.usage}%</p>
                  </td>
                  <td className="px-5 py-4">
                    <ResourceStatusBadge status={resource.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                        onClick={() => openEditResourceForm(resource)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                        onClick={() => deleteResource(resource.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredResources.length === 0 ? (
            <div className="border-t border-slate-200 p-8 text-center">
              <p className="font-semibold text-slate-950">No resources found</p>
              <p className="mt-2 text-sm text-slate-500">Try a different search term or add a new resource.</p>
            </div>
          ) : null}
        </div>
      </section>
    </AdminDashboardLayout>
  );
}

function ResourceStatusBadge({ status }: { status: ResourceStatus }) {
  const statusClass = {
    Available: "bg-emerald-50 text-emerald-700",
    Busy: "bg-sky-50 text-sky-700",
    Maintenance: "bg-amber-50 text-amber-700",
    Inactive: "bg-slate-100 text-slate-600"
  }[status];

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
      {status}
    </span>
  );
}
