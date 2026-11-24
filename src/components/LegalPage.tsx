import type { ReactNode } from "react";

export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro?: ReactNode; sections: { h: string; body: ReactNode }[] }) {
  return (
    <div className="page max-w-3xl space-y-5 text-[15px] leading-relaxed text-slate-700">
      <div>
        <h1 className="h1">{title}</h1>
        <p className="muted">Last updated {updated}</p>
      </div>
      {intro}
      <nav className="card p-4 text-sm">
        <p className="mb-2 font-semibold text-navy-900">Contents</p>
        <ol className="list-decimal space-y-1 pl-5">
          {sections.map((s, i) => (
            <li key={s.h}>
              <a href={`#s${i + 1}`} className="hover:underline">
                {s.h}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      {sections.map((s, i) => (
        <section key={s.h} id={`s${i + 1}`} className="scroll-mt-20 space-y-2">
          <h2 className="h2">
            {i + 1}. {s.h}
          </h2>
          {s.body}
        </section>
      ))}
    </div>
  );
}

export function Draft() {
  return (
    <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
      This document is a carefully prepared draft. It will be reviewed by a UK solicitor and finalised with our company registration details
      before we introduce any fees.
    </p>
  );
}
