import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@/lib/i18n";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field } from "@/components/ui";
import { login } from "../actions";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const { t: d } = await getDict();
  const t = d.auth;
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="h1">{t.loginTitle}</h1>
      <p className="muted mt-1">{t.loginSub}</p>
      <div className="card mt-6 p-6">
        <ActionForm action={login} className="space-y-4">
          <input type="hidden" name="next" value={next ?? ""} />
          <Field label={t.email}>
            <input className="input" type="email" name="email" autoComplete="email" required />
          </Field>
          <Field
            label={t.password}
            hint={
              <Link href="/forgot-password" className="font-medium text-navy-900 underline">
                {t.forgot}
              </Link>
            }
          >
            <input className="input" type="password" name="password" autoComplete="current-password" required />
          </Field>
          <SubmitButton pendingText={t.loggingIn}>{t.loginBtn}</SubmitButton>
        </ActionForm>
      </div>
      <p className="mt-6 text-center text-sm text-slate-600">
        {t.newHere}{" "}
        <Link href="/register" className="font-semibold text-brand-600 hover:underline">
          {t.createFree}
        </Link>
      </p>
    </div>
  );
}
