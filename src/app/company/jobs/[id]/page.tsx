import Link from "next/link";
import { getTx } from "@/lib/i18n";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { drivableClasses, licenceLabel } from "@/lib/constants";
import { dateOnly, dateTime, money, payUnit } from "@/lib/format";
import { distanceMiles } from "@/lib/geo";
import { ratingSummaries } from "@/lib/reviews";
import { avatarUrl } from "@/lib/avatar";
import { reliabilityFor } from "@/lib/reliability";
import { dayRateLabel, jobFitsWindow, windowLabel } from "@/lib/availability";
import { ActionForm, SubmitButton } from "@/components/forms";
import { DriverCard } from "@/components/DriverCard";
import { Empty, StatusBadge } from "@/components/ui";
import { acceptApplicant, cancelJob, inviteDriver, markHired, renewJob } from "../../actions";
import { daysLeft, isLive } from "@/lib/jobs";
import { PERM_LISTING_DAYS } from "@/lib/constants";

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
  const { tx } = await getTx();
  const { id } = await params;
  const { posted } = await searchParams;
  const { company } = await requireCompany();
  const job = await db.job.findUnique({
    where: { id },
    include: {
      applications: { include: { driver: { include: { user: { select: { id: true, avatarVersion: true, email: true } } } } }, orderBy: { createdAt: "asc" } },
      booking: { include: { driver: true } },
    },
  });
  if (!job || job.companyId !== company.id) notFound();

  const perm = job.kind === "PERMANENT";
  const live = isLive(job);
  const left = daysLeft(job.expiresAt);
  const hired = perm ? job.applications.find((a) => a.status === "ACCEPTED") : undefined;
  const applicants = job.applications.filter((a) => a.status === "APPLIED");
  const invited = job.applications.filter((a) => a.status === "INVITED");
  const alreadyInvolved = new Set(job.applications.map((a) => a.driverId));

  // Suggest drivers who are available that day (or today), hold the right class and are within their travel radius.
  const jobDay = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(job.startAt) + "T00:00:00Z");
  const suggestions = perm
    ? live
      ? (
          await db.driverProfile.findMany({
            where: {
              id: { notIn: [...alreadyInvolved] },
              user: { suspended: false },
              licenceClasses: { hasSome: classesThatCover(job.licenceClass) },
              openToPermanent: true,
              permanentUntil: { gt: new Date() },
            },
            include: { user: { select: { id: true, avatarVersion: true } }, availability: { take: 0 } },
            take: 100,
          })
        )
          .map((d) => ({ d, distance: distanceMiles(d, job), day: undefined as undefined | (typeof d.availability)[number] }))
          .filter(({ d, distance }) => distance == null || distance <= Math.max(d.travelRadiusMiles, 30))
          .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999))
          .slice(0, 10)
      : []
    : job.status === "OPEN"
      ? (
          await db.driverProfile.findMany({
            where: {
              id: { notIn: [...alreadyInvolved] },
              user: { suspended: false },
              licenceClasses: { hasSome: classesThatCover(job.licenceClass) },
              availability: { some: { date: jobDay } },
            },
            include: { user: { select: { id: true, avatarVersion: true } }, availability: { where: { date: jobDay } } },
            take: 100,
          })
        )
          .map((d) => ({ d, distance: distanceMiles(d, job), day: d.availability[0] }))
          .filter(({ d, distance, day }) => (distance == null || distance <= d.travelRadiusMiles) && (!day || jobFitsWindow(job.startAt, day)))
          .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999))
          .slice(0, 10)
      : [];

  const reliability = await reliabilityFor([
    ...job.applications.map((a) => ({ userId: a.driver.user.id, driverId: a.driverId })),
    ...suggestions.map((s) => ({ userId: s.d.user.id, driverId: s.d.id })),
  ]);
  const ratings = await ratingSummaries([
    ...job.applications.map((a) => a.driver.user.id),
    ...suggestions.map((s) => s.d.user.id),
  ]);

  return (
    <div className="page max-w-3xl space-y-5">
      <Link href="/company" className="text-sm text-slate-500 hover:text-navy-900">
        ← {tx("Dashboard")}
      </Link>
      {posted && (
        <div className="card border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          ✅ {perm ? tx("Your advert is live. Drivers nearby can now see it — you can also invite drivers looking for permanent work below.") : tx("Your job is live. Drivers nearby can now see it — you can also invite available drivers below.")}
        </div>
      )}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            {perm && <span className="chip mb-1 bg-sky-50 text-sky-800">🤝 {tx("Permanent")}</span>}
            <h1 className="h1">{tx("{class} driver", { class: licenceLabel(job.licenceClass) })}</h1>
            <p className="mt-1 text-slate-600">
              📍 {job.town ? `${job.town}, ` : ""}
              {job.postcode} ·{" "}
              {perm
                ? `🗓️ ${job.schedule ?? ""} · ${job.startAsap ? tx("Start ASAP") : tx("Starts {date}", { date: dateOnly(job.startAt) })}${job.employmentType ? ` · ${tx(job.employmentType)}` : ""}`
                : `🕒 ${dateTime(job.startAt)} · ⏱️ ${job.durationHours} h`}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {perm && job.status === "FILLED" ? <span className="chip bg-emerald-50 text-emerald-700">{tx("Hired")}</span> : perm && job.status === "OPEN" && !live ? <span className="chip bg-slate-200 text-slate-700">{tx("Expired")}</span> : perm && live ? null : <StatusBadge status={job.status} tx={tx} />}
              {perm && live && <span className="chip bg-navy-50 text-navy-800">{tx(left === 1 ? "Live · {n} day left" : "Live · {n} days left", { n: left })}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-brand-500">{money(job.payAmount)}</p>
            <p className="text-xs text-slate-500">{tx(payUnit(job.payType))}</p>
          </div>
        </div>
        {perm && job.status === "OPEN" && left <= 3 && (
          <div className={`mt-4 rounded-xl p-3 text-sm ${live ? "bg-amber-50 text-amber-900" : "bg-slate-100 text-slate-700"}`}>
            <p>{live ? tx(left === 1 ? "Your advert expires in {n} day." : "Your advert expires in {n} days.", { n: left }) : tx("Your advert has expired and is hidden from drivers.")}</p>
            <form action={renewJob} className="mt-2">
              <input type="hidden" name="jobId" value={job.id} />
              <button className="btn-navy btn-sm">{tx("Renew for {n} days (free during launch)", { n: PERM_LISTING_DAYS })}</button>
            </form>
          </div>
        )}
        {job.status === "OPEN" && (
          <form action={cancelJob} className="mt-4">
            <input type="hidden" name="jobId" value={job.id} />
            <button className="btn-ghost btn-sm text-slate-500">{tx("Cancel this job")}</button>
          </form>
        )}
      </div>

      {job.booking && job.booking.status !== "CANCELLED" && (
        <div className="card border-emerald-200 p-5">
          <p className="font-semibold text-emerald-700">✅ {tx("Booked")}: {job.booking.driver.fullName}</p>
          <Link href={`/bookings/${job.booking.id}`} className="btn-navy btn-sm mt-3">
            {tx("View booking & contact details")}
          </Link>
        </div>
      )}

      {hired && (
        <div className="card border-emerald-200 p-5">
          <p className="font-semibold text-emerald-700">🎉 {tx("Hired")}: {hired.driver.fullName}</p>
          <p className="mt-1 text-sm text-slate-600">
            {hired.driver.phone && <a className="underline" href={`tel:${hired.driver.phone.replace(/\s/g, "")}`}>{hired.driver.phone}</a>}
            {hired.driver.phone && " · "}
            <a className="underline" href={`mailto:${hired.driver.user.email}`}>{hired.driver.user.email}</a>
          </p>
        </div>
      )}

      {job.status === "OPEN" && (
        <>
          <section className="space-y-3">
            <h2 className="h2">{perm ? tx("Interested drivers") : tx("Drivers who are available")} ({applicants.length})</h2>
            {applicants.length ? (
              applicants.map((a) => (
                <DriverCard key={a.id} driver={a.driver} photo={avatarUrl(a.driver.user)} reliability={reliability.get(a.driver.user.id)} rating={ratings.get(a.driver.user.id)} distance={distanceMiles(a.driver, job)} note={a.message} tx={tx}>
                  {perm ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {a.driver.phone && (
                          <a href={`tel:${a.driver.phone.replace(/\s/g, "")}`} className="btn-navy btn-sm">
                            📞 {tx("Call")}
                          </a>
                        )}
                        <a href={`mailto:${a.driver.user.email}`} className="btn-outline btn-sm">
                          ✉️ {tx("Email")}
                        </a>
                      </div>
                      <ActionForm action={markHired}>
                        <input type="hidden" name="jobId" value={job.id} />
                        <input type="hidden" name="driverId" value={a.driverId} />
                        <SubmitButton className="btn-primary w-full" pendingText={tx("Saving…")}>
                          ✓ {tx("Mark {name} as hired", { name: a.driver.fullName.split(" ")[0] })}
                        </SubmitButton>
                      </ActionForm>
                    </div>
                  ) : (
                  <ActionForm action={acceptApplicant}>
                    <input type="hidden" name="jobId" value={job.id} />
                    <input type="hidden" name="driverId" value={a.driverId} />
                    <SubmitButton className="btn-primary w-full" pendingText={tx("Booking…")}>
                      {tx("Book {name}", { name: a.driver.fullName.split(" ")[0] })}
                    </SubmitButton>
                  </ActionForm>
                  )}
                </DriverCard>
              ))
            ) : (
              <Empty title={tx("No drivers have responded yet")}>{tx("Nearby drivers can see your job. Invite someone below to speed things up.")}</Empty>
            )}
          </section>

          {invited.length > 0 && (
            <section className="space-y-2">
              <h2 className="h2">{tx("Invited — waiting for driver")} ({invited.length})</h2>
              {invited.map((a) => (
                <DriverCard key={a.id} driver={a.driver} photo={avatarUrl(a.driver.user)} reliability={reliability.get(a.driver.user.id)} rating={ratings.get(a.driver.user.id)} distance={distanceMiles(a.driver, job)} tx={tx} />
              ))}
            </section>
          )}

          <section className="space-y-3">
            <h2 className="h2">{perm ? tx("Drivers looking for permanent work nearby") : tx("Suggested drivers available that day")}</h2>
            {suggestions.length ? (
              suggestions.map(({ d, distance, day }) => (
                <DriverCard
                  key={d.id}
                  driver={d}
                  photo={avatarUrl(d.user)}
                  reliability={reliability.get(d.user.id)}
                  rating={ratings.get(d.user.id)}
                  distance={distance}
                  availability={day ? [`Available ${windowLabel(day)}`, dayRateLabel(day)].filter(Boolean).join(" · ") : null} tx={tx}
                >
                  <ActionForm action={inviteDriver}>
                    <input type="hidden" name="jobId" value={job.id} />
                    <input type="hidden" name="driverId" value={d.id} />
                    <SubmitButton className="btn-outline w-full" pendingText={tx("Sending…")}>
                      {tx("Invite to this job")}
                    </SubmitButton>
                  </ActionForm>
                </DriverCard>
              ))
            ) : (
              <Empty title={perm ? tx("No drivers looking for permanent work nearby yet") : tx("No matching drivers marked available that day yet")} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
