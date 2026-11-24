import { PL } from "./pl";

export type Lang = "en" | "pl";
export type Tx = (s: string, vars?: Record<string, string | number>) => string;

/**
 * Translation keyed by the English text: tx("My work") → "Moja praca" in Polish.
 * Missing Polish entries fall back to English. Use {placeholders} for variables.
 */
export function makeTx(lang: Lang): Tx {
  return (s, vars) => {
    let out = lang === "pl" ? (PL[s] ?? s) : s;
    if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
    return out;
  };
}
