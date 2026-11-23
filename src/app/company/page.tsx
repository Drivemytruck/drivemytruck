import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { licenceLabel } from "@/lib/constants";
import { dateTime, money } from "@/lib/format";
import { Empty, Stat, StatusBadge } from "@/components/ui";
import { todayDate } from "@/lib/availability";
import { daysLeft, isLive } from "@/lib/jobs";

export const metadata: Metadata = { title: "Dashboard" };

export default async function CompanyHome() {
  const { company } = await requireCompany();
  const now = new Date();
  const [jobs, bookedThisMonth, availableToday] = await Promise.all([
    db.job.findMany({
      where: { companyId: company.id, OR: [{ status: { in: ["OPEN", "FILLED"] } }, { startAt: { gte: new Date(now.getTime() - 14 * 86400000) } }] },
      include: {
        _count: { select: { applications: { where: { status: "APPLIED" } } } },
        booking: { include: { driver: { select: { fullName: true } } } },
      },
      orderBy: { startAt: "asc" },
      take: 50,
    }),
    db.booking.count({
      where: { companyId: company.id, createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) }, status: { not: "CANCELLED" } },
    }),
    db.availability.count({ where: { date: todayDate(), driver: { user: { suspended: false } } } }),
  ]);
  const open = jobs.filter((j) => j.status === "OPEN");
  const needsAction = jobs.filter((j) => j.booking?.status === "CONFIRMED" && j.startAt < now);

  return (
    <div className="page space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1">Welcome back, {company.companyName}</h1>
          <p className="muted">Find drivers. Keep moving.</p>
        </div>
        <Link href="/company/jobs/new" className="btn-primary">
          + Post a job
        </Link>
      </div>

      {!company.phone && (
        <div className="card border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Complete your company profile</p>
          <p className="mt-1">Drivers are more likely to accept work from companies with a full, verified profile.</p>
          <Link href="/company/profile" className="btn-navy btn-sm mt-3">
            Complete profile
          </Link>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Open jobs" value={open.length} />
        <Stat label="Drivers available today" value={availableToday} />
        <Stat label="Booked this month" value={bookedThisMonth} />
      </div>

      {needsAction.length > 0 && (
        <section className="space-y-2">
          <h2 className="h2">⭐ Mark as done & review</h2>
          {needsAction.map((j) => (
            <Link key={j.id} href={`/bookings/${j.booking!.id}`} className="card flex items-center justify-between p-4 hover:border-navy-700">
              <span>
                <span className="block font-semibold text-navy-900">{j.booking!.driver.fullName}</span>
                <span className="text-sm text-slate-500">
                  {licenceLabel(j.licenceClass)} · {dateTime(j.startAt)}
                </span>
              </span>
              <span className="btn-navy btn-sm">Complete</span>
            </Link>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="h2">Your jobs</h2>
        {jobs.length ? (
          jobs.map((j) => (
            <Link key={j.id} href={`/company/jobs/${j.id}`} className="card flex items-center justify-between gap-3 p-4 hover:border-navy-700">
              <div className="min-w-0">
                <p className="font-semibold text-navy-900">
                  {j.kind === "PERMANENT" && "🤝 "}
                  {licenceLabel(j.licenceClass)} · {j.town ?? j.postcode}
                </p>
                <p className="text-sm text-slate-500">
                  {j.kind === "PERMANENT" ? `Permanent · ${j.schedule ?? ""}` : dateTime(j.startAt)}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {j.kind === "PERMANENT" && j.status === "OPEN" ? (
                    isLive(j) ? (
                      <span className={`chip ${daysLeft(j.expiresAt) <= 3 ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>
                        Live · {daysLeft(j.expiresAt)}d left
                      </span>
                    ) : (
                      <span className="chip bg-slate-200 text-slate-700">Expired — renew</span>
                    )
                  ) : j.kind === "PERMANENT" && j.status === "FILLED" ? (
                    <span className="chip bg-emerald-50 text-emerald-700">Hired</span>
                  ) : (
                    <StatusBadge status={j.status} />
                  )}
                  {j.status === "OPEN" && j._count.applications > 0 && (
                    <span className="chip bg-brand-500 text-white">
                      {j._count.applications} {j.kind === "PERMANENT" ? "interested" : "available driver(s)"}
                    </span>
                  )}
                  {j.booking && j.status !== "CANCELLED" && <span className="chip bg-navy-50 text-navy-800">{j.booking.driver.fullName}</span>}
                </div>
              </div>
              <p className="shrink-0 text-lg font-extrabold text-navy-900">{money(j.payAmount)}</p>
            </Link>
          ))
        ) : (
          <Empty title="No jobs yet">
            Post your first job — it takes under a minute.{" "}
            <Link href="/company/jobs/new" className="font-semibold text-brand-600 underline">
              Post a job
            </Link>
          </Empty>
        )}
      </section>
    </div>
  );
}
