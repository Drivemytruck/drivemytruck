import Link from "next/link";
import type { Metadata } from "next";
import { getTx } from "@/lib/i18n";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { LICENCE_CLASSES, drivableClasses, licenceLabel } from "@/lib/constants";
import { approxLocation, distanceMiles } from "@/lib/geo";
import { money } from "@/lib/format";
import { ratingSummaries } from "@/lib/reviews";
import { avatarUrl } from "@/lib/avatar";
import { reliabilityFor } from "@/lib/reliability";
import { dayRateLabel, todayDate, windowLabel } from "@/lib/availability";
import { DriverCard } from "@/components/DriverCard";
import { DriversMapLoader } from "@/components/DriversMapLoader";
import { Empty } from "@/components/ui";

export const metadata: Metadata = { title: "Find drivers" };

const DAYS = 14;

export default async function FindDriversPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; date?: string; radius?: string; verified?: string; perm?: string; view?: string }>;
}) {
  const { tx, lang } = await getTx();
  const { company } = await requireCompany();
  const sp = await searchParams;
  const jobClass = LICENCE_CLASSES.some((c) => c.value === sp.class) ? sp.class! : "";
  const today = todayDate();
  const days = Array.from({ length: DAYS }, (_, i) => new Date(today.getTime() + i * 86400000));
  const dayISO = (d: Date) => d.toISOString().slice(0, 10);
  const date = sp.date && days.some((d) => dayISO(d) === sp.date) ? sp.date : "";
  const radius = Math.min(Math.max(Number(sp.radius) || 30, 5), 300);
  const verifiedOnly = sp.verified === "1";
  const permOnly = sp.perm === "1";
  const view = sp.view === "map" ? "map" : "list";

  // Everyone matching the filters, with their availability for the next 2 weeks.
  const covering = jobClass ? ["C+E", "C", "C1"].filter((c) => drivableClasses([c]).includes(jobClass)) : null;
  const drivers = await db.driverProfile.findMany({
    where: {
      user: { suspended: false },
      licenceClasses: covering ? { hasSome: covering } : { isEmpty: false },
      ...(verifiedOnly ? { verificationStatus: "VERIFIED" } : {}),
      ...(permOnly ? { openToPermanent: true, permanentUntil: { gt: new Date() } } : {}),
    },
    include: {
      user: { select: { id: true, avatarVersion: true } },
      availability: { where: { date: { gte: today, lt: new Date(today.getTime() + DAYS * 86400000) } }, orderBy: { date: "asc" } },
    },
    take: 500,
  });
  const nearby = drivers
    .map((d) => ({ d, distance: distanceMiles(company, d) }))
    .filter(({ distance }) => distance == null || distance <= radius);

  // How many drivers are free on each day — for the day strip.
  const counts = new Map<string, number>();
  for (const { d } of nearby) for (const a of d.availability) counts.set(dayISO(a.date), (counts.get(dayISO(a.date)) ?? 0) + 1);

  const selected = date ? new Date(`${date}T00:00:00Z`) : null;
  const list = nearby
    .map((x) => ({ ...x, slot: selected ? x.d.availability.find((a) => a.date.getTime() === selected.getTime()) : x.d.availability[0] }))
    .filter((x) => !selected || x.slot)
    .sort(
      (a, b) =>
        Number(!!b.slot) - Number(!!a.slot) ||
        Number(b.d.verificationStatus === "VERIFIED") - Number(a.d.verificationStatus === "VERIFIED") ||
        (a.distance ?? 9999) - (b.distance ?? 9999),
    )
    .slice(0, 100);
  const [ratings, reliability] = await Promise.all([
    ratingSummaries(list.map((x) => x.d.user.id)),
    reliabilityFor(list.map((x) => ({ userId: x.d.user.id, driverId: x.d.id }))),
  ]);

  const dayFmt = new Intl.DateTimeFormat(lang === "pl" ? "pl-PL" : "en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  const availText = (slot: (typeof list)[number]["slot"]) =>
    slot ? [dayFmt.format(slot.date), tx(windowLabel(slot)), dayRateLabel(slot)].filter(Boolean).join(" · ") : null;
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      class: jobClass || undefined,
      date: date || undefined,
      radius: sp.radius,
      verified: verifiedOnly ? "1" : undefined,
      perm: permOnly ? "1" : undefined,
      view: view === "map" ? "map" : undefined,
      ...patch,
    };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/company/drivers${p.toString() ? `?${p}` : ""}`;
  };

  return (
    <div className="page space-y-5">
      <div>
        <h1 className="h1">{tx("Find drivers")}</h1>
        <p className="muted">{tx("Pick a day to see who's free near {place}, then open a profile to invite them.", { place: company.town ?? company.postcode ?? tx("you") })}</p>
      </div>

      {/* Day strip: who's available when */}
      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex gap-2">
          <Link
            href={qs({ date: undefined })}
            className={`flex min-w-20 shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-center ${!date ? "border-navy-900 bg-navy-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}
          >
            <span className="text-xs">{tx("Any day")}</span>
            <span className="text-lg font-extrabold">{nearby.filter((x) => x.d.availability.length).length}</span>
            <span className="text-[10px] opacity-80">{tx("drivers")}</span>
          </Link>
          {days.map((d) => {
            const iso = dayISO(d);
            const n = counts.get(iso) ?? 0;
            const active = date === iso;
            return (
              <Link
                key={iso}
                href={qs({ date: iso })}
                className={`flex min-w-20 shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-center ${
                  active ? "border-brand-500 bg-brand-500 text-white" : n ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                <span className="text-xs">{iso === dayISO(today) ? tx("Today") : dayFmt.format(d)}</span>
                <span className="text-lg font-extrabold">{n}</span>
                <span className="text-[10px] opacity-80">{tx(n === 1 ? "driver" : "drivers")}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <form className="card grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:items-end">
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="view" value={view === "map" ? "map" : ""} />
        <label>
          <span className="label">{tx("Class")}</span>
          <select name="class" defaultValue={jobClass} className="input">
            <option value="">{tx("Any")}</option>
            {LICENCE_CLASSES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">{tx("Within (miles)")}</span>
          <input type="number" name="radius" min={5} max={300} defaultValue={radius} className="input" />
        </label>
        <div className="col-span-2 flex flex-wrap gap-x-4 gap-y-1 sm:col-span-1">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="verified" value="1" defaultChecked={verifiedOnly} className="h-5 w-5 accent-brand-500" />
            {tx("Verified only")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="perm" value="1" defaultChecked={permOnly} className="h-5 w-5 accent-brand-500" />
            {tx("Open to permanent")}
          </label>
        </div>
        <button className="btn-navy col-span-2 sm:col-span-1">{tx("Search")}</button>
      </form>

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
          <DriversMapLoader
            home={company.lat != null && company.lng != null ? { lat: company.lat, lng: company.lng } : null}
            radiusMiles={radius}
            labels={{ open: tx("Open profile & invite →"), base: company.companyName }}
            drivers={list
              .filter((x) => x.d.lat != null && x.d.lng != null && x.slot)
              .map(({ d, slot }) => {
                const pos = approxLocation(d.id, d.lat!, d.lng!);
                const rate = slot?.rateAmount != null ? money(slot.rateAmount) : d.rateAmount != null ? money(d.rateAmount) : "";
                return {
                  id: d.id,
                  ...pos,
                  label: `${d.fullName.split(" ")[0]}${rate ? ` · ${rate}` : ""}`,
                  name: d.fullName,
                  info: `${d.licenceClasses.map(licenceLabel).join(", ")}${d.town ? ` · ${d.town}` : ""}`,
                  when: availText(slot) ?? "",
                  verified: d.verificationStatus === "VERIFIED",
                };
              })}
          />
          <p className="text-xs text-slate-500">
            {tx("Green pins are verified drivers. Locations are approximate to protect drivers' privacy.")}
          </p>
        </div>
      ) : list.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map(({ d, distance, slot }) => (
            <DriverCard
              key={d.id}
              driver={d}
              photo={avatarUrl(d.user)}
              reliability={reliability.get(d.user.id)}
              distance={distance}
              rating={ratings.get(d.user.id)}
              availability={slot ? `${selected ? tx("Available") : tx("Next available")}: ${availText(slot)}` : null}
              tx={tx}
            />
          ))}
        </div>
      ) : (
        <Empty title={tx("No drivers match these filters yet")}>{tx("Try a bigger radius or a different date.")}</Empty>
      )}
    </div>
  );
}
