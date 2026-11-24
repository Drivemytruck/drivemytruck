import Link from "next/link";
import { getTx } from "@/lib/i18n";
import type { Metadata } from "next";
import { requireDriver } from "@/lib/session";
import { LICENCE_CLASSES, SKILLS } from "@/lib/constants";
import { ActionForm, SubmitButton } from "@/components/forms";
import { CheckboxGroup, Field, StatusBadge } from "@/components/ui";
import { saveJobAlerts, savePermanentPrefs, updateDriverProfile } from "../actions";
import { EMPLOYMENT_TYPES } from "@/lib/constants";
import { isSeekingPermanent } from "@/lib/jobs";
import { dateOnly } from "@/lib/format";
import { PhotoUpload } from "@/components/PhotoUpload";
import { avatarUrl } from "@/lib/avatar";

export const metadata: Metadata = { title: "My profile" };

export default async function DriverProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { tx, lang } = await getTx();
  const { user, driver } = await requireDriver();
  const { welcome } = await searchParams;
  return (
    <div className="page max-w-2xl space-y-5">
      {welcome && (
        <div className="card border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">{tx("Welcome to Drive My Truck! 🎉")}</p>
          <p className="mt-1">{tx("Fill in your profile, then add your documents. Verified drivers get booked first.")}</p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h1">{tx("My profile")}</h1>
          <p className="muted">{tx("This is what companies see before they book you.")}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={driver.verificationStatus} tx={tx} />
          <Link href={`/drivers/${driver.id}`} className="btn-outline btn-sm">
            {tx("View public profile")}
          </Link>
        </div>
      </div>

      <PhotoUpload name={driver.fullName} src={avatarUrl(user)} label={tx("Profile photo")} lang={lang} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/driver/documents" className="card flex items-center justify-between p-4 hover:border-navy-700">
          <span>
            <span className="block font-semibold text-navy-900">📄 {tx("My documents")}</span>
            <span className="text-xs text-slate-500">{tx("Licence, CPC, tacho, right to work")}</span>
          </span>
          <span aria-hidden>›</span>
        </Link>
        <Link href="/driver/availability" className="card flex items-center justify-between p-4 hover:border-navy-700">
          <span>
            <span className="block font-semibold text-navy-900">📅 {tx("My availability")}</span>
            <span className="text-xs text-slate-500">{tx("Days you can work")}</span>
          </span>
          <span aria-hidden>›</span>
        </Link>
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="h2">🔔 {tx("Job alerts")}</h2>
        <p className="muted mt-1">
          {tx("We'll email you straight away when a new job fits a day you're available (max 5 a day), and send a daily summary of other new jobs within your travel distance.")}
        </p>
        <ActionForm action={saveJobAlerts} className="mt-3 space-y-3">
          <label className="flex items-center gap-3 font-semibold text-navy-900">
            <input type="checkbox" name="jobAlertsEnabled" defaultChecked={driver.jobAlertsEnabled} className="h-5 w-5 accent-brand-500" />
            {tx("Email me about new jobs near me")}
          </label>
          <SubmitButton className="btn-outline btn-sm" pendingText={tx("Saving…")}>
            {tx("Save")}
          </SubmitButton>
        </ActionForm>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="h2">🤝 {tx("Looking for permanent work?")}</h2>
        <p className="muted mt-1">
          {tx("Turn this on and companies hiring permanent drivers can find and invite you. It stays on for 30 days — we'll email you to check if you're still looking.")}
        </p>
        {isSeekingPermanent(driver) && driver.permanentUntil && (
          <p className="mt-2 text-sm font-medium text-emerald-700">✓ Visible to companies until {dateOnly(driver.permanentUntil)}</p>
        )}
        <ActionForm action={savePermanentPrefs} className="mt-4 space-y-4">
          <label className="flex items-center gap-3 font-semibold text-navy-900">
            <input type="checkbox" name="openToPermanent" defaultChecked={isSeekingPermanent(driver)} className="h-5 w-5 accent-brand-500" />
            {tx("Yes, I'm open to a permanent / regular job")}
          </label>
          <div>
            <span className="label">I&apos;d work as</span>
            <CheckboxGroup name="permEmployment" options={EMPLOYMENT_TYPES} selected={driver.permEmployment} />
          </div>
          <Field label={tx("Preferred shift pattern")} hint={tx("e.g. Days only, Mon–Fri nights, 4 on 4 off")}>
            <input className="input" name="permSchedule" maxLength={120} defaultValue={driver.permSchedule ?? ""} />
          </Field>
          <Field label={tx("Anything else? (optional)")} hint={tx("e.g. looking for £18/h+, home every night, no tramping")}>
            <textarea className="input min-h-16" name="permNote" maxLength={500} defaultValue={driver.permNote ?? ""} />
          </Field>
          <SubmitButton className="btn-navy w-full" pendingText={tx("Saving…")}>
            {tx("Save")}
          </SubmitButton>
        </ActionForm>
      </section>

      <div className="card p-5 sm:p-6">
        <ActionForm action={updateDriverProfile} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tx("Full name")}>
              <input className="input" name="fullName" defaultValue={driver.fullName} required />
            </Field>
            <Field label={tx("Mobile number")} hint={tx("Only shown to companies after they book you.")}>
              <input className="input" name="phone" type="tel" defaultValue={driver.phone ?? ""} placeholder="07…" />
            </Field>
            <Field label={tx("Home postcode")}>
              <input className="input uppercase" name="postcode" defaultValue={driver.postcode ?? ""} required />
            </Field>
            <Field label={tx("How far will you travel? (miles)")}>
              <input className="input" name="travelRadiusMiles" type="number" min={1} max={500} defaultValue={driver.travelRadiusMiles} />
            </Field>
          </div>

          <div>
            <span className="label">{tx("Licence classes")}</span>
            <CheckboxGroup name="licenceClasses" options={LICENCE_CLASSES} selected={driver.licenceClasses} />
          </div>

          <div>
            <span className="label">{tx("Experience & extras")}</span>
            <CheckboxGroup name="skills" options={SKILLS} selected={driver.skills} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={tx("Years driving HGV")}>
              <input className="input" name="experienceYears" type="number" min={0} max={60} defaultValue={driver.experienceYears ?? ""} />
            </Field>
            <Field label={tx("My rate (£)")}>
              <input
                className="input"
                name="rate"
                type="number"
                min={0}
                step="0.01"
                defaultValue={driver.rateAmount != null ? driver.rateAmount / 100 : ""}
                placeholder="e.g. 250"
              />
            </Field>
            <Field label={tx("Rate is")}>
              <select className="input" name="rateType" defaultValue={driver.rateType}>
                <option value="SHIFT">{tx("per shift")}</option>
                <option value="HOURLY">{tx("per hour")}</option>
              </select>
            </Field>
          </div>

          <Field label={tx("About me")} hint={tx("A couple of lines about your experience — e.g. ‘10 years trunking, clean licence, happy with nights’.")}>
            <textarea className="input min-h-24" name="bio" maxLength={1000} defaultValue={driver.bio ?? ""} />
          </Field>

          <SubmitButton pendingText={tx("Saving…")}>{tx("Save profile")}</SubmitButton>
        </ActionForm>
      </div>
    </div>
  );
}
