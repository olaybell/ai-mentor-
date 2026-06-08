import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";

const stats = [
  ["42", "bookings today"],
  ["98%", "conflict-free"],
  ["12 min", "avg. admin saved"]
];

const features = [
  {
    title: "Smart availability",
    body: "Show only time slots that match staff, room, service duration and business hours."
  },
  {
    title: "Conflict checks",
    body: "Keep overlapping bookings visible before they become customer-facing problems."
  },
  {
    title: "Resource planning",
    body: "Track rooms, chairs, equipment and staff from the same scheduling workspace."
  },
  {
    title: "Simple insights",
    body: "Understand busy hours, booking trends and resource use without a complex analytics suite."
  }
];

const workflow = [
  "Create services and bookable resources",
  "Set staff availability and business rules",
  "Let customers request the best time",
  "Confirm bookings with clear conflict protection"
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Header />
      <main>
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-28">
            <div>
              <p className="section-eyebrow">AI-assisted scheduling for SMEs</p>
              <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-slate-950 md:text-6xl">
                Booking software that keeps calendars calm.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                AI-Booking helps salons, clinics, studios and consultants manage appointments,
                resources and availability from one focused dashboard.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link className="btn-primary px-6 py-3 text-sm" to="/signup">
                  Start free
                </Link>
                <a className="btn-secondary px-6 py-3 text-sm" href="#features">
                  View features
                </a>
              </div>
              <div className="mt-10 grid max-w-xl grid-cols-3 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-white">
                {stats.map(([value, label]) => (
                  <div key={label} className="p-4">
                    <p className="text-2xl font-semibold text-slate-950">{value}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <DashboardPreview />
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="section-eyebrow">Core features</p>
            <h2 className="section-title">Built around real booking clashes.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              The interface stays simple, but the product language keeps the important business rules visible.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {features.map((feature) => (
              <article key={feature.title} className="minimal-card">
                <h3 className="text-lg font-semibold text-slate-950">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow" className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[0.75fr_1fr]">
            <div>
              <p className="section-eyebrow">Workflow</p>
              <h2 className="section-title">From setup to confirmed booking.</h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                A practical flow for small teams that need fewer errors, not more software to manage.
              </p>
            </div>
            <div className="space-y-3">
              {workflow.map((item, index) => (
                <div key={item} className="flex gap-4 rounded-lg border border-slate-200 bg-white p-5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="pt-1 font-medium text-slate-800">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="section-eyebrow">Free to start</p>
              <h2 className="section-title">Launch the first booking flow without complexity.</h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                Add authentication and backend booking rules as the next layer, while the frontend remains clean and easy to extend.
              </p>
            </div>
            <Link className="btn-primary px-6 py-3 text-sm" to="/signup">
              Create account
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function DashboardPreview() {
  const bookings = [
    ["09:00", "Consultation", "Room 1", "Confirmed"],
    ["10:30", "Hair styling", "Chair 3", "Conflict check"],
    ["13:00", "Training session", "Studio", "Suggested"]
  ];

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">Today</p>
          <p className="text-sm text-slate-500">Wednesday, May 20</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Open
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {bookings.map(([time, service, resource, status]) => (
          <div key={`${time}-${service}`} className="grid grid-cols-[64px_1fr] gap-4 rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-950">{time}</p>
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-900">{service}</p>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{resource}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-lg bg-slate-950 p-4 text-white">
        <p className="text-sm font-semibold">AI suggestion</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Move the 10:30 booking to 11:15 to avoid a chair overlap and keep the same staff member.
        </p>
      </div>
    </aside>
  );
}
