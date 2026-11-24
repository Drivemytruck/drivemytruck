import type { Metadata } from "next";
import { getTx } from "@/lib/i18n";
import { db } from "@/lib/db";
import { requireDriver } from "@/lib/session";
import { AvailabilityEditor, type DayRow } from "@/components/AvailabilityEditor";
import { saveAvailability } from "../actions";

export const metadata: Metadata = { title: "My availability" };

const DAYS = 28;
const LEGACY: Record<string, [string, string]> = { DAY: ["06:00", "18:00"], NIGHT: ["18:00", "06:00"] };

export default async function AvailabilityPage() {
  const { driver } = await requireDriver();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
  const start = new Date(`${today}T00:00:00Z`);
  const existing = await db.availability.findMany({
    where: { driverId: driver.id, date: { gte: start, lt: new Date(start.getTime() + DAYS * 86400000) } },
  });
  const byDate = new Map(existing.map((a) => [a.date.toISOString().slice(0, 10), a]));
  const { lang, tx } = await getTx();
  const fmt = new Intl.DateTimeFormat(lang === "pl" ? "pl-PL" : "en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

  const days: DayRow[] = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(start.getTime() + i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    const a = byDate.get(iso);
    const legacy = a && !a.startTime ? LEGACY[a.slot] : undefined;
    return {
      iso,
      label: fmt.format(d),
      isToday: iso === today,
      weekend: [0, 6].includes(d.getUTCDay()),
      on: !!a,
      start: a?.startTime ?? legacy?.[0] ?? "",
      end: a?.endTime ?? legacy?.[1] ?? "",
      rate: a?.rateAmount != null ? String(a.rateAmount / 100) : "",
      rateType: a?.rateType ?? driver.rateType,
    };
  });

  return (
    <div className="page max-w-2xl space-y-5">
      <div>
        <h1 className="h1">{tx("My availability")}</h1>
        <p className="muted">
          {tx("Tick the days you can work over the next 4 weeks, with your hours and rate. Companies looking for a driver on those days will find you.")}
        </p>
      </div>
      <AvailabilityEditor action={saveAvailability} initialDays={days} radius={driver.travelRadiusMiles} postcode={driver.postcode ?? ""} lang={lang} />
    </div>
  );
}
