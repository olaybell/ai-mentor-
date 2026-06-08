import type { AIInsight } from "../../types/booking";

type AIInsightCardProps = {
  insight: AIInsight;
};

const riskTone = {
  Low: "bg-emerald-50 text-emerald-700",
  Medium: "bg-amber-50 text-amber-700",
  High: "bg-rose-50 text-rose-700"
};

export function AIInsightCard({ insight }: AIInsightCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-300">AI Scheduling Insight</p>
          <h2 className="mt-1 text-xl font-semibold">Booking quality check</h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskTone[insight.conflictRisk]}`}>
          {insight.conflictRisk} risk
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <InsightMetric label="Recommended slot" value={insight.recommendedSlot} />
        <InsightMetric label="Utilisation" value={insight.utilisation} />
        <InsightMetric label="Confidence" value={`${insight.confidence}%`} />
      </div>
      <p className="mt-5 text-sm leading-6 text-slate-300">{insight.explanation}</p>
      {insight.recommendations && insight.recommendations.length > 0 ? (
        <div className="mt-5 space-y-3">
          {insight.recommendations.slice(0, 3).map((recommendation) => (
            <div key={recommendation.slotId} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">
                  #{recommendation.rank} {recommendation.time}
                </p>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                  {recommendation.confidence}% confidence
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{recommendation.rationale}</p>
            </div>
          ))}
        </div>
      ) : null}
      <p className="mt-4 text-xs font-medium text-slate-400">
        {insight.fallbackUsed ? "Heuristic fallback active" : "LLM ranking active"}
      </p>
    </section>
  );
}

function InsightMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
