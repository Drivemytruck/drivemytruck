import type { Metadata } from "next";
import { requireCompany } from "@/lib/session";
import { JOB_TYPES, LICENCE_CLASSES, VEHICLE_TYPES } from "@/lib/constants";
import { todayISO } from "@/lib/format";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field } from "@/components/ui";
import { createJob } from "../../actions";

export const metadata: Metadata = { title: "Post a job" };

export default async function NewJobPage() {
  const { company } = await requireCompany();
  return (
    <div className="page max-w-2xl space-y-5">
      <div>
        <h1 className="h1">
          Post a <span className="text-brand-500">job</span>
        </h1>
        <p className="muted">Find a reliable driver in minutes.</p>
      </div>
      <div className="card p-5 sm:p-6">
        <ActionForm action={createJob} className="space-y-5">
          <fieldset>
            <legend className="label">Driver type</legend>
            <div className="grid grid-cols-3 gap-2">
              {LICENCE_CLASSES.map((c, i) => (
                <label key={c.value} className="cursor-pointer">
                  <input type="radio" name="licenceClass" value={c.value} defaultChecked={i === 0} className="peer sr-only" />
                  <span className="block rounded-xl border-2 border-slate-200 px-2 py-2.5 text-center text-sm font-semibold text-slate-700 peer-checked:border-brand-500 peer-checked:bg-brand-500 peer-checked:text-white">
                    {c.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Start location postcode">
            <input className="input uppercase" name="postcode" defaultValue={company.postcode ?? ""} placeholder="e.g. B1 1AA" required />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <input className="input" type="date" name="date" min={todayISO()} defaultValue={todayISO()} required />
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

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Job type">
              <select className="input" name="jobType" defaultValue="">
                <option value="">—</option>
                {JOB_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Vehicle type">
              <select className="input" name="vehicleType" defaultValue="">
                <option value="">—</option>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="About the job (optional)">
            <textarea className="input min-h-24" name="description" maxLength={2000} placeholder="e.g. Night trunk Birmingham → Leeds and back. Modern fleet, auto gearbox." />
          </Field>
          <Field label="Requirements (optional)" hint="E.g. ADR, min. 2 years' experience, insurance: age 25+, max 6 points.">
            <textarea className="input min-h-20" name="requirements" maxLength={1000} />
          </Field>

          <SubmitButton pendingText="Posting…">Post job</SubmitButton>
        </ActionForm>
      </div>
    </div>
  );
}
