"use client";

import { useState } from "react";
import { ActionForm, SubmitButton, type ActionState } from "./forms";
import { Field } from "./ui";

type Props = {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  postcode: string;
  today: string;
  licenceClasses: readonly { value: string; label: string }[];
  jobTypes: readonly string[];
  vehicleTypes: readonly string[];
  employmentTypes: readonly string[];
  listingDays: number;
};

export function JobForm({ action, postcode, today, licenceClasses, jobTypes, vehicleTypes, employmentTypes, listingDays }: Props) {
  const [kind, setKind] = useState<"SHIFT" | "PERMANENT">("SHIFT");
  const [asap, setAsap] = useState(true);
  const perm = kind === "PERMANENT";

  return (
    <ActionForm action={action} className="space-y-5">
      <fieldset>
        <legend className="label">What do you need?</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: "SHIFT", t: "🕒 A shift", s: "One-off / ad-hoc work" },
            { v: "PERMANENT", t: "🤝 Permanent", s: "Regular or full-time role" },
          ].map((o) => (
            <label key={o.v} className="cursor-pointer">
              <input
                type="radio"
                name="kind"
                value={o.v}
                checked={kind === o.v}
                onChange={() => setKind(o.v as "SHIFT" | "PERMANENT")}
                className="peer sr-only"
              />
              <span className="block rounded-xl border-2 border-slate-200 p-3 text-center peer-checked:border-brand-500 peer-checked:bg-brand-50">
                <span className="block font-bold text-navy-900">{o.t}</span>
                <span className="block text-xs text-slate-500">{o.s}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Driver type</legend>
        <div className="grid grid-cols-3 gap-2">
          {licenceClasses.map((c, i) => (
            <label key={c.value} className="cursor-pointer">
              <input type="radio" name="licenceClass" value={c.value} defaultChecked={i === 0} className="peer sr-only" />
              <span className="block rounded-xl border-2 border-slate-200 px-2 py-2.5 text-center text-sm font-semibold text-slate-700 peer-checked:border-brand-500 peer-checked:bg-brand-500 peer-checked:text-white">
                {c.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label={perm ? "Depot / base postcode" : "Start location postcode"}>
        <input className="input uppercase" name="postcode" defaultValue={postcode} placeholder="e.g. B1 1AA" required />
      </Field>

      {perm ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 flex items-center gap-3 text-sm">
              <input type="checkbox" name="startAsap" checked={asap} onChange={(e) => setAsap(e.target.checked)} className="h-5 w-5 accent-brand-500" />
              Start as soon as possible
            </label>
            {!asap && (
              <Field label="Start date">
                <input className="input" type="date" name="date" min={today} defaultValue={today} required />
              </Field>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pay (£)">
              <input className="input" type="number" name="pay" min={1} step="0.01" placeholder="17.50" required />
            </Field>
            <Field label="Pay is">
              <select className="input" name="payType" defaultValue="HOURLY">
                <option value="HOURLY">per hour</option>
                <option value="ANNUAL">per year</option>
              </select>
            </Field>
          </div>
          <Field label="Shift pattern" hint="e.g. Mon–Fri nights, 4 on 4 off, weekends only">
            <input className="input" name="schedule" maxLength={120} required />
          </Field>
          <Field label="Employment type">
            <select className="input" name="employmentType" defaultValue={employmentTypes[0]}>
              {employmentTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <input className="input" type="date" name="date" min={today} defaultValue={today} required />
            </Field>
            <Field label="Start time">
              <input className="input" type="time" name="time" defaultValue="06:00" required />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Duration (hours)">
              <input className="input" type="number" name="durationHours" min={1} step="0.5" defaultValue={10} required />
            </Field>
            <Field label="Pay (£)">
              <input className="input" type="number" name="pay" min={1} step="0.01" placeholder="250" required />
            </Field>
            <Field label="Pay is">
              <select className="input" name="payType" defaultValue="SHIFT">
                <option value="SHIFT">per shift</option>
                <option value="HOURLY">per hour</option>
              </select>
            </Field>
          </div>
        </>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Job type">
          <select className="input" name="jobType" defaultValue="">
            <option value="">—</option>
            {jobTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Vehicle type">
          <select className="input" name="vehicleType" defaultValue="">
            <option value="">—</option>
            {vehicleTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={perm ? "About the role" : "About the job (optional)"}>
        <textarea
          className="input min-h-24"
          name="description"
          maxLength={2000}
          placeholder={perm ? "e.g. Regular nights trunking to Leeds, modern fleet, home every day." : "e.g. Night trunk Birmingham → Leeds and back. Modern fleet, auto gearbox."}
        />
      </Field>
      {perm && (
        <Field label="Benefits (optional)" hint="e.g. Overtime, holiday pay, pension, sign-on bonus">
          <textarea className="input min-h-16" name="benefits" maxLength={1000} />
        </Field>
      )}
      <Field label="Requirements (optional)" hint="E.g. ADR, min. 2 years' experience, insurance: age 25+, max 6 points.">
        <textarea className="input min-h-20" name="requirements" maxLength={1000} />
      </Field>

      {perm && (
        <p className="rounded-xl bg-navy-50 px-4 py-3 text-sm text-navy-900">
          Permanent adverts stay live for {listingDays} days. You can renew them from the job page — free during our launch period.
        </p>
      )}
      <SubmitButton pendingText="Posting…">{perm ? "Post permanent role" : "Post job"}</SubmitButton>
    </ActionForm>
  );
}
