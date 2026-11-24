import Link from "next/link";
import { getTx } from "@/lib/i18n";
import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { dateOnly } from "@/lib/format";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field } from "@/components/ui";
import { changePassword, deleteAccount, setMarketingConsent } from "./actions";

export const metadata: Metadata = { title: "Account & privacy" };

export default async function AccountPage() {
  const { tx } = await getTx();
  const user = await requireUser();
  return (
    <div className="page max-w-2xl space-y-5">
      <div>
        <h1 className="h1">Account &amp; privacy</h1>
        <p className="muted">
          Signed in as <span className="font-medium text-slate-700">{user.email}</span>
        </p>
      </div>

      <section className="card p-5">
        <h2 className="h2">{tx("Change password")}</h2>
        <p className="muted mt-1">You&apos;ll be signed out on your other devices.</p>
        <ActionForm action={changePassword} className="mt-3 space-y-3">
          <Field label={tx("Current password")}>
            <input className="input" type="password" name="current" autoComplete="current-password" required />
          </Field>
          <Field label={tx("New password")} hint={tx("At least 8 characters")}>
            <input className="input" type="password" name="password" autoComplete="new-password" minLength={8} required />
          </Field>
          <SubmitButton className="btn-navy" pendingText={tx("Saving…")}>
            {tx("Change password")}
          </SubmitButton>
        </ActionForm>
      </section>

      {user.role !== "ADMIN" && (
        <section className="card p-5">
          <h2 className="h2">Offers &amp; discounts</h2>
          <p className="muted mt-1">
            {tx("Occasional deals from our partners (e.g. CPC training, insurance, accountants). We never sell your details — partners don't get your contact information.")}
          </p>
          <ActionForm action={setMarketingConsent} className="mt-3 space-y-3">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-800">
              <input type="checkbox" name="marketing" defaultChecked={user.marketingConsent} className="h-5 w-5 accent-brand-500" />
              {tx("Yes, send me offers and discounts")}
            </label>
            {user.marketingConsentAt && user.marketingConsent && (
              <p className="text-xs text-slate-500">You agreed on {dateOnly(user.marketingConsentAt)}.</p>
            )}
            <SubmitButton className="btn-outline btn-sm" pendingText={tx("Saving…")}>
              {tx("Save preference")}
            </SubmitButton>
          </ActionForm>
        </section>
      )}

      <section className="card p-5">
        <h2 className="h2">{tx("Your data")}</h2>
        <p className="muted mt-1">
          Download a copy of everything we hold about you (UK GDPR right of access). Read how we use it in our{" "}
          <Link href="/privacy" className="underline">
            {tx("privacy policy")}
          </Link>
          .
        </p>
        <a href="/account/export" className="btn-outline btn-sm mt-3">
          ⬇️ {tx("Download my data")}
        </a>
        {user.termsAcceptedAt && (
          <p className="mt-3 text-xs text-slate-500">
            You accepted our terms (version {user.termsVersion}) on {dateOnly(user.termsAcceptedAt)}.
          </p>
        )}
      </section>

      {user.role !== "ADMIN" && (
        <section className="card border-brand-100 p-5">
          <h2 className="h2 text-brand-700">{tx("Delete account")}</h2>
          <p className="muted mt-1">
            {tx("Permanently deletes your profile, documents, availability, photo and messages. Reviews you received from completed jobs are removed too. This can't be undone.")}
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold text-brand-700">{tx("I want to delete my account")}</summary>
            <ActionForm action={deleteAccount} className="mt-3 space-y-3">
              <Field label={tx("Type DELETE to confirm")}>
                <input className="input" name="confirm" autoComplete="off" required />
              </Field>
              <Field label={tx("Your password")}>
                <input className="input" type="password" name="password" autoComplete="current-password" required />
              </Field>
              <SubmitButton className="btn w-full bg-brand-600 text-white hover:bg-brand-700" pendingText={tx("Deleting…")}>
                {tx("Delete my account permanently")}
              </SubmitButton>
            </ActionForm>
          </details>
        </section>
      )}
    </div>
  );
}
