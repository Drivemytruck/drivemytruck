import type { Reliability } from "@/lib/reliability";
import type { Tx } from "@/lib/tx";

/** Small chips summarising someone's track record. */
export function ReliabilityBadges({ r, role, tx = (s) => s }: { r: Reliability | undefined; role: "DRIVER" | "COMPANY"; tx?: Tx }) {
  if (!r) return null;
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {r.score == null ? (
        <span className="chip bg-slate-100 text-slate-600">
          {r.completed ? tx(r.completed === 1 ? "{n} job completed" : "{n} jobs completed", { n: r.completed }) : tx("New on Drive My Truck")}
        </span>
      ) : (
        <span className={`chip ${r.score >= 90 ? "bg-emerald-50 text-emerald-700" : r.score >= 75 ? "bg-amber-50 text-amber-700" : "bg-brand-50 text-brand-700"}`}>
          {r.score >= 90 ? "✓ " : ""}
          {tx(r.completed === 1 ? "{p}% reliable · {n} job" : "{p}% reliable · {n} jobs", { p: r.score, n: r.completed })}
        </span>
      )}
      {role === "DRIVER" && r.noShows > 0 && (
        <span className="chip bg-brand-50 text-brand-700">⚠ {tx(r.noShows === 1 ? "{n} no-show" : "{n} no-shows", { n: r.noShows })}</span>
      )}
      {r.lateCancels > 0 && (
        <span className="chip bg-amber-50 text-amber-700">
          {tx(r.lateCancels === 1 ? "{n} late cancellation" : "{n} late cancellations", { n: r.lateCancels })}
        </span>
      )}
    </span>
  );
}
