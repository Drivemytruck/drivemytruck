import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { drivableClasses, licenceLabel } from "@/lib/constants";
import { dateTime, money } from "@/lib/format";
import { distanceMiles } from "@/lib/geo";
import { ratingSummaries } from "@/lib/reviews";
import { ActionForm, SubmitButton } from "@/components/forms";
import { DriverCard } from "@/components/DriverCard";
import { Empty, StatusBadge } from "@/components/ui";
import { acceptApplicant, cancelJob, inviteDriver } from "../../actions";

export const metadata: Metadata = { title: "Job" };

/** Which licence classes can do a job of this class (reverse of drivableClasses). */
function classesThatCover(jobClass: string) {
  return ["C+E", "C", "C1"].filter((c) => drivableClasses([c]).includes(jobClass));
}

export default async function CompanyJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ posted?: string }>;
}) {
  const { id } = await params;
  const { posted } = await searchParams;
  const { company } = await requireCompany();
  const job = await db.job.findUnique({
    where: { id },
    include: {
      applications: { include: { driver: { include: { user: { select: { id: true } } } } }, orderBy: { createdAt: "asc" } },
      booking: { include: { driver: true } },
    },
  });
  if (!job || job.companyId !== company.id) notFound();

  const applicants = job.applications.filter((a) => a.status === "APPLIED");
  const invited = job.applications.filter((a) => a.status === "INVITED");
  const alreadyInvolved = new Set(job.applications.map((a) => a.driverId));

  // Suggest drivers who are available that day (or today), hold the right class and are within their travel radius.
  const jobDay = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(job.startAt) + "T00:00:00Z");
  const isToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date()) === jobDay.toISOString().slice(0, 10);
  const suggestions =
    job.status === "OPEN"
      ? (
          await db.driverProfile.findMany({
            where: {
              id: { notIn: [...alreadyInvolved] },
              user: { suspended: false },
              licenceClasses: { hasSome: classesThatCover(job.licenceClass) },
              OR: [{ availability: { some: { date: jobDay } } }, ...(isToday ? [{ availableToday: true }] : [])],
            },
            include: { user: { select: { id: true } } },
            take: 100,
          })
        )
          .map((d) => ({ d, distance: distanceMiles(d, job) }))
          .filter(({ d, distance }) => distance == null || distance <= d.travelRadiusMiles)
          .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999))
          .slice(0, 10)
      : [];

  const ratings = await ratingSummaries([
    ...job.applications.map((a) => a.driver.user.id),
    ...suggestions.map((s) => s.d.user.id),
  ]);

  return (
    <div className="page max-w-3xl space-y-5">
      <Link href="/company" className="text-sm text-slate-500 hover:text-navy-900">
        ← Dashboard
      </Link>
      {posted && (
        <div className="card border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          ✅ Your job is live. Drivers nearby can now see it — you can also invite available drivers below.
        </div>
      )}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="h1">{licenceLabel(job.licenceClass)} driver</h1>
            <p className="mt-1 text-slate-600">
              📍 {job.town ? `${job.town}, ` : ""}
              {job.postcode} · 🕒 {dateTime(job.startAt)} · ⏱️ {job.durationHours} h
            </p>
            <div className="mt-2">
              <StatusBadge status={job.status} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-brand-500">{money(job.payAmount)}</p>
            <p className="text-xs text-slate-500">{job.payType === "HOURLY" ? "per hour" : "per shift"}</p>
          </div>
        </div>
        {job.status === "OPEN" && (
          <form action={cancelJob} className="mt-4">
            <input type="hidden" name="jobId" value={job.id} />
            <button className="btn-ghost btn-sm text-slate-500">Cancel this job</button>
          </form>
        )}
      </div>

      {job.booking && job.booking.status !== "CANCELLED" && (
        <div className="card border-emerald-200 p-5">
          <p className="font-semibold text-emerald-700">✅ Booked: {job.booking.driver.fullName}</p>
          <Link href={`/bookings/${job.booking.id}`} className="btn-navy btn-sm mt-3">
            View booking & contact details
          </Link>
        </div>
      )}

      {job.status === "OPEN" && (
        <>
          <section className="space-y-3">
            <h2 className="h2">Drivers who are available ({applicants.length})</h2>
            {applicants.length ? (
              applicants.map((a) => (
                <DriverCard key={a.id} driver={a.driver} rating={ratings.get(a.driver.user.id)} distance={distanceMiles(a.driver, job)} note={a.message}>
                  <ActionForm action={acceptApplicant}>
                    <input type="hidden" name="jobId" value={job.id} />
                    <input type="hidden" name="driverId" value={a.driverId} />
                    <SubmitButton className="btn-primary w-full" pendingText="Booking…">
                      Book {a.driver.fullName.split(" ")[0]}
                    </SubmitButton>
                  </ActionForm>
                </DriverCard>
              ))
            ) : (
              <Empty title="No drivers have responded yet">Nearby drivers can see your job. Invite someone below to speed things up.</Empty>
            )}
          </section>

          {invited.length > 0 && (
            <section className="space-y-2">
              <h2 className="h2">Invited — waiting for driver ({invited.length})</h2>
              {invited.map((a) => (
                <DriverCard key={a.id} driver={a.driver} rating={ratings.get(a.driver.user.id)} distance={distanceMiles(a.driver, job)} />
              ))}
            </section>
          )}

          <section className="space-y-3">
            <h2 className="h2">Suggested drivers available that day</h2>
            {suggestions.length ? (
              suggestions.map(({ d, distance }) => (
                <DriverCard key={d.id} driver={d} rating={ratings.get(d.user.id)} distance={distance}>
                  <ActionForm action={inviteDriver}>
                    <input type="hidden" name="jobId" value={job.id} />
                    <input type="hidden" name="driverId" value={d.id} />
                    <SubmitButton className="btn-outline w-full" pendingText="Sending…">
                      Invite to this job
                    </SubmitButton>
                  </ActionForm>
                </DriverCard>
              ))
            ) : (
              <Empty title="No matching drivers marked available that day yet" />
            )}
          </section>
        </>
      )}
    </div>
  );
}
