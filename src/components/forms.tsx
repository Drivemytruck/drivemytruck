"use client";

import { createContext, useActionState, useContext, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

export type ActionState = { error?: string; ok?: string } | undefined;

const PendingContext = createContext<boolean | null>(null);

/**
 * Form wired to a server action that shows its error/success message.
 * We submit manually (instead of <form action>) so React doesn't clear what the user typed
 * when the action returns an error.
 */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction, actionPending] = useActionState(action, undefined);
  const [transitionPending, startTransition] = useTransition();
  const pending = actionPending || transitionPending;
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const fd = new FormData(e.currentTarget, submitter);
        startTransition(() => formAction(fd));
      }}
    >
      {state?.error && (
        <p role="alert" className="mb-4 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {state.ok}
        </p>
      )}
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
    </form>
  );
}

export function SubmitButton({
  children,
  className = "btn-primary w-full",
  pendingText = "Please wait…",
  name,
  value,
}: {
  children: ReactNode;
  className?: string;
  pendingText?: string;
  name?: string;
  value?: string;
}) {
  const ctx = useContext(PendingContext);
  const { pending: formPending } = useFormStatus();
  const pending = ctx ?? formPending;
  return (
    <button type="submit" className={className} disabled={pending} name={name} value={value}>
      {pending ? pendingText : children}
    </button>
  );
}
