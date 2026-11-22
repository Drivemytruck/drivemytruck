import Link from "next/link";
import { licenceLabel } from "@/lib/constants";
import { money, relativeDay, timeOnly } from "@/lib/format";
import { Stars, StatusBadge } from "./ui";

export type JobCardData = {
  id: string;
  licenceClass: string;
  town: string | null;
  postcode: string;
  startAt: Date;
  durationHours: number;
  payType: "SHIFT" | "HOURLY";
  payAmount: number;
  jobType: string | null;
  vehicleType: string | null;
  companyName: string;
  companyVerified?: boolean;
  rating?: { average: number | null; count: number };
  distance?: number | null;
  badge?: string;
};

export function JobCard({ job, href }: { job: JobCardData; href: string }) {
  return (
    <Link href={href} className="card block p-4 transition hover:border-navy-700 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-navy-900">{licenceLabel(job.licenceClass)} driver</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
            <span className="truncate">{job.companyName}</span>
            {job.companyVerified && <span className="chip bg-emerald-50 text-emerald-700">✓ Verified</span>}
          </p>
          {job.rating && (
            <div className="mt-1">
              <Stars value={job.rating.average} count={job.rating.count} />
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-extrabold text-navy-900">{money(job.payAmount)}</p>
          <p className="text-xs text-slate-500">{job.payType === "HOURLY" ? "per hour" : "per shift"}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-1 text-sm text-slate-600">
        <p>
          📍 {job.town ?? job.postcode}
          {job.distance != null && <span className="text-slate-400"> · {Math.round(job.distance)} miles away</span>}
        </p>
        <p>
          🕒 {relativeDay(job.startAt)}, {timeOnly(job.startAt)} start · approx {job.durationHours} h
        </p>
        {(job.jobType || job.vehicleType) && <p>🚛 {[job.jobType, job.vehicleType].filter(Boolean).join(" · ")}</p>}
      </div>
      {job.badge && (
        <div className="mt-3">
          <StatusBadge status={job.badge} />
        </div>
      )}
    </Link>
  );
}
