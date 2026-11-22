import type { Reliability } from "@/lib/reliability";

/** Small chips summarising someone's track record. */
export function ReliabilityBadges({ r, role }: { r: Reliability | undefined; role: "DRIVER" | "COMPANY" }) {
  if (!r) return null;
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {r.score == null ? (
        <span className="chip bg-slate-100 text-slate-600">
          {r.completed ? `${r.completed} ${r.completed === 1 ? "job" : "jobs"} completed` : "New on Drive My Truck"}
        </span>
      ) : (
        <span className={`chip ${r.score >= 90 ? "bg-emerald-50 text-emerald-700" : r.score >= 75 ? "bg-amber-50 text-amber-700" : "bg-brand-50 text-brand-700"}`}>
          {r.score >= 90 ? "✓ " : ""}
          {r.score}% reliable · {r.completed} {r.completed === 1 ? "job" : "jobs"}
        </span>
      )}
      {role === "DRIVER" && r.noShows > 0 && (
        <span className="chip bg-brand-50 text-brand-700">⚠ {r.noShows} no-show{r.noShows > 1 ? "s" : ""}</span>
      )}
      {r.lateCancels > 0 && (
        <span className="chip bg-amber-50 text-amber-700">
          {r.lateCancels} late cancellation{r.lateCancels > 1 ? "s" : ""}
        </span>
      )}
    </span>
  );
}
