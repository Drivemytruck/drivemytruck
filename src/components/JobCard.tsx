import Link from "next/link";
import { licenceLabel } from "@/lib/constants";
import { dateOnly, money, relativeDay, timeOnly, payUnit } from "@/lib/format";
import { Stars, StatusBadge } from "./ui";
import type { Tx } from "@/lib/tx";

export type JobCardData = {
  id: string;
  licenceClass: string;
  town: string | null;
  postcode: string;
  startAt: Date;
  durationHours: number;
  kind?: "SHIFT" | "PERMANENT";
  schedule?: string | null;
  employmentType?: string | null;
  startAsap?: boolean;
  payType: "SHIFT" | "HOURLY" | "ANNUAL";
  payAmount: number;
  jobType: string | null;
  vehicleType: string | null;
  companyName: string;
  companyVerified?: boolean;
  rating?: { average: number | null; count: number };
  distance?: number | null;
  badge?: string;
};

export function JobCard({ job, href, tx = (s) => s }: { job: JobCardData; href: string; tx?: Tx }) {
  return (
    <Link href={href} className="card block p-4 transition hover:border-navy-700 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {job.kind === "PERMANENT" && <span className="chip mb-1 bg-sky-50 text-sky-800">🤝 {tx("Permanent")}</span>}
          <p className="font-bold text-navy-900">{tx("{class} driver", { class: licenceLabel(job.licenceClass) })}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
            <span className="truncate">{job.companyName}</span>
            {job.companyVerified && <span className="chip bg-emerald-50 text-emerald-700">✓ {tx("Verified")}</span>}
          </p>
          {job.rating && (
            <div className="mt-1">
              <Stars value={job.rating.average} count={job.rating.count} tx={tx} />
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-extrabold text-navy-900">{money(job.payAmount)}</p>
          <p className="text-xs text-slate-500">{tx(payUnit(job.payType))}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-1 text-sm text-slate-600">
        <p>
          📍 {job.town ?? job.postcode}
          {job.distance != null && <span className="text-slate-400"> · {tx("{n} miles away", { n: Math.round(job.distance) })}</span>}
        </p>
        {job.kind === "PERMANENT" ? (
          <>
            <p>🗓️ {job.schedule}</p>
            <p>
              🕒 {job.startAsap ? tx("Start ASAP") : tx("Starts {date}", { date: dateOnly(job.startAt) })}
              {job.employmentType && ` · ${tx(job.employmentType)}`}
            </p>
          </>
        ) : (
          <p>
            🕒 {tx("{day}, {time} start · approx {h} h", { day: tx(relativeDay(job.startAt)), time: timeOnly(job.startAt), h: job.durationHours })}
          </p>
        )}
        {(job.jobType || job.vehicleType) && <p>🚛 {[job.jobType, job.vehicleType].filter(Boolean).join(" · ")}</p>}
      </div>
      {job.badge && (
        <div className="mt-3">
          <StatusBadge status={job.badge} tx={tx} />
        </div>
      )}
    </Link>
  );
}
