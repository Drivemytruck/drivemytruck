import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@/lib/i18n";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field } from "@/components/ui";
import { requestPasswordReset } from "../reset-actions";

export const metadata: Metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage() {
  const { t: d } = await getDict();
  const t = d.auth;
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="h1">{t.forgotTitle}</h1>
      <p className="muted mt-1">{t.forgotSub}</p>
      <div className="card mt-6 p-6">
        <ActionForm action={requestPasswordReset} className="space-y-4">
          <Field label={t.email}>
            <input className="input" type="email" name="email" autoComplete="email" required />
          </Field>
          <SubmitButton pendingText={t.sending}>{t.sendLink}</SubmitButton>
        </ActionForm>
      </div>
      <p className="mt-6 text-center text-sm text-slate-600">
        {t.remembered}{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          {t.backToLogin}
        </Link>
      </p>
    </div>
  );
}
