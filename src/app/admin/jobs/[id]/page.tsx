import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { licenceLabel } from "@/lib/constants";
import { dateTime, money, payUnit } from "@/lib/format";
import { Info, RowLink, Section } from "@/components/admin";
import { StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Admin · Job" };

export default async function AdminJob({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("ADMIN");
  const { id } = await params;
  const job = await db.job.findUnique({
    where: { id },
    include: {
      company: true,
      applications: { include: { driver: true }, orderBy: { createdAt: "asc" } },
      booking: { include: { driver: true } },
    },
  });
  if (!job) notFound();
  return (
    <div className="page max-w-3xl space-y-4">
      <Link href="/admin/jobs" className="text-sm text-slate-500 hover:text-navy-900">
        ← All jobs
      </Link>
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="h1">{licenceLabel(job.licenceClass)} driver</h1>
            <Link href={`/admin/users/${job.company.userId}`} className="text-slate-600 underline">
              {job.company.companyName}
            </Link>
            <div className="mt-2">
              <StatusBadge status={job.status} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-brand-500">{money(job.payAmount)}</p>
            <p className="text-xs text-slate-500">{payUnit(job.payType)}</p>
          </div>
        </div>
      </div>
      <Section title="Details">
        <Info
          rows={[
            ["Type", job.kind === "PERMANENT" ? "🤝 Permanent" : "🕒 Shift"],
            ...(job.kind === "PERMANENT"
              ? ([
                  ["Start", job.startAsap ? "ASAP" : dateTime(job.startAt)],
                  ["Pattern", job.schedule],
                  ["Employment", job.employmentType],
                  ["Benefits", job.benefits],
                  ["Expires", job.expiresAt ? dateTime(job.expiresAt) : null],
                  ["Renewed", `${job.renewCount}×`],
                ] as [string, React.ReactNode][])
              : ([
                  ["Start", dateTime(job.startAt)],
                  ["Duration", `${job.durationHours} h`],
                ] as [string, React.ReactNode][])),
            ["Location", [job.town, job.postcode].filter(Boolean).join(", ")],
            ["Job type", job.jobType],
            ["Vehicle", job.vehicleType],
            ["Description", job.description],
            ["Requirements", job.requirements],
            ["Posted", dateTime(job.createdAt)],
          ]}
        />
      </Section>
      {job.booking && (
        <Section title="Booking">
          <RowLink
            href={`/bookings/${job.booking.id}`}
            title={job.booking.driver.fullName}
            sub={`Booked ${dateTime(job.booking.createdAt)}`}
            right={<StatusBadge status={job.booking.status} />}
          />
        </Section>
      )}
      <Section title={`Drivers who responded (${job.applications.length})`}>
        {job.applications.length ? (
          <div className="divide-y divide-slate-100">
            {job.applications.map((a) => (
              <RowLink
                key={a.id}
                href={`/admin/users/${a.driver.userId}`}
                title={a.driver.fullName}
                sub={a.message ? `“${a.message}”` : dateTime(a.createdAt)}
                right={<StatusBadge status={a.status} />}
              />
            ))}
          </div>
        ) : (
          <p className="muted">Nobody yet.</p>
        )}
      </Section>
    </div>
  );
}
