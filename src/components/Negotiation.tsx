import type { PayType } from "@prisma/client";
import { ActionForm, SubmitButton } from "./forms";
import { Field } from "./ui";
import { proposeTerms, respondToOffer, withdrawOffer } from "@/app/offers/actions";
import { termsLabel } from "@/lib/offers";
import type { Lang, Tx } from "@/lib/tx";

type Offer = { id: string; byRole: string; payAmount: number; payType: PayType; startAt: Date; note: string | null; status: string; createdAt: Date };

const londonDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(d);
const londonTime = (d: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);

/** Form to propose pay / start time. Prefilled with the latest terms on the table. */
export function TermsForm({
  base,
  hidden,
  submit,
  tx,
}: {
  base: { payAmount: number; payType: PayType; startAt: Date };
  hidden: Record<string, string>;
  submit: string;
  tx: Tx;
}) {
  return (
    <ActionForm action={proposeTerms} className="space-y-3">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div className="grid grid-cols-2 gap-3">
        <Field label={tx("Pay (£)")}>
          <input className="input" type="number" name="offerPay" min={1} step="0.01" defaultValue={base.payAmount / 100} required />
        </Field>
        <Field label={tx("Pay is")}>
          <select className="input" name="offerPayType" defaultValue={base.payType === "HOURLY" ? "HOURLY" : "SHIFT"}>
            <option value="SHIFT">{tx("per shift")}</option>
            <option value="HOURLY">{tx("per hour")}</option>
          </select>
        </Field>
        <Field label={tx("Start date")}>
          <input className="input" type="date" name="offerDate" defaultValue={londonDate(base.startAt)} required />
        </Field>
        <Field label={tx("Start time")}>
          <input className="input" type="time" name="offerTime" defaultValue={londonTime(base.startAt)} required />
        </Field>
      </div>
      <Field label={tx("Message (optional)")}>
        <input className="input" name="offerNote" maxLength={300} placeholder={tx("e.g. I can start at 4:00 for £280")} />
      </Field>
      <SubmitButton className="btn-navy w-full" pendingText={tx("Sending…")}>
        {submit}
      </SubmitButton>
    </ActionForm>
  );
}

/**
 * Negotiation box for one application, as seen by the driver or the company.
 * Shows the offer on the table, lets you accept / decline / counter, and the history.
 */
export function Negotiation({
  viewer,
  applicationId,
  jobId,
  offers,
  job,
  otherName,
  tx,
  lang,
}: {
  viewer: "DRIVER" | "COMPANY";
  applicationId: string;
  jobId: string;
  offers: Offer[];
  job: { payAmount: number; payType: PayType; startAt: Date };
  otherName: string;
  tx: Tx;
  lang: Lang;
}) {
  const pending = offers.find((o) => o.status === "PENDING");
  const latest = offers[0];
  const base = latest ?? job;
  const hidden: Record<string, string> = viewer === "DRIVER" ? { jobId } : { applicationId };
  const history = offers.filter((o) => o.status !== "PENDING").slice(0, 4);
  const who = (o: Offer) => (o.byRole === viewer ? tx("You") : otherName);
  const statusText: Record<string, string> = { ACCEPTED: tx("accepted"), DECLINED: tx("declined"), WITHDRAWN: tx("withdrawn"), SUPERSEDED: tx("replaced") };

  return (
    <div className="space-y-3">
      {pending && pending.byRole !== viewer && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm">
          <p className="font-semibold text-sky-900">💬 {tx("{who} offers:", { who: otherName })}</p>
          <p className="mt-1 text-base font-bold text-navy-900">{termsLabel(pending, tx, lang)}</p>
          {pending.note && <p className="mt-1 text-slate-700">“{pending.note}”</p>}
          <p className="mt-1 text-xs text-slate-500">
            {tx("Advertised:")} <span className="line-through">{termsLabel(job, tx, lang)}</span>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <ActionForm action={respondToOffer}>
              <input type="hidden" name="offerId" value={pending.id} />
              <SubmitButton className="btn-primary w-full" name="decision" value="ACCEPT" pendingText={tx("Booking…")}>
                {tx("Accept & book")}
              </SubmitButton>
            </ActionForm>
            <ActionForm action={respondToOffer}>
              <input type="hidden" name="offerId" value={pending.id} />
              <SubmitButton className="btn-outline w-full" name="decision" value="DECLINE" pendingText={tx("Saving…")}>
                {tx("Decline")}
              </SubmitButton>
            </ActionForm>
          </div>
        </div>
      )}

      {pending && pending.byRole === viewer && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="font-semibold text-amber-900">⏳ {tx("You offered — waiting for {who}:", { who: otherName })}</p>
          <p className="mt-1 font-bold text-navy-900">{termsLabel(pending, tx, lang)}</p>
          <form action={withdrawOffer} className="mt-2">
            <input type="hidden" name="offerId" value={pending.id} />
            <button className="text-xs font-medium text-slate-500 underline">{tx("Withdraw offer")}</button>
          </form>
        </div>
      )}

      <details className="rounded-xl border border-slate-200 p-3 text-sm">
        <summary className="cursor-pointer font-semibold text-navy-900">
          💬 {pending && pending.byRole !== viewer ? tx("Make a counter-offer") : viewer === "DRIVER" ? tx("Propose different pay or start time") : tx("Offer different pay or start time")}
        </summary>
        <div className="mt-3">
          <TermsForm base={base} hidden={hidden} submit={tx("Send offer")} tx={tx} />
        </div>
      </details>

      {history.length > 0 && (
        <ul className="space-y-1 text-xs text-slate-500">
          {history.map((o) => (
            <li key={o.id}>
              {who(o)}: {termsLabel(o, tx, lang)} — {statusText[o.status] ?? o.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
