import "server-only";
import type { PayType, Role } from "@prisma/client";
import { db } from "./db";
import { londonToDate, money } from "./format";
import { contactDetailsError } from "./contact-guard";
import type { Lang, Tx } from "./tx";

export type Terms = { payAmount: number; payType: PayType; startAt: Date; note: string | null };

/** Read proposed pay / start time from a form. Returns an English error key or the terms. */
export function parseTerms(fd: FormData): { error: string } | { terms: Terms } {
  const pay = Number(fd.get("offerPay"));
  if (!Number.isFinite(pay) || pay < 1 || pay > 10000) return { error: "Enter the pay you're proposing." };
  const payType = fd.get("offerPayType") === "HOURLY" ? "HOURLY" : "SHIFT";
  const date = String(fd.get("offerDate") ?? "");
  const time = String(fd.get("offerTime") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return { error: "Choose a start date and time." };
  const startAt = londonToDate(date, time);
  if (startAt.getTime() < Date.now()) return { error: "The start time is in the past." };
  const note = String(fd.get("offerNote") ?? "").trim().slice(0, 300) || null;
  if (contactDetailsError(note)) return { error: contactDetailsError(note)! };
  return { terms: { payAmount: Math.round(pay * 100), payType, startAt, note } };
}

/** Put a new offer on the table (any previous pending one is superseded). */
export async function createOffer(applicationId: string, byRole: Role, t: Terms) {
  await db.offer.updateMany({ where: { applicationId, status: "PENDING" }, data: { status: "SUPERSEDED" } });
  return db.offer.create({ data: { applicationId, byRole, payAmount: t.payAmount, payType: t.payType, startAt: t.startAt, note: t.note } });
}

export function termsLabel(t: { payAmount: number; payType: PayType; startAt: Date }, tx: Tx, lang: Lang) {
  const when = new Intl.DateTimeFormat(lang === "pl" ? "pl-PL" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(t.startAt);
  return `${money(t.payAmount)} ${tx(t.payType === "HOURLY" ? "per hour" : t.payType === "ANNUAL" ? "per year" : "per shift")} · ${tx("start")} ${when}`;
}

/** Terms actually agreed on a booking (falls back to the advertised job terms). */
export function agreedTerms(b: { agreedPayAmount: number | null; agreedPayType: PayType | null; agreedStartAt: Date | null }, job: { payAmount: number; payType: PayType; startAt: Date }) {
  return {
    payAmount: b.agreedPayAmount ?? job.payAmount,
    payType: b.agreedPayType ?? job.payType,
    startAt: b.agreedStartAt ?? job.startAt,
    negotiated: b.agreedPayAmount != null || b.agreedStartAt != null,
  };
}
