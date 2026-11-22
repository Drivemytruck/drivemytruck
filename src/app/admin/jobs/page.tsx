import Link from "next/link";
import type { Metadata } from "next";
import type { JobStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { licenceLabel } from "@/lib/constants";
import { dateTime, money } from "@/lib/format";
import { RowLink } from "@/components/admin";
import { Empty, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Admin · Jobs" };

const FILTERS: { v: string; l: string }[] = [
  { v: "", l: "All" },
  { v: "OPEN", l: "Open" },
  { v: "FILLED", l: "Booked" },
  { v: "COMPLETED", l: "Completed" },
  { v: "CANCELLED", l: "Cancelled" },
];

export default async function AdminJobs({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireUser("ADMIN");
  const { status = "" } = await searchParams;
  const valid = FILTERS.some((f) => f.v === status && f.v);
  const jobs = await db.job.findMany({
    where: valid ? { status: status as JobStatus } : {},
    include: {
      company: { select: { companyName: true } },
      booking: { include: { driver: { select: { fullName: true } } } },
      _count: { select: { applications: true } },
    },
    orderBy: { startAt: "desc" },
    take: 300,
  });
  return (
    <div className="page space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="h1">Jobs ({jobs.length})</h1>
        <Link href="/admin/map" className="btn-outline btn-sm">
          🗺️ Map
        </Link>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.v}
            href={f.v ? `/admin/jobs?status=${f.v}` : "/admin/jobs"}
            className={`chip shrink-0 px-4 py-2 text-sm ${status === f.v ? "bg-navy-900 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
          >
            {f.l}
          </Link>
        ))}
      </div>
      {jobs.length ? (
        <div className="card divide-y divide-slate-100 px-4">
          {jobs.map((j) => (
            <RowLink
              key={j.id}
              href={`/admin/jobs/${j.id}`}
              title={`${j.company.companyName} · ${licenceLabel(j.licenceClass)} · ${money(j.payAmount)}${j.payType === "HOURLY" ? "/h" : ""}`}
              sub={`${dateTime(j.startAt)} · ${j.town ?? j.postcode} · ${j._count.applications} responses${j.booking ? ` · ${j.booking.driver.fullName}` : ""}`}
              right={<StatusBadge status={j.status} />}
            />
          ))}
        </div>
      ) : (
        <Empty title="No jobs" />
      )}
    </div>
  );
}
