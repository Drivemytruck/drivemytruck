import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { canDriveClass, licenceLabel } from "@/lib/constants";
import { dateTime, money } from "@/lib/format";
import { distanceMiles } from "@/lib/geo";
import { ratingSummary } from "@/lib/reviews";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Avatar, Stars, StatusBadge } from "@/components/ui";
import { applyToJob, withdrawApplication } from "@/app/driver/actions";

export const metadata: Metadata = { title: "Job" };

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const job = await db.job.findUnique({ where: { id }, include: { company: true, booking: true } });
  if (!job) notFound();
  if (user.role === "COMPANY") {
    if (job.companyId === user.company?.id) redirect(`/company/jobs/${job.id}`);
    notFound();
  }
  const driver = user.driver;
  const application = driver
    ? await db.application.findUnique({ where: { jobId_driverId: { jobId: job.id, driverId: driver.id } } })
    : null;
  const rating = await ratingSummary(job.company.userId);
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
            <p className="text-xs text-slate-500">{job.payType === "HOURLY" ? "per hour" : "per shift"}</p>
          </div>
        </div>
        <ul className="mt-5 grid gap-2 text-[15px] text-slate-700">
          <li>
            📍 {job.town ? `${job.town}, ` : ""}
            {job.postcode}
            {distance != null && <span className="text-slate-400"> · {Math.round(distance)} miles from you</span>}
          </li>
          <li>🕒 {dateTime(job.startAt)} start</li>
          <li>⏱️ Approx {job.durationHours} hours</li>
          {job.jobType && <li>🛣️ {job.jobType}</li>}
          {job.vehicleType && <li>🚛 {job.vehicleType}</li>}
        </ul>
        {job.description && (
          <div className="mt-5">
            <h2 className="h2">About the job</h2>
            <p className="mt-1 whitespace-pre-line text-slate-700">{job.description}</p>
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
        <Avatar name={job.company.companyName} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-navy-900">{job.company.companyName}</p>
          <Stars value={rating.average} count={rating.count} />
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
          ) : job.status !== "OPEN" ? (
            <p className="text-slate-600">This job has been filled.</p>
          ) : !qualified ? (
            <p className="text-slate-600">
              Your licence class doesn&apos;t cover this job.{" "}
              <Link href="/driver/profile" className="underline">
                Update your profile
              </Link>
            </p>
          ) : application?.status === "APPLIED" ? (
            <div className="space-y-3">
              <p className="font-semibold text-navy-900">✓ You&apos;ve told them you&apos;re available.</p>
              <p className="text-sm text-slate-500">We&apos;ll show it under “My work” as soon as they book you.</p>
              <form action={withdrawApplication}>
                <input type="hidden" name="jobId" value={job.id} />
                <button className="btn-outline btn-sm">Withdraw</button>
              </form>
            </div>
          ) : (
            <ActionForm action={applyToJob} className="space-y-3">
              <input type="hidden" name="jobId" value={job.id} />
              {application?.status === "INVITED" ? (
                <p className="font-semibold text-sky-700">📩 {job.company.companyName} invited you to this job. Accept to get booked.</p>
              ) : (
                <label className="block">
                  <span className="label">Message (optional)</span>
                  <textarea className="input min-h-20" name="message" maxLength={500} placeholder="e.g. Happy to start earlier if needed." />
                </label>
              )}
              <SubmitButton pendingText="Sending…">{application?.status === "INVITED" ? "Accept & get booked →" : "I'm available →"}</SubmitButton>
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
