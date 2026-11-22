import Link from "next/link";
import type { Metadata } from "next";
import { requireCompany } from "@/lib/session";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, StatusBadge } from "@/components/ui";
import { updateCompanyProfile } from "../actions";

export const metadata: Metadata = { title: "Company profile" };

export default async function CompanyProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { company } = await requireCompany();
  const { welcome } = await searchParams;
  return (
    <div className="page max-w-2xl space-y-5">
      {welcome && (
        <div className="card border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Welcome to Drive My Truck! 🎉</p>
          <p className="mt-1">Add a few company details, then post your first job.</p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h1">Company profile</h1>
          <p className="muted">Drivers see this before they accept your work.</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={company.verificationStatus} />
          <Link href={`/companies/${company.id}`} className="btn-outline btn-sm">
            View public profile
          </Link>
        </div>
      </div>
      <div className="card p-5 sm:p-6">
        <ActionForm action={updateCompanyProfile} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name">
              <input className="input" name="companyName" defaultValue={company.companyName} required />
            </Field>
            <Field label="Companies House number" hint="Helps us verify you faster.">
              <input className="input" name="companiesHouseNumber" defaultValue={company.companiesHouseNumber ?? ""} />
            </Field>
            <Field label="Operator licence (O-licence) number" hint="Optional">
              <input className="input" name="operatorLicence" defaultValue={company.operatorLicence ?? ""} />
            </Field>
            <Field label="Contact name">
              <input className="input" name="contactName" defaultValue={company.contactName ?? ""} />
            </Field>
            <Field label="Phone" hint="Shared with drivers once you book them.">
              <input className="input" name="phone" type="tel" defaultValue={company.phone ?? ""} />
            </Field>
            <Field label="Depot / office postcode">
              <input className="input uppercase" name="postcode" defaultValue={company.postcode ?? ""} required />
            </Field>
          </div>
          <Field label="About the company" hint="Fleet, type of work, what drivers can expect.">
            <textarea className="input min-h-28" name="about" maxLength={1500} defaultValue={company.about ?? ""} />
          </Field>
          <SubmitButton pendingText="Saving…">Save</SubmitButton>
        </ActionForm>
      </div>
    </div>
  );
}
