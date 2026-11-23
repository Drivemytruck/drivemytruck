import Link from "next/link";
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
  if (user.role === "COMPANY") {
    if (job.companyId === user.company?.id) redirect(`/company/jobs/${job.id}`);
    notFound();
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

  return (
    <div className="page max-w-2xl space-y-4">
      <Link href="/driver" className="text-sm text-slate-500 hover:text-navy-900">
        ← Back to jobs
      </Link>
      <div className="card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="h1">{licenceLabel(job.licenceClass)} driver</h1>
            <p className="mt-1 text-slate-600">{job.company.companyName}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-brand-500">{money(job.payAmount)}</p>
            <p className="text-xs text-slate-500">{payUnit(job.payType)}</p>
          </div>
        </div>
        <ul className="mt-5 grid gap-2 text-[15px] text-slate-700">
          <li>
            📍 {job.town ? `${job.town}, ` : ""}
            {job.postcode}
            {distance != null && <span className="text-slate-400"> · {Math.round(distance)} miles from you</span>}
          </li>
          {perm ? (
            <>
              <li>🤝 Permanent role{job.employmentType && ` · ${job.employmentType}`}</li>
              <li>🗓️ {job.schedule}</li>
              <li>🕒 {job.startAsap ? "Start as soon as possible" : `Starts ${dateOnly(job.startAt)}`}</li>
            </>
          ) : (
            <>
              <li>🕒 {dateTime(job.startAt)} start</li>
              <li>⏱️ Approx {job.durationHours} hours</li>
            </>
          )}
          {job.jobType && <li>🛣️ {job.jobType}</li>}
          {job.vehicleType && <li>🚛 {job.vehicleType}</li>}
        </ul>
        {job.description && (
          <div className="mt-5">
            <h2 className="h2">About the job</h2>
            <p className="mt-1 whitespace-pre-line text-slate-700">{job.description}</p>
          </div>
        )}
        {job.benefits && (
          <div className="mt-4">
            <h2 className="h2">Benefits</h2>
            <p className="mt-1 whitespace-pre-line text-slate-700">{job.benefits}</p>
          </div>
        )}
        {job.requirements && (
          <div className="mt-4">
            <h2 className="h2">Requirements</h2>
            <p className="mt-1 whitespace-pre-line text-slate-700">{job.requirements}</p>
          </div>
        )}
      </div>

      <Link href={`/companies/${job.company.id}`} className="card flex items-center gap-3 p-4 hover:border-navy-700">
        <Avatar name={job.company.companyName} src={avatarUrl(job.company.user)} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-navy-900">{job.company.companyName}</p>
          <Stars value={rating.average} count={rating.count} />
          <div className="mt-1">
            <ReliabilityBadges r={reliability} role="COMPANY" />
          </div>
        </div>
        {job.company.verificationStatus === "VERIFIED" && <StatusBadge status="VERIFIED" />}
      </Link>

      {driver && (
        <div className="card p-5">
          {bookedMe ? (
            <div className="space-y-3">
              <p className="font-semibold text-emerald-700">✅ You&apos;re booked on this job.</p>
              <Link href={`/bookings/${job.booking!.id}`} className="btn-navy w-full">
                View booking & contact details
              </Link>
            </div>
          ) : application?.status === "ACCEPTED" && perm ? (
            <p className="font-semibold text-emerald-700">🎉 {job.company.companyName} marked you as hired for this role.</p>
          ) : !isLive(job) ? (
            <p className="text-slate-600">{job.status === "OPEN" && perm ? "This advert has expired." : "This job has been filled."}</p>
          ) : !qualified ? (
            <p className="text-slate-600">
              Your licence class doesn&apos;t cover this job.{" "}
              <Link href="/driver/profile" className="underline">
                Update your profile
              </Link>
            </p>
          ) : application?.status === "APPLIED" ? (
            <div className="space-y-3">
              <p className="font-semibold text-navy-900">✓ You&apos;ve told them you&apos;re {perm ? "interested" : "available"}.</p>
              <p className="text-sm text-slate-500">
                {perm ? "The company can see your profile and contact details and may get in touch." : "We'll show it under “My work” as soon as they book you."}
              </p>
              <form action={withdrawApplication}>
                <input type="hidden" name="jobId" value={job.id} />
                <button className="btn-outline btn-sm">Withdraw</button>
              </form>
            </div>
          ) : (
            <ActionForm action={applyToJob} className="space-y-3">
              <input type="hidden" name="jobId" value={job.id} />
              {application?.status === "INVITED" ? (
                <p className="font-semibold text-sky-700">
                  📩 {job.company.companyName} invited you to this {perm ? "role. Let them know you're interested." : "job. Accept to get booked."}
                </p>
              ) : (
                <label className="block">
                  <span className="label">Message (optional)</span>
                  <textarea className="input min-h-20" name="message" maxLength={500} placeholder="e.g. Happy to start earlier if needed." />
                </label>
              )}
              <SubmitButton pendingText="Sending…">{perm ? "I'm interested →" : application?.status === "INVITED" ? "Accept & get booked →" : "I'm available →"}</SubmitButton>
            </ActionForm>
          )}
          {application?.status === "INVITED" && job.status === "OPEN" && (
            <form action={withdrawApplication} className="mt-2">
              <input type="hidden" name="jobId" value={job.id} />
              <button className="btn-ghost btn-sm w-full">Decline invite</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
