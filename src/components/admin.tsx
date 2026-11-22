import Link from "next/link";
import type { ReactNode } from "react";

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="h2">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Info({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(110px,auto)_1fr] gap-x-4 gap-y-2 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-slate-500">{k}</dt>
          <dd className="min-w-0 break-words text-slate-900">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function RowLink({ href, title, sub, right }: { href: string; title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-50">
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-navy-900">{title}</span>
        {sub && <span className="block truncate text-xs text-slate-500">{sub}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {right}
        <span aria-hidden className="text-slate-400">›</span>
      </span>
    </Link>
  );
}
