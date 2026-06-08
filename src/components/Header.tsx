import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Brand } from "./Brand";
import { useAuthStore } from "../store/authStore";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearSession = useAuthStore((state) => state.clearSession);
  const profileHref = user?.role === "customer" ? "/customer/dashboard" : "/dashboard/settings";

  function handleLogout() {
    clearSession();
    setIsMenuOpen(false);
    navigate("/", { replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Brand />
        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <Link to="/#features" className="hover:text-slate-950">Features</Link>
          <Link to="/#workflow" className="hover:text-slate-950">Workflow</Link>
          <Link to="/#pricing" className="hover:text-slate-950">Pricing</Link>
        </div>
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              type="button"
              className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-left transition hover:border-slate-300 hover:bg-slate-50"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                {getAvatarLabel(user.fullName || user.email)}
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block max-w-36 truncate text-sm font-semibold text-slate-950">
                  {user.fullName || user.businessName || user.email}
                </span>
                <span className="block text-xs font-medium text-slate-500">{user.roleLabel}</span>
              </span>
            </button>

            {isMenuOpen ? (
              <div
                className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
                role="menu"
              >
                <Link
                  className="block rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                  to={profileHref}
                  role="menuitem"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <NavLink className="hidden text-sm font-semibold text-slate-700 hover:text-slate-950 sm:inline" to="/signin">
              Sign in
            </NavLink>
            <NavLink className="btn-primary px-5 py-2.5 text-sm" to="/signup">
              Get started
            </NavLink>
          </div>
        )}
      </nav>
    </header>
  );
}

function getAvatarLabel(value: string) {
  const parts = value.includes("@") ? value.split("@")[0].split(/[._-]/) : value.split(" ");
  const label = parts
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return label || "U";
}
