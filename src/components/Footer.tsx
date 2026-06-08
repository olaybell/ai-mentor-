import { Link } from "react-router-dom";
import { Brand } from "./Brand";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <Brand light />
        <div className="flex flex-wrap gap-5 text-sm text-slate-300">
          <Link to="/#features" className="hover:text-white">Features</Link>
          <Link to="/#workflow" className="hover:text-white">Workflow</Link>
          <Link to="/#pricing" className="hover:text-white">Pricing</Link>
          <Link to="/signin" className="hover:text-white">Sign in</Link>
        </div>
        <p className="text-sm text-slate-400">2026 AI-Booking. All rights reserved.</p>
      </div>
    </footer>
  );
}
