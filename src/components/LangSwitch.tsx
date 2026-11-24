"use client";

import { usePathname, useSearchParams } from "next/navigation";

export function LangSwitch({ lang }: { lang: "en" | "pl" }) {
  const path = usePathname();
  const sp = useSearchParams();
  const back = encodeURIComponent(path + (sp.toString() ? `?${sp}` : ""));
  const link = (to: "en" | "pl", label: string) => (
    <a
      href={`/lang?to=${to}&back=${back}`}
      className={`rounded-md px-1.5 py-1 text-xs font-bold ${lang === to ? "bg-navy-900 text-white" : "text-slate-500 hover:text-navy-900"}`}
      aria-current={lang === to ? "true" : undefined}
      hrefLang={to}
    >
      {label}
    </a>
  );
  return (
    <span className="flex items-center gap-0.5 rounded-lg border border-slate-200 p-0.5" aria-label="Language">
      {link("en", "EN")}
      {link("pl", "PL")}
    </span>
  );
}
