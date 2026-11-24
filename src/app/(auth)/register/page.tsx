import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@/lib/i18n";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field } from "@/components/ui";
import { register } from "../actions";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  const initial = role === "company" ? "COMPANY" : "DRIVER";
  const { t: d } = await getDict();
  const t = d.auth;
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="h1">{t.registerTitle}</h1>
      <p className="muted mt-1">{t.registerSub}</p>
      <div className="card mt-6 p-6">
        <ActionForm action={register} className="space-y-4">
          <fieldset>
            <legend className="label">{t.iAm}</legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "DRIVER", t: t.aDriver, s: t.aDriverSub },
                { v: "COMPANY", t: t.aCompany, s: t.aCompanySub },
              ].map((o) => (
                <label key={o.v} className="cursor-pointer">
                  <input type="radio" name="role" value={o.v} defaultChecked={initial === o.v} className="peer sr-only" />
                  <span className="block rounded-xl border-2 border-slate-200 p-3 text-center peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-focus-visible:outline-2 peer-focus-visible:outline-navy-700">
                    <span className="block font-bold text-navy-900">{o.t}</span>
                    <span className="block text-xs text-slate-500">{o.s}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <Field label={t.name}>
            <input className="input" name="name" autoComplete="name" required />
          </Field>
          <Field label={t.email}>
            <input className="input" type="email" name="email" autoComplete="email" required />
          </Field>
          <Field label={t.password} hint={t.passwordHint}>
            <input className="input" type="password" name="password" autoComplete="new-password" minLength={8} required />
          </Field>
          <Field label={t.postcode} hint={t.postcodeHint}>
            <input className="input uppercase" name="postcode" autoComplete="postal-code" placeholder="e.g. B1 1AA" required />
          </Field>
          <label className="flex items-start gap-3 text-sm text-slate-600">
            <input type="checkbox" name="terms" className="mt-0.5 h-5 w-5 rounded accent-brand-500" required />
            <span>
              {t.agreeA}{" "}
              <Link href="/terms" className="font-medium text-navy-900 underline" target="_blank">
                {t.terms}
              </Link>{" "}
              {t.and}{" "}
              <Link href="/privacy" className="font-medium text-navy-900 underline" target="_blank">
                {t.privacy}
              </Link>
              .
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-slate-600">
            <input type="checkbox" name="marketing" className="mt-0.5 h-5 w-5 rounded accent-brand-500" />
            <span>
              {t.marketing}
            </span>
          </label>
          <SubmitButton pendingText={t.creating}>{t.createBtn}</SubmitButton>
        </ActionForm>
      </div>
      <p className="mt-6 text-center text-sm text-slate-600">
        {t.haveAccount}{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          {d.nav.login}
        </Link>
      </p>
    </div>
  );
}
