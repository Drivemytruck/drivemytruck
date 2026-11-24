import { dismissNotification } from "@/app/notifications/actions";
import type { Tx } from "@/lib/tx";

/** The "in your face" bar under the header for the newest unread notification. */
export function NotificationBanner({ n, more, tx }: { n: { id: string; icon: string; title: string; body: string | null }; more: number; tx: Tx }) {
  return (
    <div className="border-b border-brand-100 bg-brand-50">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <a href={`/n/${n.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <span className="text-xl" aria-hidden>
            {n.icon}
          </span>
          <span className="min-w-0">
            <span className="line-clamp-2 block text-sm leading-snug font-bold text-navy-900">{n.title}</span>
            <span className="block truncate text-xs text-slate-600">
              {n.body ?? ""}
              {more > 0 && <span className="font-semibold text-brand-700"> · {tx("+{n} more", { n: more })}</span>}
            </span>
          </span>
          <span className="btn-primary btn-sm shrink-0">{tx("View")}</span>
        </a>
        <form action={dismissNotification}>
          <input type="hidden" name="id" value={n.id} />
          <button className="rounded-full p-1.5 text-slate-400 hover:bg-white hover:text-slate-700" aria-label={tx("Dismiss")}>
            ✕
          </button>
        </form>
      </div>
    </div>
  );
}
