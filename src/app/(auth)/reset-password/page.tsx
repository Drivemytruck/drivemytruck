import Link from "next/link";
import type { Metadata } from "next";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field } from "@/components/ui";
import { resetPassword } from "../reset-actions";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="h1">Set a new password</h1>
      {token ? (
        <div className="card mt-6 p-6">
          <ActionForm action={resetPassword} className="space-y-4">
            <input type="hidden" name="token" value={token} />
            <Field label="New password" hint="At least 8 characters">
              <input className="input" type="password" name="password" autoComplete="new-password" minLength={8} required />
            </Field>
            <Field label="Repeat new password">
              <input className="input" type="password" name="confirm" autoComplete="new-password" minLength={8} required />
            </Field>
            <SubmitButton pendingText="Saving…">Save new password</SubmitButton>
          </ActionForm>
        </div>
      ) : (
        <p className="muted mt-4">
          This link is missing its code.{" "}
          <Link href="/forgot-password" className="font-semibold text-brand-600 underline">
            Request a new link
          </Link>
        </p>
      )}
    </div>
  );
}
