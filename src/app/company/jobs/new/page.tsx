import type { Metadata } from "next";
import { requireCompany } from "@/lib/session";
import { EMPLOYMENT_TYPES, JOB_TYPES, LICENCE_CLASSES, PERM_LISTING_DAYS, VEHICLE_TYPES } from "@/lib/constants";
import { todayISO } from "@/lib/format";
import { JobForm } from "@/components/JobForm";
import { createJob } from "../../actions";
import { getTx } from "@/lib/i18n";

export const metadata: Metadata = { title: "Post a job" };

export default async function NewJobPage() {
  const { company } = await requireCompany();
  const { tx, lang } = await getTx();
  return (
    <div className="page max-w-2xl space-y-5">
      <div>
        <h1 className="h1">
          {tx("Post a")} <span className="text-brand-500">{tx("job")}</span>
        </h1>
        <p className="muted">{tx("A one-off shift or a permanent driver — find them here.")}</p>
      </div>
      <div className="card p-5 sm:p-6">
        <JobForm
          action={createJob}
          postcode={company.postcode ?? ""}
          today={todayISO()}
          licenceClasses={LICENCE_CLASSES}
          jobTypes={JOB_TYPES}
          vehicleTypes={VEHICLE_TYPES}
          employmentTypes={EMPLOYMENT_TYPES}
          listingDays={PERM_LISTING_DAYS}
          lang={lang}
        />
      </div>
    </div>
  );
}
