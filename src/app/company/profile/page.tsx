import Link from "next/link";
import { getTx } from "@/lib/i18n";
import type { Metadata } from "next";
import { requireCompany } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, StatusBadge } from "@/components/ui";
import { saveAlertSettings, updateCompanyProfile } from "../actions";
import { LICENCE_CLASSES } from "@/lib/constants";
import { CheckboxGroup } from "@/components/ui";
import { PhotoUpload } from "@/components/PhotoUpload";
import { avatarUrl } from "@/lib/avatar";

export const metadata: Metadata = { title: "Company profile" };

export default async function CompanyProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { tx, lang } = await getTx();
  const { user, company } = await requireCompany();
  const { welcome } = await searchParams;
  return (
    <div className="page max-w-2xl space-y-5">
      {welcome && (
        <div className="card border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">{tx("Welcome to Drive My Truck! 🎉")}</p>
          <p className="mt-1">{tx("Add a few company details, then post your first job.")}</p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h1">{tx("Company profile")}</h1>
          <p className="muted">{tx("Drivers see this before they accept your work.")}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={company.verificationStatus} tx={tx} />
          <Link href={`/companies/${company.id}`} className="btn-outline btn-sm">
            {tx("View public profile")}
          </Link>
        </div>
      </div>
      <PhotoUpload name={company.companyName} src={avatarUrl(user)} label={tx("Company logo")} lang={lang} />
      <div className="card p-5 sm:p-6">
        <ActionForm action={updateCompanyProfile} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tx("Company name")}>
              <input className="input" name="companyName" defaultValue={company.companyName} required />
            </Field>
            <Field label={tx("Companies House number")} hint={tx("Helps us verify you faster.")}>
              <input className="input" name="companiesHouseNumber" defaultValue={company.companiesHouseNumber ?? ""} />
            </Field>
            <Field label={tx("Operator licence (O-licence) number")} hint={tx("Optional")}>
              <input className="input" name="operatorLicence" defaultValue={company.operatorLicence ?? ""} />
            </Field>
            <Field label={tx("Contact name")}>
              <input className="input" name="contactName" defaultValue={company.contactName ?? ""} />
            </Field>
            <Field label={tx("Phone")} hint={tx("Shared with drivers once you book them.")}>
              <input className="input" name="phone" type="tel" defaultValue={company.phone ?? ""} />
            </Field>
            <Field label={tx("Depot / office postcode")}>
              <input className="input uppercase" name="postcode" defaultValue={company.postcode ?? ""} required />
            </Field>
          </div>
          <Field label={tx("About the company")} hint={tx("Fleet, type of work, what drivers can expect.")}>
            <textarea className="input min-h-28" name="about" maxLength={1500} defaultValue={company.about ?? ""} />
          </Field>
          <SubmitButton pendingText={tx("Saving…")}>{tx("Save")}</SubmitButton>
        </ActionForm>
      </div>
      <section className="card p-5 sm:p-6">
        <h2 className="h2">🔔 {tx("Driver availability alerts")}</h2>
        <p className="muted mt-1">
          {tx("Get an email when a driver near you adds availability — instantly if it matches one of your open jobs, otherwise in a daily summary.")}
        </p>
        <ActionForm action={saveAlertSettings} className="mt-4 space-y-4">
          <label className="flex items-center gap-3 font-semibold text-navy-900">
            <input type="checkbox" name="alertsEnabled" defaultChecked={company.alertsEnabled} className="h-5 w-5 accent-brand-500" />
            {tx("Email me about available drivers")}
          </label>
          <Field label={tx("Within (miles) of my depot")}>
            <input className="input" type="number" name="alertRadiusMiles" min={5} max={300} defaultValue={company.alertRadiusMiles} />
          </Field>
          <div>
            <span className="label">{tx("Driver classes (leave empty for all)")}</span>
            <CheckboxGroup name="alertClasses" options={LICENCE_CLASSES} selected={company.alertClasses} />
          </div>
          <SubmitButton className="btn-navy w-full" pendingText={tx("Saving…")}>
            {tx("Save alerts")}
          </SubmitButton>
        </ActionForm>
      </section>
    </div>
  );
}
