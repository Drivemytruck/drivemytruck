import Link from "next/link";
import type { Metadata } from "next";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field } from "@/components/ui";
import { login } from "../actions";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="h1">Welcome back</h1>
      <p className="muted mt-1">Log in to find work or book a driver.</p>
      <div className="card mt-6 p-6">
        <ActionForm action={login} className="space-y-4">
          <input type="hidden" name="next" value={next ?? ""} />
          <Field label="Email">
            <input className="input" type="email" name="email" autoComplete="email" required />
          </Field>
          <Field label="Password">
            <input className="input" type="password" name="password" autoComplete="current-password" required />
          </Field>
          <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
        </ActionForm>
      </div>
      <p className="mt-6 text-center text-sm text-slate-600">
        New here?{" "}
        <Link href="/register" className="font-semibold text-brand-600 hover:underline">
          Create a free account
        </Link>
      </p>
    </div>
  );
}
