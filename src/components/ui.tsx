import type { ReactNode } from "react";
import { initials } from "@/lib/format";

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function CheckboxGroup({
  name,
  options,
  selected = [],
}: {
  name: string;
  options: readonly { value: string; label: string }[] | readonly string[];
  selected?: string[];
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div className="flex flex-wrap gap-2">
      {opts.map((o) => (
        <label key={o.value} className="cursor-pointer">
          <input type="checkbox" name={name} value={o.value} defaultChecked={selected.includes(o.value)} className="peer sr-only" />
          <span className="chip border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 peer-checked:border-navy-900 peer-checked:bg-navy-900 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-navy-700">
            {o.label}
          </span>
        </label>
      ))}
    </div>
  );
}

export function Stars({ value, count, size = "sm" }: { value: number | null; count?: number; size?: "sm" | "lg" }) {
  if (value == null) return <span className="text-xs text-slate-500">No reviews yet</span>;
  const full = Math.round(value);
  return (
    <span className={`inline-flex items-center gap-1 ${size === "lg" ? "text-base" : "text-xs"}`}>
      <span className="text-amber-500" aria-hidden>
        {"★".repeat(full)}
        <span className="text-slate-300">{"★".repeat(5 - full)}</span>
      </span>
      <span className="font-semibold text-slate-800">{value.toFixed(1)}</span>
      {count != null && <span className="text-slate-500">({count})</span>}
      <span className="sr-only">{value} out of 5 stars</span>
    </span>
  );
}

const statusStyles: Record<string, string> = {
  VERIFIED: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  REJECTED: "bg-brand-50 text-brand-700",
  OPEN: "bg-emerald-50 text-emerald-700",
  FILLED: "bg-navy-50 text-navy-800",
  COMPLETED: "bg-slate-100 text-slate-700",
  CANCELLED: "bg-slate-100 text-slate-500",
  APPLIED: "bg-amber-50 text-amber-700",
  INVITED: "bg-sky-50 text-sky-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  DECLINED: "bg-slate-100 text-slate-500",
  WITHDRAWN: "bg-slate-100 text-slate-500",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  NO_SHOW: "bg-brand-50 text-brand-700",
};

const statusText: Record<string, string> = {
  VERIFIED: "✓ Verified",
  PENDING: "Pending check",
  REJECTED: "Rejected",
  OPEN: "Open",
  FILLED: "Booked",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  APPLIED: "Applied",
  INVITED: "Invited",
  ACCEPTED: "Booked",
  DECLINED: "Not selected",
  WITHDRAWN: "Withdrawn",
  CONFIRMED: "Confirmed",
  NO_SHOW: "Driver no-show",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`chip ${statusStyles[status] ?? "bg-slate-100 text-slate-700"}`}>{statusText[status] ?? status}</span>;
}

export function Avatar({ name, size = 44, src }: { name: string; size?: number; src?: string | null }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" width={size} height={size} className="shrink-0 rounded-full bg-slate-100 object-cover" style={{ width: size, height: size }} />
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-navy-900 font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials(name) || "?"}
    </span>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card px-6 py-10 text-center">
      <p className="font-semibold text-navy-900">{title}</p>
      {children && <div className="mt-2 text-sm text-slate-500">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, href }: { label: string; value: ReactNode; href?: string }) {
  const inner = (
    <>
      <div className="text-2xl font-extrabold text-navy-900">{value}</div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        {label}
        {href && <span aria-hidden>›</span>}
      </div>
    </>
  );
  return href ? (
    <a href={href} className="card block p-4 transition hover:border-navy-700 hover:shadow-md">
      {inner}
    </a>
  ) : (
    <div className="card p-4">{inner}</div>
  );
}
