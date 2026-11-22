import Link from "next/link";
import type { ReactNode } from "react";
import { licenceLabel } from "@/lib/constants";
import { money } from "@/lib/format";
import { Avatar, Stars } from "./ui";

export type DriverCardData = {
  id: string;
  fullName: string;
  town: string | null;
  licenceClasses: string[];
  skills: string[];
  experienceYears: number | null;
  rateType: "SHIFT" | "HOURLY";
  rateAmount: number | null;
  verificationStatus: string;
};

export function DriverCard({
  driver,
  rating,
  distance,
  note,
  availability,
  availableToday,
  children,
}: {
  driver: DriverCardData;
  rating?: { average: number | null; count: number };
  distance?: number | null;
  note?: string | null;
  availability?: string | null;
  availableToday?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="card p-4">
      <Link href={`/drivers/${driver.id}`} className="flex items-start gap-3">
        <Avatar name={driver.fullName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-navy-900">{driver.fullName}</p>
            {driver.verificationStatus === "VERIFIED" && <span className="chip bg-emerald-50 text-emerald-700">✓ Verified</span>}
          </div>
          <p className="text-sm text-slate-600">
            {driver.licenceClasses.map(licenceLabel).join(", ") || "No class set"}
            {driver.town && ` · ${driver.town}`}
            {distance != null && <span className="text-slate-400"> · {Math.round(distance)} mi</span>}
          </p>
          {rating && (
            <div className="mt-0.5">
              <Stars value={rating.average} count={rating.count} />
            </div>
          )}
        </div>
        {driver.rateAmount != null && (
          <div className="shrink-0 text-right">
            <p className="font-extrabold text-navy-900">{money(driver.rateAmount)}</p>
            <p className="text-[11px] text-slate-500">{driver.rateType === "HOURLY" ? "per hour" : "per shift"}</p>
          </div>
        )}
      </Link>
      {(driver.skills.length > 0 || driver.experienceYears != null || availableToday) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {availableToday && <span className="chip bg-emerald-50 text-emerald-700">● Available today</span>}
          {driver.experienceYears != null && <span className="chip bg-slate-100 text-slate-700">{driver.experienceYears} yrs exp.</span>}
          {driver.skills.slice(0, 6).map((s) => (
            <span key={s} className="chip bg-navy-50 text-navy-800">
              {s}
            </span>
          ))}
        </div>
      )}
      {availability && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">📅 {availability}</p>}
      {note && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">“{note}”</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
