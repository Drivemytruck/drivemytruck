import "server-only";
import { decrypt } from "./crypto";

/** Standard shift instructions a company saves once (stored encrypted on CompanyProfile). */
export const INSTR_FIELDS = [
  { key: "instrAccess", icon: "🚧", label: "Getting in: gate, yard & parking", placeholder: "e.g. Gate code 1234# · park your car by the fence on the left · sign in at the gatehouse" },
  { key: "instrKeys", icon: "🔑", label: "Keys & truck", placeholder: "e.g. Key safe on the workshop wall, code 0815 · keys for each truck are labelled by reg" },
  { key: "instrPaperwork", icon: "📋", label: "Paperwork & checks", placeholder: "e.g. Walkaround check before leaving · delivery notes in the door pocket · leave paperwork in the office letterbox" },
  { key: "instrApps", icon: "📱", label: "Apps to download", placeholder: "e.g. Our walkaround app and the customer's delivery app — please install before the shift" },
  { key: "instrEmergency", icon: "🆘", label: "Out-of-hours contact", placeholder: "e.g. Night transport manager Tom: 07700 900123 (breakdowns: 0800 …)" },
] as const;

export type InstrKey = (typeof INSTR_FIELDS)[number]["key"];
export const INSTR_KEYS = INSTR_FIELDS.map((f) => f.key) as InstrKey[];

export function companyInstructions(company: Record<InstrKey, string | null>) {
  return INSTR_FIELDS.map((f) => ({ ...f, text: decrypt(company[f.key]) ?? "" })).filter((f) => f.text.trim());
}

export function hasInstructions(company: Record<InstrKey, string | null>) {
  return INSTR_KEYS.some((k) => company[k]);
}

/** Hours before the start when the driver can open the instructions, and after the end when they disappear. */
export const UNLOCK_HOURS_BEFORE = 24;
export const HIDE_HOURS_AFTER = 12;

/** For safety (gate codes, key safes) the driver only sees instructions around the shift itself. */
export function instructionsWindow(startAt: Date, durationHours: number) {
  return {
    from: new Date(startAt.getTime() - UNLOCK_HOURS_BEFORE * 3600000),
    until: new Date(startAt.getTime() + (durationHours + HIDE_HOURS_AFTER) * 3600000),
  };
}
