import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getTx } from "@/lib/i18n";
import { Empty } from "@/components/ui";
import { markAllRead } from "./actions";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const { tx, lang } = await getTx();
  const items = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const unread = items.filter((n) => !n.readAt).length;
  const fmt = new Intl.DateTimeFormat(lang === "pl" ? "pl-PL" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
  return (
    <div className="page max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="h1">🔔 {tx("Notifications")}</h1>
        {unread > 0 && (
          <form action={markAllRead}>
            <button className="btn-outline btn-sm">{tx("Mark all as read")}</button>
          </form>
        )}
      </div>
      {items.length ? (
        <ul className="card divide-y divide-slate-100">
          {items.map((n) => (
            <li key={n.id}>
              <a href={`/n/${n.id}`} className={`flex gap-3 p-4 hover:bg-slate-50 ${n.readAt ? "" : "bg-brand-50/50"}`}>
                <span className="text-2xl" aria-hidden>
                  {n.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${n.readAt ? "text-slate-700" : "font-bold text-navy-900"}`}>{n.title}</span>
                  {n.body && <span className="block text-xs text-slate-500">{n.body}</span>}
                  <span className="mt-0.5 block text-[11px] text-slate-400">{fmt.format(n.createdAt)}</span>
                </span>
                {!n.readAt && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" aria-label={tx("Unread")} />}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <Empty title={tx("No notifications yet")}>{tx("Invites, bookings and new jobs near you will show up here.")}</Empty>
      )}
    </div>
  );
}
