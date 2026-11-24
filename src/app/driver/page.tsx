import Link from "next/link";
import { getTx } from "@/lib/i18n";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireDriver } from "@/lib/session";
import { distanceMiles, withinReach } from "@/lib/geo";
import { drivableClasses, LICENCE_CLASSES } from "@/lib/constants";
import { ratingSummaries } from "@/lib/reviews";
import { JobCard } from "@/components/JobCard";
import { Empty } from "@/components/ui";
import { JobsMapLoader } from "@/components/JobsMapLoader";
import { todayDate, windowLabel } from "@/lib/availability";
import { payShort, relativeDay, timeOnly } from "@/lib/format";
import { liveJobsWhere } from "@/lib/jobs";
import { toggleAvailableToday } from "./actions";

export const metadata: Metadata = { title: "Jobs near you" };

const WHEN = [
  { v: "all", l: "All" },
  { v: "today", l: "Today" },
  { v: "tomorrow", l: "Tomorrow" },
  { v: "week", l: "This week" },
];

export default async function DriverHome({ searchParams }: { searchParams: Promise<{ when?: string; class?: string; any?: string; view?: string; type?: string }> }) {
  const { driver } = await requireDriver();
  const sp = await searchParams;
  const when = WHEN.some((w) => w.v === sp.when) ? sp.when! : "all";
  const showAnyDistance = sp.any === "1";
  const view = sp.view === "map" ? "map" : "list";
  const type = sp.type === "shift" || sp.type === "perm" ? sp.type : "all";

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
        where: {
          AND: [
            liveJobsWhere(now),
            { licenceClass: { in: classFilter } },
            // Date filters only make sense for shifts; permanent roles show under "All" / "Permanent".
            type === "perm" ? { kind: "PERMANENT" } : type === "shift" || when !== "all" ? { kind: "SHIFT", startAt: range } : {},
          ],
        },
        include: {
          company: { select: { companyName: true, verificationStatus: true, userId: true } },
          applications: { where: { driverId: driver.id }, select: { status: true } },
        },
        orderBy: { startAt: "asc" },
        take: 200,
      })
    : [];

  const ratings = await ratingSummaries([...new Set(jobs.map((j) => j.company.userId))]);
  const allWithDistance = jobs.map((j) => ({ job: j, distance: distanceMiles(driver, j) }));
  const withDistance = allWithDistance
    .filter(({ distance }) => showAnyDistance || withinReach(distance, driver.travelRadiusMiles))
    .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999) || a.job.startAt.getTime() - b.job.startAt.getTime());
  const TYPES = [
    { v: "all", l: "All jobs" },
    { v: "shift", l: "🕒 Shifts" },
    { v: "perm", l: "🤝 Permanent" },
  ];

  const firstName = driver.fullName.split(" ")[0];
  const { tx } = await getTx();
  const today = await db.availability.findUnique({ where: { driverId_date: { driverId: driver.id, date: todayDate() } } });
  const availableToday = !!today;
  const profileIncomplete = !driver.licenceClasses.length;
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { type: type === "all" ? undefined : type, when, class: sp.class, any: sp.any, view: view === "map" ? "map" : undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v && !((k === "when" || k === "type") && v === "all")) p.set(k, v);
    const s = p.toString();
    return s ? `/driver?${s}` : "/driver";
  };

  return (
    <div className="page space-y-5">
      <div>
        <h1 className="h1">{tx("Hi {name} 👋", { name: firstName })}</h1>
        <p className="muted">{tx("Here are jobs near {place}.", { place: driver.town ?? driver.postcode ?? tx("you") })}</p>
      </div>

      {profileIncomplete && (
        <div className="card border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-semibold text-amber-900">{tx("Finish your profile to see jobs")}</p>
          <p className="mt-1 text-amber-800">{tx("Add your licence class, rate and documents so companies can book you.")}</p>
          <Link href="/driver/profile" className="btn-navy btn-sm mt-3">
            {tx("Complete profile")}
          </Link>
        </div>
      )}

      <form action={toggleAvailableToday}>
        <button
          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left font-semibold transition ${
            availableToday ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-700"
          }`}
        >
          <span className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${availableToday ? "bg-emerald-500" : "bg-slate-300"}`} />
            {availableToday ? `${tx("Available today")} · ${tx(windowLabel(today!))}` : tx("Not available today")}
          </span>
          <span className="text-xs font-medium underline">{availableToday ? tx("Turn off") : tx("Turn on")}</span>
        </button>
      </form>

      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-300 bg-white p-1 text-sm font-semibold">
          {TYPES.map((t) => (
            <Link
              key={t.v}
              href={qs({ type: t.v, when: t.v === "perm" ? "all" : when })}
              className={`rounded-lg py-2 text-center ${type === t.v ? "bg-brand-500 text-white" : "text-slate-600"}`}
            >
              {tx(t.l)}
            </Link>
          ))}
        </div>
        {type !== "perm" && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {WHEN.map((w) => (
            <Link
              key={w.v}
              href={qs({ when: w.v })}
              className={`chip shrink-0 px-4 py-2 text-sm ${when === w.v ? "bg-navy-900 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
            >
              {tx(w.l)}
            </Link>
          ))}
        </div>
        )}
        {allowed.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Link
              href={qs({ class: undefined })}
              className={`chip shrink-0 px-3 py-1.5 ${!sp.class ? "bg-brand-500 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
            >
              {tx("All classes")}
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

      <div className="grid grid-cols-2 rounded-xl border border-slate-300 bg-white p-1 text-sm font-semibold">
        <Link href={qs({ view: undefined })} className={`rounded-lg py-2 text-center ${view === "list" ? "bg-navy-900 text-white" : "text-slate-600"}`}>
          ☰ {tx("List")}
        </Link>
        <Link href={qs({ view: "map" })} className={`rounded-lg py-2 text-center ${view === "map" ? "bg-navy-900 text-white" : "text-slate-600"}`}>
          🗺️ {tx("Map")}
        </Link>
      </div>

      {view === "map" ? (
        <div className="relative z-0 space-y-2">
          <JobsMapLoader
            home={driver.lat != null && driver.lng != null ? { lat: driver.lat, lng: driver.lng } : null}
            radiusMiles={driver.travelRadiusMiles}
            jobs={allWithDistance
              .filter(({ job }) => job.lat != null && job.lng != null)
              .map(({ job, distance }) => ({
                id: job.id,
                lat: job.lat!,
                lng: job.lng!,
                price: payShort(job.payAmount, job.payType) + (job.kind === "PERMANENT" ? ` · ${tx("Perm")}` : ""),
                title: tx("{class} driver", { class: job.licenceClass === "C+E" ? "Class 1" : job.licenceClass === "C" ? "Class 2" : "7.5t" }),
                company: job.company.companyName,
                when: job.kind === "PERMANENT" ? `${tx("Permanent")} · ${job.schedule ?? ""}` : `${tx(relativeDay(job.startAt))}, ${timeOnly(job.startAt)}`,
                place: job.town ?? job.postcode,
                distance,
                badge: job.applications[0]?.status,
              }))}
          />
          <p className="text-xs text-slate-500">
            {tx("The circle shows your {n}-mile travel area. Red pins are open jobs; dark blue are ones you've responded to.", { n: driver.travelRadiusMiles })}
          </p>
        </div>
      ) : withDistance.length ? (
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
              tx={tx}
            />
          ))}
        </div>
      ) : (
        <Empty title={tx("No matching jobs right now")}>
          {!showAnyDistance && (
            <>
              {tx("We only show jobs within your {n}-mile radius.", { n: driver.travelRadiusMiles })}{" "}
              <Link href={qs({ any: "1" })} className="font-semibold text-brand-600 underline">
                {tx("Show jobs further away")}
              </Link>
              <br />
            </>
          )}
          {tx("Turn on “Available today” and keep your availability up to date so companies can invite you.")}{" "}
          <Link href="/driver/availability" className="underline">
            {tx("Update availability")}
          </Link>
        </Empty>
      )}
    </div>
  );
}
