import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AdminDashboardLayout } from "../components/AdminDashboardLayout";

type Stat = {
  label: string;
  value: string;
  change: string;
  tone: "slate" | "emerald" | "amber" | "rose";
};

const stats: Stat[] = [
  { label: "Bookings today", value: "42", change: "+8 from yesterday", tone: "slate" },
  { label: "Resource utilisation", value: "76%", change: "Healthy capacity", tone: "emerald" },
  { label: "Potential conflicts", value: "3", change: "Needs admin review", tone: "amber" },
  { label: "Cancelled slots", value: "2", change: "1 rebookable gap", tone: "rose" }
];

const insightCards = [
  {
    title: "Conflict risk",
    body: "Room 2 and Dr. Mason overlap at 10:30. Move Jon Bell to 12:00 or assign Ife to keep the slot."
  },
  {
    title: "Demand pattern",
    body: "Tuesday and Wednesday mornings are filling first. Open one extra consultation block before adding new services."
  },
  {
    title: "Rebooking opportunity",
    body: "The 16:00 cancellation leaves a 45-minute gap that matches two pending wellness requests."
  }
];

export function BusinessDashboardPage() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0 });
      return;
    }

    document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [location.hash]);

  return (
    <AdminDashboardLayout title="Admin Dashboard">
      <section id="dashboard" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <div className="mt-6">
        <section id="ai-insights" className="scroll-mt-28 rounded-lg border border-slate-200 bg-slate-950 p-5 text-white">
          <p className="text-sm font-semibold text-slate-300">AI Insights</p>
          <h2 className="mt-1 text-xl font-semibold">Action queue</h2>
          <div className="mt-5 space-y-4">
            {insightCards.map((insight) => (
              <article key={insight.title} className="border-t border-white/10 pt-4">
                <h3 className="text-sm font-semibold text-white">{insight.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{insight.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AdminDashboardLayout>
  );
}

function StatCard({ stat }: { stat: Stat }) {
  const toneClass = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700"
  }[stat.tone];

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold text-slate-950">{stat.value}</p>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>{stat.change}</span>
      </div>
    </article>
  );
}
