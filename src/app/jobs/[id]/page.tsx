import Link from "next/link";
import { getTx } from "@/lib/i18n";
import { markReadByLink } from "@/lib/notify";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { canDriveClass, licenceLabel } from "@/lib/constants";
import { dateOnly, dateTime, money, payUnit } from "@/lib/format";
import { isLive } from "@/lib/jobs";
import { distanceMiles } from "@/lib/geo";
import { ratingSummary } from "@/lib/reviews";
import { avatarUrl } from "@/lib/avatar";
import { reliabilityOf } from "@/lib/reliability";
import { ReliabilityBadges } from "@/components/ReliabilityBadges";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Avatar, Stars, StatusBadge } from "@/components/ui";
import { applyToJob, withdrawApplication } from "@/app/driver/actions";

export const metadata: Metadata = { title: "Job" };

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const job = await db.job.findUnique({ where: { id }, include: { company: { include: { user: { select: { id: true, avatarVersion: true } } } }, booking: true } });
  if (!job) notFound();
  const perm = job.kind === "PERMANENT";
  await markReadByLink(user.id, `/jobs/${job.id}`);
  if (user.role === "COMPANY") {
    if (job.companyId === user.company?.id) redirect(`/company/jobs/${job.id}`);
    redirect(`/wrong-account?need=driver&next=${encodeURIComponent(`/jobs/${job.id}`)}`);
  }
  const driver = user.driver;
  const application = driver
    ? await db.application.findUnique({ where: { jobId_driverId: { jobId: job.id, driverId: driver.id } } })
    : null;
  const [rating, reliability] = await Promise.all([
    ratingSummary(job.company.userId),
    reliabilityOf({ userId: job.company.userId, companyId: job.company.id }),
  ]);
  const distance = driver ? distanceMiles(driver, job) : null;
  const qualified = driver ? canDriveClass(driver.licenceClasses, job.licenceClass) : false;
  const bookedMe = job.booking && driver && job.booking.driverId === driver.id;
  const { tx } = await getTx();

  return (
    <div className="page max-w-2xl space-y-4">
      <Link href="/driver" className="text-sm text-slate-500 hover:text-navy-900">
        ← {tx("Back to jobs")}
      </Link>
      <div className="card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="h1">{tx("{class} driver", { class: licenceLabel(job.licenceClass) })}</h1>
            <p className="mt-1 text-slate-600">{job.company.companyName}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-brand-500">{money(job.payAmount)}</p>
            <p className="text-xs text-slate-500">{tx(payUnit(job.payType))}</p>
          </div>
        </div>
        <ul className="mt-5 grid gap-2 text-[15px] text-slate-700">
          <li>
            📍 {job.town ? `${job.town}, ` : ""}
            {job.postcode}
            {distance != null && <span className="text-slate-400"> · {tx("{n} miles from you", { n: Math.round(distance) })}</span>}
          </li>
          {perm ? (
            <>
              <li>🤝 {tx("Permanent role")}{job.employmentType && ` · ${tx(job.employmentType)}`}</li>
              <li>🗓️ {job.schedule}</li>
              <li>🕒 {job.startAsap ? tx("Start as soon as possible") : tx("Starts {date}", { date: dateOnly(job.startAt) })}</li>
            </>
          ) : (
            <>
              <li>🕒 {tx("{when} start", { when: dateTime(job.startAt) })}</li>
              <li>⏱️ {tx("Approx {h} hours", { h: job.durationHours })}</li>
            </>
          )}
          {job.jobType && <li>🛣️ {tx(job.jobType)}</li>}
          {job.vehicleType && <li>🚛 {tx(job.vehicleType)}</li>}
        </ul>
        {job.description && (
          <div className="mt-5">
            <h2 className="h2">{tx("About the job")}</h2>
            <p className="mt-1 whitespace-pre-line text-slate-700">{job.description}</p>
          </div>
        )}
        {job.benefits && (
          <div className="mt-4">
            <h2 className="h2">{tx("Benefits")}</h2>
            <p className="mt-1 whitespace-pre-line text-slate-700">{job.benefits}</p>
          </div>
        )}
        {job.requirements && (
          <div className="mt-4">
            <h2 className="h2">{tx("Requirements")}</h2>
            <p className="mt-1 whitespace-pre-line text-slate-700">{job.requirements}</p>
          </div>
        )}
      </div>

      <Link href={`/companies/${job.company.id}`} className="card flex items-center gap-3 p-4 hover:border-navy-700">
        <Avatar name={job.company.companyName} src={avatarUrl(job.company.user)} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-navy-900">{job.company.companyName}</p>
          <Stars value={rating.average} count={rating.count} tx={tx} />
          <div className="mt-1">
            <ReliabilityBadges r={reliability} role="COMPANY" tx={tx} />
          </div>
        </div>
        {job.company.verificationStatus === "VERIFIED" && <StatusBadge status="VERIFIED" tx={tx} />}
      </Link>

      {driver && (
        <div className="card p-5">
          {bookedMe ? (
            <div className="space-y-3">
              <p className="font-semibold text-emerald-700">✅ {tx("You're booked on this job.")}</p>
              <Link href={`/bookings/${job.booking!.id}`} className="btn-navy w-full">
                {tx("View booking & contact details")}
              </Link>
            </div>
          ) : application?.status === "ACCEPTED" && perm ? (
            <p className="font-semibold text-emerald-700">🎉 {tx("{company} marked you as hired for this role.", { company: job.company.companyName })}</p>
          ) : !isLive(job) ? (
            <p className="text-slate-600">{job.status === "OPEN" && perm ? tx("This advert has expired.") : tx("This job has been filled.")}</p>
          ) : !qualified ? (
            <p className="text-slate-600">
              {tx("Your licence class doesn't cover this job.")}{" "}
              <Link href="/driver/profile" className="underline">
                {tx("Update your profile")}
              </Link>
            </p>
          ) : application?.status === "APPLIED" ? (
            <div className="space-y-3">
              <p className="font-semibold text-navy-900">✓ {perm ? tx("You've told them you're interested.") : tx("You've told them you're available.")}</p>
              <p className="text-sm text-slate-500">
                {perm ? tx("The company can see your profile and contact details and may get in touch.") : tx("We'll show it under “My work” as soon as they book you.")}
              </p>
              <form action={withdrawApplication}>
                <input type="hidden" name="jobId" value={job.id} />
                <button className="btn-outline btn-sm">{tx("Withdraw")}</button>
              </form>
            </div>
          ) : (
            <ActionForm action={applyToJob} className="space-y-3">
              <input type="hidden" name="jobId" value={job.id} />
              {application?.status === "INVITED" ? (
                <p className="font-semibold text-sky-700">
                  📩 {perm ? tx("{company} invited you to this role. Let them know you're interested.", { company: job.company.companyName }) : tx("{company} invited you to this job. Accept to get booked.", { company: job.company.companyName })}
                </p>
              ) : (
                <label className="block">
                  <span className="label">{tx("Message (optional)")}</span>
                  <textarea className="input min-h-20" name="message" maxLength={500} placeholder={tx("e.g. Happy to start earlier if needed.")} />
                </label>
              )}
              <SubmitButton pendingText={tx("Sending…")}>{perm ? tx("I'm interested →") : application?.status === "INVITED" ? tx("Accept & get booked →") : tx("I'm available →")}</SubmitButton>
            </ActionForm>
          )}
          {application?.status === "INVITED" && job.status === "OPEN" && (
            <form action={withdrawApplication} className="mt-2">
              <input type="hidden" name="jobId" value={job.id} />
              <button className="btn-ghost btn-sm w-full">{tx("Decline invite")}</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
