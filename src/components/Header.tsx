import { Link, NavLink } from "react-router-dom";
import { Brand } from "./Brand";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Brand />
        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <Link to="/book" className="hover:text-slate-950">Book Appointment</Link>
          <Link to="/#features" className="hover:text-slate-950">Features</Link>
          <Link to="/#workflow" className="hover:text-slate-950">Workflow</Link>
          <Link to="/#pricing" className="hover:text-slate-950">Pricing</Link>
        </div>
        <div className="flex items-center gap-3">
          <NavLink className="hidden text-sm font-semibold text-slate-700 hover:text-slate-950 sm:inline" to="/signin">
            Sign in
          </NavLink>
          <NavLink className="btn-primary px-5 py-2.5 text-sm" to="/signup">
            Get started
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
