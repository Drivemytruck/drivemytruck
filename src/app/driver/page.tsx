import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireDriver } from "@/lib/session";
import { distanceMiles } from "@/lib/geo";
import { drivableClasses, LICENCE_CLASSES } from "@/lib/constants";
import { ratingSummaries } from "@/lib/reviews";
import { JobCard } from "@/components/JobCard";
import { Empty } from "@/components/ui";
import { toggleAvailableToday } from "./actions";

export const metadata: Metadata = { title: "Jobs near you" };

const WHEN = [
  { v: "all", l: "All" },
  { v: "today", l: "Today" },
  { v: "tomorrow", l: "Tomorrow" },
  { v: "week", l: "This week" },
];

export default async function DriverHome({ searchParams }: { searchParams: Promise<{ when?: string; class?: string; any?: string }> }) {
  const { driver } = await requireDriver();
  const sp = await searchParams;
  const when = WHEN.some((w) => w.v === sp.when) ? sp.when! : "all";
  const showAnyDistance = sp.any === "1";

  const allowed = drivableClasses(driver.licenceClasses);
  const classFilter = sp.class && allowed.includes(sp.class) ? [sp.class] : allowed;

  const now = new Date();
  const startOfToday = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(now) + "T00:00:00Z");
  const range: Prisma.DateTimeFilter = { gte: new Date(now.getTime() - 2 * 3600000) };
  if (when === "today") range.lt = new Date(startOfToday.getTime() + 86400000 + 3600000);
  if (when === "tomorrow") {
    range.gte = new Date(startOfToday.getTime() + 86400000 - 3600000);
    range.lt = new Date(startOfToday.getTime() + 2 * 86400000 + 3600000);
  }
  if (when === "week") range.lt = new Date(startOfToday.getTime() + 7 * 86400000);

  const jobs = allowed.length
    ? await db.job.findMany({
        where: { status: "OPEN", startAt: range, licenceClass: { in: classFilter } },
        include: {
          company: { select: { companyName: true, verificationStatus: true, userId: true } },
          applications: { where: { driverId: driver.id }, select: { status: true } },
        },
        orderBy: { startAt: "asc" },
        take: 200,
      })
    : [];

  const ratings = await ratingSummaries([...new Set(jobs.map((j) => j.company.userId))]);
  const withDistance = jobs
    .map((j) => ({ job: j, distance: distanceMiles(driver, j) }))
    .filter(({ distance }) => showAnyDistance || distance == null || distance <= driver.travelRadiusMiles)
    .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999) || a.job.startAt.getTime() - b.job.startAt.getTime());

  const firstName = driver.fullName.split(" ")[0];
  const profileIncomplete = !driver.licenceClasses.length;
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { when, class: sp.class, any: sp.any, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v && !(k === "when" && v === "all")) p.set(k, v);
    const s = p.toString();
    return s ? `/driver?${s}` : "/driver";
  };

  return (
    <div className="page space-y-5">
      <div>
        <h1 className="h1">Hi {firstName} 👋</h1>
        <p className="muted">Here are jobs near {driver.town ?? driver.postcode ?? "you"}.</p>
      </div>

      {profileIncomplete && (
        <div className="card border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-semibold text-amber-900">Finish your profile to see jobs</p>
          <p className="mt-1 text-amber-800">Add your licence class, rate and documents so companies can book you.</p>
          <Link href="/driver/profile" className="btn-navy btn-sm mt-3">
            Complete profile
          </Link>
        </div>
      )}

      <form action={toggleAvailableToday}>
        <button
          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left font-semibold transition ${
            driver.availableToday ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-700"
          }`}
        >
          <span className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${driver.availableToday ? "bg-emerald-500" : "bg-slate-300"}`} />
            {driver.availableToday ? "Available today" : "Not available today"}
          </span>
          <span className="text-xs font-medium underline">{driver.availableToday ? "Turn off" : "Turn on"}</span>
        </button>
      </form>

      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {WHEN.map((w) => (
            <Link
              key={w.v}
              href={qs({ when: w.v })}
              className={`chip shrink-0 px-4 py-2 text-sm ${when === w.v ? "bg-navy-900 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
            >
              {w.l}
            </Link>
          ))}
        </div>
        {allowed.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Link
              href={qs({ class: undefined })}
              className={`chip shrink-0 px-3 py-1.5 ${!sp.class ? "bg-brand-500 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
            >
              All classes
            </Link>
            {LICENCE_CLASSES.filter((c) => allowed.includes(c.value)).map((c) => (
              <Link
                key={c.value}
                href={qs({ class: c.value })}
                className={`chip shrink-0 px-3 py-1.5 ${sp.class === c.value ? "bg-brand-500 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
              >
                {c.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {withDistance.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {withDistance.map(({ job, distance }) => (
            <JobCard
              key={job.id}
              href={`/jobs/${job.id}`}
              job={{
                ...job,
                companyName: job.company.companyName,
                companyVerified: job.company.verificationStatus === "VERIFIED",
                rating: ratings.get(job.company.userId),
                distance,
                badge: job.applications[0]?.status,
              }}
            />
          ))}
        </div>
      ) : (
        <Empty title="No matching jobs right now">
          {!showAnyDistance && (
            <>
              We only show jobs within your {driver.travelRadiusMiles}-mile radius.{" "}
              <Link href={qs({ any: "1" })} className="font-semibold text-brand-600 underline">
                Show jobs further away
              </Link>
              <br />
            </>
          )}
          Turn on “Available today” and keep your <Link href="/driver/availability" className="underline">availability</Link> up to date so companies can invite you.
        </Empty>
      )}
    </div>
  );
}
