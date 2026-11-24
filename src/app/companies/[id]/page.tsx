import Link from "next/link";
import { getTx } from "@/lib/i18n";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { licenceLabel } from "@/lib/constants";
import { dateTime, money } from "@/lib/format";
import { ratingSummary } from "@/lib/reviews";
import { avatarUrl } from "@/lib/avatar";
import { reliabilityOf } from "@/lib/reliability";
import { ReliabilityBadges } from "@/components/ReliabilityBadges";
import { ReviewList } from "@/components/Reviews";
import { Avatar, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Company" };

export default async function CompanyPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { tx } = await getTx();
  const { id } = await params;
  const viewer = await requireUser();
  const company = await db.companyProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, suspended: true, avatarVersion: true } },
      jobs: { where: { status: "OPEN", startAt: { gte: new Date() } }, orderBy: { startAt: "asc" }, take: 10 },
      _count: { select: { bookings: { where: { status: "COMPLETED" } } } },
    },
  });
  if (!company || company.user.suspended) notFound();
  const [summary, reliability] = await Promise.all([
    ratingSummary(company.user.id),
    reliabilityOf({ userId: company.user.id, companyId: company.id }),
  ]);
  const isDriver = viewer.role === "DRIVER";

  return (
    <div className="page max-w-2xl space-y-4">
      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar name={company.companyName} size={64} src={avatarUrl(company.user)} />
          <div>
            <h1 className="h1">{company.companyName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <StatusBadge status={company.verificationStatus} tx={tx} />
              {company.town && <span>📍 {company.town}</span>}
              <span>· {company._count.bookings} jobs completed</span>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <ReliabilityBadges r={reliability} role="COMPANY" tx={tx} />
        </div>
        {company.about && <p className="mt-4 whitespace-pre-line text-slate-700">{company.about}</p>}
      </div>

      <ReviewList summary={summary} tx={tx} />

      {company.jobs.length > 0 && (
        <section className="card p-5">
          <h2 className="h2">{tx("Open jobs")}</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {company.jobs.map((j) => (
              <li key={j.id}>
                <Link href={isDriver ? `/jobs/${j.id}` : `/company/jobs/${j.id}`} className="flex items-center justify-between py-3 hover:text-brand-600">
                  <span>
                    <span className="block font-semibold">{licenceLabel(j.licenceClass)} · {j.town ?? j.postcode}</span>
                    <span className="text-sm text-slate-500">{dateTime(j.startAt)}</span>
                  </span>
                  <span className="font-extrabold">{money(j.payAmount)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
