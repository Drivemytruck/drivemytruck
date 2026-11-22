import { dateOnly } from "@/lib/format";
import { Stars } from "./ui";

export function ReviewList({
  summary,
}: {
  summary: { average: number | null; count: number; reviews: { id: string; rating: number; comment: string | null; createdAt: Date; authorName: string }[] };
}) {
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="h2">Reviews</h2>
        <Stars value={summary.average} count={summary.count} size="lg" />
      </div>
      {summary.reviews.length ? (
        <ul className="mt-4 divide-y divide-slate-100">
          {summary.reviews.map((r) => (
            <li key={r.id} className="py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">{r.authorName}</span>
                <span className="text-xs text-slate-400">{dateOnly(r.createdAt)}</span>
              </div>
              <Stars value={r.rating} />
              {r.comment && <p className="mt-1 text-sm text-slate-700">{r.comment}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">No reviews yet. Reviews appear after completed jobs.</p>
      )}
    </section>
  );
}
