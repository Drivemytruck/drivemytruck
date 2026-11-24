import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@/lib/i18n";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field } from "@/components/ui";
import { resetPassword } from "../reset-actions";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const { t: d } = await getDict();
  const t = d.auth;
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="h1">{t.resetTitle}</h1>
      {token ? (
        <div className="card mt-6 p-6">
          <ActionForm action={resetPassword} className="space-y-4">
            <input type="hidden" name="token" value={token} />
            <Field label={t.newPassword} hint={t.passwordHint}>
              <input className="input" type="password" name="password" autoComplete="new-password" minLength={8} required />
            </Field>
            <Field label={t.repeatPassword}>
              <input className="input" type="password" name="confirm" autoComplete="new-password" minLength={8} required />
            </Field>
            <SubmitButton pendingText={t.saving}>{t.savePassword}</SubmitButton>
          </ActionForm>
        </div>
      ) : (
        <p className="muted mt-4">
          {t.linkMissing}{" "}
          <Link href="/forgot-password" className="font-semibold text-brand-600 underline">
            {t.requestNew}
          </Link>
        </p>
      )}
    </div>
  );
}
