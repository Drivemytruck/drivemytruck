import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireDriver } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/forms";
import { saveAvailability } from "../actions";

export const metadata: Metadata = { title: "My availability" };

const DAYS = 28;

export default async function AvailabilityPage() {
  const { driver } = await requireDriver();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
  const start = new Date(`${today}T00:00:00Z`);
  const dates = Array.from({ length: DAYS }, (_, i) => new Date(start.getTime() + i * 86400000));
  const existing = await db.availability.findMany({
    where: { driverId: driver.id, date: { gte: start, lt: new Date(start.getTime() + DAYS * 86400000) } },
  });
  const byDate = new Map(existing.map((a) => [a.date.toISOString().slice(0, 10), a.slot]));
  const fmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <div className="page max-w-2xl space-y-5">
      <div>
        <h1 className="h1">My availability</h1>
        <p className="muted">Tick the days you can work over the next 4 weeks. Companies looking for drivers on those days will find you.</p>
      </div>
      <ActionForm action={saveAvailability} className="space-y-4">
        <ul className="card divide-y divide-slate-100">
          {dates.map((d) => {
            const iso = d.toISOString().slice(0, 10);
            const slot = byDate.get(iso);
            const weekend = [0, 6].includes(d.getUTCDay());
            return (
              <li key={iso} className="flex items-center justify-between gap-3 px-4 py-3">
                <input type="hidden" name="range" value={iso} />
                <label className="flex flex-1 cursor-pointer items-center gap-3">
                  <input type="checkbox" name="day" value={iso} defaultChecked={!!slot} className="h-5 w-5 rounded accent-brand-500" />
                  <span className={`text-sm font-medium ${weekend ? "text-brand-600" : "text-slate-800"}`}>
                    {iso === today ? "Today" : fmt.format(d)}
                  </span>
                </label>
                <select name={`slot-${iso}`} defaultValue={slot ?? "ANY"} className="input w-auto py-1.5 text-sm" aria-label={`Shift for ${iso}`}>
                  <option value="ANY">Day or night</option>
                  <option value="DAY">Days only</option>
                  <option value="NIGHT">Nights only</option>
                </select>
              </li>
            );
          })}
        </ul>
        <div className="sticky bottom-20 sm:bottom-4">
          <SubmitButton className="btn-primary w-full shadow-lg" pendingText="Saving…">
            Save availability
          </SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}
