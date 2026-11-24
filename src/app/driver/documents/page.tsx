import type { Metadata } from "next";
import { getTx } from "@/lib/i18n";
import { db } from "@/lib/db";
import { requireDriver } from "@/lib/session";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { dateOnly } from "@/lib/format";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Field, StatusBadge } from "@/components/ui";
import { saveDocument } from "../actions";
import { decrypt } from "@/lib/crypto";

export const metadata: Metadata = { title: "My documents" };

export default async function DocumentsPage() {
  const { tx } = await getTx();
  const { driver } = await requireDriver();
  const docs = await db.driverDocument.findMany({ where: { driverId: driver.id } });
  const byType = new Map(docs.map((d) => [d.type, d]));

  return (
    <div className="page max-w-2xl space-y-5">
      <div>
        <h1 className="h1">{tx("My documents")}</h1>
        <p className="muted">
          We check your details with official gov.uk services. Once everything is checked you get the{" "}
          <span className="font-semibold text-emerald-700">✓ {tx("Verified")}</span> badge.
        </p>
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">🔒 {tx("Your documents are safe with us")}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            <li>{tx("We never ask for photos or scans of your documents.")}</li>
            <li>{tx("Document numbers are encrypted, and only our verification team can see them.")}</li>
            <li>{tx("Companies only see “✓ Verified” — never your numbers.")}</li>
            <li>Your DVLA check code is deleted as soon as we&apos;ve checked it.</li>
          </ul>
          <a href="/security" className="mt-1 inline-block font-semibold underline">
            {tx("How we protect your data →")}
          </a>
        </div>
      </div>

      {DOCUMENT_TYPES.map((meta) => {
        const doc = byType.get(meta.type);
        return (
          <section key={meta.type} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="h2">
                  {tx(meta.label)} {!meta.required && <span className="text-xs font-normal text-slate-400">{tx("(optional)")}</span>}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{tx(meta.help)}</p>
              </div>
              {doc ? <StatusBadge status={doc.status} tx={tx} /> : <span className="chip bg-slate-100 text-slate-500">{tx("Not added")}</span>}
            </div>
            {doc?.status === "REJECTED" && doc.adminNote && (
              <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">Note from us: {doc.adminNote}</p>
            )}
            {doc?.expiresAt && <p className="mt-2 text-xs text-slate-500">{tx("Expires {date}", { date: dateOnly(doc.expiresAt) })}</p>}
            <ActionForm action={saveDocument} className="mt-4 space-y-3">
              <input type="hidden" name="type" value={meta.type} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={tx(meta.referenceLabel)}>
                  <input className="input" name="reference" defaultValue={decrypt(doc?.reference) ?? ""} required />
                </Field>
                {meta.needsCheckCode ? (
                  <Field
                    label={tx("DVLA check code")}
                    hint={
                      <>
                        Get one at{" "}
                        <a href="https://www.gov.uk/view-driving-licence" target="_blank" rel="noreferrer" className="underline">
                          {tx("gov.uk/view-driving-licence")}
                        </a>{" "}
                        (valid 21 days)
                      </>
                    }
                  >
                    <input className="input" name="checkCode" defaultValue={decrypt(doc?.checkCode) ?? ""} placeholder={tx("e.g. Ab Cd Ef Gh")} />
                  </Field>
                ) : (
                  <Field label={tx("Expiry date")}>
                    <input
                      className="input"
                      type="date"
                      name="expiresAt"
                      defaultValue={doc?.expiresAt ? doc.expiresAt.toISOString().slice(0, 10) : ""}
                    />
                  </Field>
                )}
              </div>
              <SubmitButton className="btn-navy btn-sm" pendingText={tx("Saving…")}>
                {doc ? tx("Update") : tx("Save")}
              </SubmitButton>
            </ActionForm>
          </section>
        );
      })}
    </div>
  );
}
