import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { LICENCE_CLASSES, drivableClasses } from "@/lib/constants";
import { distanceMiles } from "@/lib/geo";
import { todayISO } from "@/lib/format";
import { ratingSummaries } from "@/lib/reviews";
import { DriverCard } from "@/components/DriverCard";
import { Empty } from "@/components/ui";

export const metadata: Metadata = { title: "Find drivers" };

export default async function FindDriversPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; date?: string; radius?: string; verified?: string }>;
}) {
  const { company } = await requireCompany();
  const sp = await searchParams;
  const jobClass = LICENCE_CLASSES.some((c) => c.value === sp.class) ? sp.class! : "";
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : "";
  const radius = Math.min(Math.max(Number(sp.radius) || 30, 5), 300);
  const verifiedOnly = sp.verified === "1";
  const isToday = date === todayISO();

  const covering = jobClass ? ["C+E", "C", "C1"].filter((c) => drivableClasses([c]).includes(jobClass)) : null;
  const drivers = await db.driverProfile.findMany({
    where: {
      user: { suspended: false },
      licenceClasses: covering ? { hasSome: covering } : { isEmpty: false },
      ...(verifiedOnly ? { verificationStatus: "VERIFIED" } : {}),
      ...(date
        ? { OR: [{ availability: { some: { date: new Date(`${date}T00:00:00Z`) } } }, ...(isToday ? [{ availableToday: true }] : [])] }
        : {}),
    },
    include: { user: { select: { id: true } } },
    take: 300,
  });
  const list = drivers
    .map((d) => ({ d, distance: distanceMiles(company, d) }))
    .filter(({ distance }) => distance == null || distance <= radius)
    .sort(
      (a, b) =>
        Number(b.d.verificationStatus === "VERIFIED") - Number(a.d.verificationStatus === "VERIFIED") ||
        (a.distance ?? 9999) - (b.distance ?? 9999),
    )
    .slice(0, 60);
  const ratings = await ratingSummaries(list.map((x) => x.d.user.id));

  return (
    <div className="page space-y-5">
      <div>
        <h1 className="h1">Find drivers</h1>
        <p className="muted">Drivers near {company.town ?? company.postcode ?? "you"}. Open a profile to invite them to one of your jobs.</p>
      </div>
      <form className="card grid grid-cols-2 gap-3 p-4 sm:grid-cols-5 sm:items-end">
        <label>
          <span className="label">Class</span>
          <select name="class" defaultValue={jobClass} className="input">
            <option value="">Any</option>
            {LICENCE_CLASSES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Available on</span>
          <input type="date" name="date" min={todayISO()} defaultValue={date} className="input" />
        </label>
        <label>
          <span className="label">Within (miles)</span>
          <input type="number" name="radius" min={5} max={300} defaultValue={radius} className="input" />
        </label>
        <label className="flex items-center gap-2 pb-3 text-sm">
          <input type="checkbox" name="verified" value="1" defaultChecked={verifiedOnly} className="h-5 w-5 accent-brand-500" />
          Verified only
        </label>
        <button className="btn-navy col-span-2 sm:col-span-1">Search</button>
      </form>
      {list.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map(({ d, distance }) => (
            <DriverCard key={d.id} driver={d} distance={distance} rating={ratings.get(d.user.id)} />
          ))}
        </div>
      ) : (
        <Empty title="No drivers match these filters yet">Try a bigger radius or a different date.</Empty>
      )}
    </div>
  );
}
