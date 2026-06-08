import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Brand } from "./Brand";
import { useAuthStore } from "../store/authStore";

type NavItem = {
  label: string;
  path: string;
  icon: "grid" | "calendar" | "pages" | "resource" | "staff" | "settings";
  hash?: string;
};

type AdminDashboardLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

const sidebarItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: "grid" },
  { label: "Calendar", path: "/dashboard/calendar", icon: "calendar" },
  { label: "Booking Pages", path: "/dashboard/booking-pages", icon: "pages" },
  { label: "Resource", path: "/dashboard/resources", icon: "resource" },
  { label: "Staff", path: "/dashboard/staff", icon: "staff" },
  { label: "Settings", path: "/dashboard/settings", icon: "settings" }
];

export function AdminDashboardLayout({
  children,
  title,
  subtitle = "Business owner workspace"
}: AdminDashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  function handleLogout() {
    clearSession();
    navigate("/signin", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white px-5 py-6 lg:flex lg:flex-col">
        <Brand />
        <nav className="mt-10 space-y-1" aria-label="Business owner dashboard">
          {sidebarItems.map((item) => (
            <SidebarLink
              key={item.label}
              item={item}
              isActive={isSidebarItemActive(item, location.pathname, location.hash)}
            />
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">{user?.businessName || "Business workspace"}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Open today, 08:00 to 18:00. Conflict checks are active.
            </p>
          </div>
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-20 items-center justify-between gap-4 px-5 sm:px-8">
            <div className="lg:hidden">
              <Brand />
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-slate-500">{subtitle}</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-950">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="hidden min-h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 sm:inline-flex sm:items-center">
                Export
              </button>
              <Link className="btn-primary min-h-10 px-4 text-sm" to="/dashboard/calendar">
                New booking
              </Link>
              <button
                type="button"
                className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-slate-200 px-5 py-3 lg:hidden" aria-label="Mobile dashboard navigation">
            {sidebarItems.map((item) => (
              <Link
                key={item.label}
                className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold ${
                  isSidebarItemActive(item, location.pathname, location.hash)
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
                to={`${item.path}${item.hash ?? ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="px-5 py-6 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

function SidebarLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${
        isActive
          ? "bg-slate-950 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
      }`}
      to={`${item.path}${item.hash ?? ""}`}
    >
      <DashboardIcon name={item.icon} />
      {item.label}
    </Link>
  );
}

function isSidebarItemActive(item: NavItem, pathname: string, hash: string) {
  if (item.path !== "/dashboard") {
    return pathname === item.path;
  }

  if (pathname !== "/dashboard") {
    return false;
  }

  const activeHash = hash || "#dashboard";
  return (item.hash ?? "#dashboard") === activeHash;
}

function DashboardIcon({ name }: { name: NavItem["icon"] }) {
  const path = {
    grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
    calendar: "M7 3v3M17 3v3M5 8h14M6 5h12a2 2 0 0 1 2 2v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a2 2 0 0 1 2-2Z",
    pages: "M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM14 3v5h5M8 13h8M8 17h6",
    resource: "M5 7h14M7 7v12M17 7v12M4 19h16M8 4h8l2 3H6z",
    staff: "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 21v-2a3 3 0 0 0-2-2.83M16 3.13a4 4 0 0 1 0 7.75",
    settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 0 1-4 0v-.08a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 0 1 0-4h.04A1.7 1.7 0 0 0 4.6 8.92a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34A1.7 1.7 0 0 0 10 3.08V3a2 2 0 0 1 4 0v.08a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87 1.7 1.7 0 0 0 1.56 1.04H21a2 2 0 0 1 0 4h-.04A1.7 1.7 0 0 0 19.4 15Z"
  }[name];

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path
        d={path}
        fill={name === "grid" ? "currentColor" : "none"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={name === "grid" ? "0" : "1.8"}
      />
    </svg>
  );
}
