import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireDriver } from "@/lib/session";
import { licenceLabel } from "@/lib/constants";
import { dateTime, money } from "@/lib/format";
import { Empty, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "My work" };

export default async function DriverBookingsPage() {
  const { user, driver } = await requireDriver();
  const [bookings, applications] = await Promise.all([
    db.booking.findMany({
      where: { driverId: driver.id },
      include: { job: true, company: { select: { companyName: true } }, reviews: { where: { authorId: user.id }, select: { id: true } } },
      orderBy: { job: { startAt: "desc" } },
    }),
    db.application.findMany({
      where: { driverId: driver.id, status: { in: ["APPLIED", "INVITED"] }, job: { status: "OPEN" } },
      include: { job: { include: { company: { select: { companyName: true } } } } },
      orderBy: { job: { startAt: "asc" } },
    }),
  ]);
  const upcoming = bookings.filter((b) => b.status === "CONFIRMED");
  const past = bookings.filter((b) => b.status !== "CONFIRMED");
  const invites = applications.filter((a) => a.status === "INVITED");
  const pending = applications.filter((a) => a.status === "APPLIED");

  const Row = ({ href, title, sub, right, badge }: { href: string; title: string; sub: string; right: string; badge?: string }) => (
    <Link href={href} className="card flex items-center justify-between gap-3 p-4 hover:border-navy-700">
      <div className="min-w-0">
        <p className="font-semibold text-navy-900">{title}</p>
        <p className="truncate text-sm text-slate-500">{sub}</p>
        {badge && (
          <div className="mt-1.5">
            <StatusBadge status={badge} />
          </div>
        )}
      </div>
      <p className="shrink-0 text-lg font-extrabold text-navy-900">{right}</p>
    </Link>
  );

  return (
    <div className="page max-w-2xl space-y-6">
      <h1 className="h1">My work</h1>

      {invites.length > 0 && (
        <section className="space-y-2">
          <h2 className="h2">📩 Invites for you</h2>
          {invites.map((a) => (
            <Row
              key={a.id}
              href={`/jobs/${a.jobId}`}
              title={`${licenceLabel(a.job.licenceClass)} · ${a.job.company.companyName}`}
              sub={`${dateTime(a.job.startAt)} · ${a.job.town ?? a.job.postcode}`}
              right={money(a.job.payAmount)}
              badge="INVITED"
            />
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="h2">Upcoming bookings</h2>
        {upcoming.length ? (
          upcoming.map((b) => (
            <Row
              key={b.id}
              href={`/bookings/${b.id}`}
              title={`${licenceLabel(b.job.licenceClass)} · ${b.company.companyName}`}
              sub={`${dateTime(b.job.startAt)} · ${b.job.town ?? b.job.postcode}`}
              right={money(b.job.payAmount)}
              badge="CONFIRMED"
            />
          ))
        ) : (
          <Empty title="No bookings yet">
            <Link href="/driver" className="font-semibold text-brand-600 underline">
              Browse jobs near you
            </Link>
          </Empty>
        )}
      </section>

      {pending.length > 0 && (
        <section className="space-y-2">
          <h2 className="h2">Waiting for reply</h2>
          {pending.map((a) => (
            <Row
              key={a.id}
              href={`/jobs/${a.jobId}`}
              title={`${licenceLabel(a.job.licenceClass)} · ${a.job.company.companyName}`}
              sub={`${dateTime(a.job.startAt)} · ${a.job.town ?? a.job.postcode}`}
              right={money(a.job.payAmount)}
              badge="APPLIED"
            />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-2">
          <h2 className="h2">Past work</h2>
          {past.map((b) => (
            <Row
              key={b.id}
              href={`/bookings/${b.id}`}
              title={`${licenceLabel(b.job.licenceClass)} · ${b.company.companyName}`}
              sub={`${dateTime(b.job.startAt)}${b.status === "COMPLETED" && !b.reviews.length ? " · ⭐ Leave a review" : ""}`}
              right={money(b.job.payAmount)}
              badge={b.status}
            />
          ))}
        </section>
      )}
    </div>
  );
}
