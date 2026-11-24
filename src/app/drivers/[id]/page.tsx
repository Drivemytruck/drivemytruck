import Link from "next/link";
import { getTx } from "@/lib/i18n";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { DOCUMENT_TYPES, canDriveClass, licenceLabel } from "@/lib/constants";
import { dateTime, money } from "@/lib/format";
import { ratingSummary } from "@/lib/reviews";
import { avatarUrl } from "@/lib/avatar";
import { reliabilityOf } from "@/lib/reliability";
import { ReliabilityBadges } from "@/components/ReliabilityBadges";
import { dayRateLabel, windowLabel } from "@/lib/availability";
import { ActionForm, SubmitButton } from "@/components/forms";
import { ReviewList } from "@/components/Reviews";
import { Avatar, StatusBadge } from "@/components/ui";
import { inviteDriver } from "@/app/company/actions";

export const metadata: Metadata = { title: "Driver profile" };

export default async function DriverPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { tx } = await getTx();
  const { id } = await params;
  const viewer = await requireUser();
  const driver = await db.driverProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, suspended: true, avatarVersion: true } },
      documents: { select: { type: true, status: true, expiresAt: true } },
      availability: { where: { date: { gte: new Date(new Date().toISOString().slice(0, 10)) } }, orderBy: { date: "asc" }, take: 14 },
      _count: { select: { bookings: { where: { status: "COMPLETED" } } } },
    },
  });
  if (!driver || driver.user.suspended) notFound();
  const isSelf = viewer.driver?.id === driver.id;
  if (viewer.role === "DRIVER" && !isSelf) notFound(); // drivers can't browse other drivers

  const [summary, reliability] = await Promise.all([
    ratingSummary(driver.user.id),
    reliabilityOf({ userId: driver.user.id, driverId: driver.id }),
  ]);
  const openJobs =
    viewer.company != null
      ? (await db.job.findMany({ where: { companyId: viewer.company.id, status: "OPEN", startAt: { gte: new Date() } }, orderBy: { startAt: "asc" } })).filter((j) =>
          canDriveClass(driver.licenceClasses, j.licenceClass),
        )
      : [];
  const fmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  const docs = new Map(driver.documents.map((d) => [d.type, d]));

  return (
    <div className="page max-w-2xl space-y-4">
      <div className="card p-5 text-center sm:p-6">
        <div className="flex justify-center">
          <Avatar name={driver.fullName} size={84} src={avatarUrl(driver.user)} />
        </div>
        <h1 className="h1 mt-3">{driver.fullName}</h1>
        <div className="mt-1 flex justify-center">
          <StatusBadge status={driver.verificationStatus} tx={tx} />
        </div>
        <p className="mt-2 text-sm text-slate-600">
          {driver.licenceClasses.map(licenceLabel).join(", ") || tx("No licence class set")}
          {driver.town && ` · ${driver.town}`}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-lg font-extrabold text-navy-900">{driver.rateAmount != null ? money(driver.rateAmount) : "—"}</p>
            <p className="text-[11px] text-slate-500">{driver.rateType === "HOURLY" ? "per hour" : "per shift"}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-lg font-extrabold text-navy-900">{driver.experienceYears ?? "—"}</p>
            <p className="text-[11px] text-slate-500">{tx("years exp.")}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-lg font-extrabold text-navy-900">{reliability.score != null ? `${reliability.score}%` : "—"}</p>
            <p className="text-[11px] text-slate-500">reliable · {driver._count.bookings} jobs</p>
          </div>
        </div>
        <div className="mt-3 flex justify-center">
          <ReliabilityBadges r={reliability} role="DRIVER" tx={tx} />
        </div>
        {driver.bio && <p className="mt-4 text-left whitespace-pre-line text-slate-700">{driver.bio}</p>}
        {driver.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {driver.skills.map((s) => (
              <span key={s} className="chip bg-navy-50 text-navy-800">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      <section className="card p-5">
        <h2 className="h2">{tx("Credentials")}</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {DOCUMENT_TYPES.filter((m) => m.required || docs.has(m.type)).map((m) => {
            const d = docs.get(m.type);
            const expired = d?.expiresAt && d.expiresAt.getTime() < Date.now();
            return (
              <li key={m.type} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-slate-700">{tx(m.label)}</span>
                {expired ? (
                  <span className="chip bg-brand-50 text-brand-700">{tx("Expired")}</span>
                ) : d ? (
                  <StatusBadge status={d.status} tx={tx} />
                ) : (
                  <span className="chip bg-slate-100 text-slate-500">{tx("Not added")}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="h2">{tx("Available (next 2 weeks)")}</h2>
        <p className="text-xs text-slate-500">{tx("Travels up to {n} miles", { n: driver.travelRadiusMiles })}{driver.town ? ` · ${driver.town}` : ""}</p>
        {driver.availability.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {driver.availability.map((a) => (
              <span key={a.id} className="chip bg-emerald-50 text-emerald-800">
                {fmt.format(a.date)} · {windowLabel(a)}
                {dayRateLabel(a) && ` · ${dayRateLabel(a)}`}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">{tx("No availability added.")}</p>
        )}
      </section>

      {viewer.company && (
        <section className="card p-5">
          <h2 className="h2">{tx("Invite to a job")}</h2>
          {openJobs.length ? (
            <ActionForm action={inviteDriver} className="mt-3 space-y-3">
              <input type="hidden" name="driverId" value={driver.id} />
              <select name="jobId" className="input" required>
                {openJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {licenceLabel(j.licenceClass)} · {j.town ?? j.postcode} · {dateTime(j.startAt)} · {money(j.payAmount)}
                  </option>
                ))}
              </select>
              <SubmitButton pendingText={tx("Sending…")}>{tx("Send invite")}</SubmitButton>
            </ActionForm>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              You have no open jobs this driver can do.{" "}
              <Link href="/company/jobs/new" className="font-semibold text-brand-600 underline">
                {tx("Post a job")}
              </Link>
            </p>
          )}
        </section>
      )}

      <ReviewList summary={summary} tx={tx} />
    </div>
  );
}
