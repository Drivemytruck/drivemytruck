import Link from "next/link";
import type { Metadata } from "next";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field } from "@/components/ui";
import { requestPasswordReset } from "../reset-actions";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="h1">Forgot your password?</h1>
      <p className="muted mt-1">Enter your email and we&apos;ll send you a link to set a new one.</p>
      <div className="card mt-6 p-6">
        <ActionForm action={requestPasswordReset} className="space-y-4">
          <Field label="Email">
            <input className="input" type="email" name="email" autoComplete="email" required />
          </Field>
          <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
        </ActionForm>
      </div>
      <p className="mt-6 text-center text-sm text-slate-600">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
