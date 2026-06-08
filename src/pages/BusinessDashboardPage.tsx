import { useQuery } from "@tanstack/react-query";
import { AdminDashboardLayout } from "../components/AdminDashboardLayout";
import { fetchAnalyticsOverview, type DashboardInsight } from "../lib/api";

type Stat = {
  label: string;
  value: string;
  change: string;
  tone: "slate" | "emerald" | "amber" | "rose";
};

export function BusinessDashboardPage() {
  const {
    data: overview,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: fetchAnalyticsOverview,
  });

  const stats = overview ? createStats(overview.metrics) : [];
  const insights = overview?.aiInsights ?? [];

  return (
    <AdminDashboardLayout title="Admin Dashboard">
      {isError ? (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          Unable to load dashboard metrics: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      ) : null}

      <section id="dashboard" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => <LoadingStatCard key={index} />)
          : stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <section id="ai-insights" className="scroll-mt-28 rounded-lg border border-slate-200 bg-slate-950 p-5 text-white">
          <p className="text-sm font-semibold text-slate-300">AI Insights</p>
          <h2 className="mt-1 text-xl font-semibold">Action queue</h2>
          <div className="mt-5 space-y-4">
            {isLoading ? (
              <p className="text-sm text-slate-300">Loading scheduling insight...</p>
            ) : (
              insights.map((insight) => <InsightArticle key={insight.title} insight={insight} />)
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-500">Specialist utilisation</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Workload snapshot</h2>
          <div className="mt-5 space-y-4">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading utilisation...</p>
            ) : (
              overview?.utilisation.slice(0, 4).map((item) => (
                <div key={item.specialist_id} className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-950">{item.specialist_name}</p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {item.total_bookings} bookings
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{Math.round(item.booked_minutes || 0)} booked minutes</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AdminDashboardLayout>
  );
}

function createStats(metrics: {
  bookingsToday: number;
  bookingDelta: number;
  resourceUtilisation: number;
  potentialConflicts: number;
  cancelledSlots: number;
  rebookableGaps: number;
}): Stat[] {
  return [
    {
      label: "Bookings today",
      value: String(metrics.bookingsToday),
      change: formatDelta(metrics.bookingDelta),
      tone: "slate",
    },
    {
      label: "Resource utilisation",
      value: `${metrics.resourceUtilisation}%`,
      change: metrics.resourceUtilisation >= 85 ? "High capacity" : "Healthy capacity",
      tone: metrics.resourceUtilisation >= 85 ? "amber" : "emerald",
    },
    {
      label: "Potential conflicts",
      value: String(metrics.potentialConflicts),
      change: metrics.potentialConflicts > 0 ? "Needs review" : "Clear queue",
      tone: metrics.potentialConflicts > 0 ? "amber" : "emerald",
    },
    {
      label: "Cancelled slots",
      value: String(metrics.cancelledSlots),
      change: `${metrics.rebookableGaps} rebookable gap${metrics.rebookableGaps === 1 ? "" : "s"}`,
      tone: metrics.cancelledSlots > 0 ? "rose" : "slate",
    },
  ];
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

function LoadingStatCard() {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="h-4 w-28 rounded bg-slate-100" />
      <div className="mt-4 h-9 w-20 rounded bg-slate-100" />
    </article>
  );
}

function InsightArticle({ insight }: { insight: DashboardInsight }) {
  return (
    <article className="border-t border-white/10 pt-4">
      <h3 className="text-sm font-semibold text-white">{insight.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{insight.body}</p>
    </article>
  );
}

function formatDelta(value: number) {
  if (value === 0) {
    return "No change";
  }

  return `${value > 0 ? "+" : ""}${value} from yesterday`;
}
