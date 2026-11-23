"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "./forms";

export type DayRow = {
  iso: string;
  label: string;
  isToday: boolean;
  weekend: boolean;
  on: boolean;
  start: string;
  end: string;
  rate: string;
  rateType: "SHIFT" | "HOURLY" | "ANNUAL";
};

function Save() {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary w-full shadow-lg" disabled={pending}>
      {pending ? "Saving…" : "Save availability"}
    </button>
  );
}

export function AvailabilityEditor({
  action,
  initialDays,
  radius,
  postcode,
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  initialDays: DayRow[];
  radius: number;
  postcode: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const [days, setDays] = useState(initialDays);
  const update = (iso: string, patch: Partial<DayRow>) => setDays((ds) => ds.map((d) => (d.iso === iso ? { ...d, ...patch } : d)));
  const firstOn = days.find((d) => d.on);
  const copyToAll = () => {
    if (!firstOn) return;
    setDays((ds) => ds.map((d) => (d.on ? { ...d, start: firstOn.start, end: firstOn.end, rate: firstOn.rate, rateType: firstOn.rateType } : d)));
  };
  const onCount = days.filter((d) => d.on).length;

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <p role="alert" className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">{state.error}</p>}
      {state?.ok && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.ok}</p>}

      <section className="card grid grid-cols-2 gap-3 p-4">
        <label className="col-span-2 sm:col-span-1">
          <span className="label">I&apos;ll travel up to (miles)</span>
          <input className="input" type="number" name="radius" min={1} max={500} defaultValue={radius} required />
        </label>
        <label className="col-span-2 sm:col-span-1">
          <span className="label">From postcode</span>
          <input className="input uppercase" name="postcode" defaultValue={postcode} required />
        </label>
      </section>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-navy-900">{onCount}</span> day(s) selected
        </p>
        <button type="button" onClick={copyToAll} disabled={onCount < 2} className="btn-outline btn-sm">
          Copy first day&apos;s hours & rate to all
        </button>
      </div>

      <ul className="card divide-y divide-slate-100">
        {days.map((d) => (
          <li key={d.iso} className={`px-4 py-3 ${d.on ? "bg-emerald-50/40" : ""}`}>
            <input type="hidden" name="range" value={d.iso} />
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="day"
                value={d.iso}
                checked={d.on}
                onChange={(e) => update(d.iso, { on: e.target.checked })}
                className="h-5 w-5 rounded accent-brand-500"
              />
              <span className={`text-sm font-semibold ${d.weekend ? "text-brand-600" : "text-slate-800"}`}>
                {d.isToday ? "Today" : d.label}
              </span>
              {d.on && (
                <span className="ml-auto text-xs text-slate-500">
                  {d.start && d.end ? `${d.start}–${d.end}` : "Any time"}
                  {d.rate && ` · £${d.rate}`}
                </span>
              )}
            </label>
            {d.on && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <label>
                  <span className="text-xs text-slate-500">From</span>
                  <input className="input py-2" type="time" name={`start-${d.iso}`} value={d.start} onChange={(e) => update(d.iso, { start: e.target.value })} />
                </label>
                <label>
                  <span className="text-xs text-slate-500">To</span>
                  <input className="input py-2" type="time" name={`end-${d.iso}`} value={d.end} onChange={(e) => update(d.iso, { end: e.target.value })} />
                </label>
                <label>
                  <span className="text-xs text-slate-500">Rate (£)</span>
                  <input
                    className="input py-2"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    name={`rate-${d.iso}`}
                    value={d.rate}
                    placeholder="Profile rate"
                    onChange={(e) => update(d.iso, { rate: e.target.value })}
                  />
                </label>
                <label>
                  <span className="text-xs text-slate-500">Rate is</span>
                  <select
                    className="input py-2"
                    name={`rateType-${d.iso}`}
                    value={d.rateType}
                    onChange={(e) => update(d.iso, { rateType: e.target.value as "SHIFT" | "HOURLY" })}
                  >
                    <option value="SHIFT">per shift</option>
                    <option value="HOURLY">per hour</option>
                  </select>
                </label>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">
        Leave times empty if you can start any time. For nights, e.g. 18:00 → 06:00 works too. Leave the rate empty to use the rate on your profile.
      </p>
      <div className="sticky bottom-20 sm:bottom-4">
        <Save />
      </div>
    </form>
  );
}
