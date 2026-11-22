import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { avatarUrl } from "@/lib/avatar";
import { DOCUMENT_TYPES, licenceLabel } from "@/lib/constants";
import { dateOnly, dateTime, money } from "@/lib/format";
import { dayRateLabel, windowLabel } from "@/lib/availability";
import { reliabilityOf } from "@/lib/reliability";
import { ratingSummary } from "@/lib/reviews";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Info, RowLink, Section } from "@/components/admin";
import { ReliabilityBadges } from "@/components/ReliabilityBadges";
import { Avatar, Stars, StatusBadge } from "@/components/ui";
import { adminResetPassword, reviewDocument, setCompanyStatus, toggleSuspend } from "../../actions";

export const metadata: Metadata = { title: "Admin · User" };

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("ADMIN");
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    include: {
      driver: {
        include: {
          documents: true,
          availability: { where: { date: { gte: new Date(new Date().toISOString().slice(0, 10)) } }, orderBy: { date: "asc" }, take: 28 },
          applications: { include: { job: { include: { company: true } } }, orderBy: { createdAt: "desc" }, take: 50 },
          bookings: { include: { job: true, company: true }, orderBy: { createdAt: "desc" }, take: 50 },
        },
      },
      company: {
        include: {
          jobs: { include: { _count: { select: { applications: true } }, booking: { include: { driver: true } } }, orderBy: { startAt: "desc" }, take: 50 },
          bookings: { include: { job: true, driver: true }, orderBy: { createdAt: "desc" }, take: 50 },
        },
      },
      reviewsWritten: { include: { subject: { include: { driver: true, company: true } } }, orderBy: { createdAt: "desc" } },
      reviewsReceived: { include: { author: { include: { driver: true, company: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!user) notFound();
  const d = user.driver;
  const c = user.company;
  const name = d?.fullName ?? c?.companyName ?? "Admin";
  const [reliability, rating] = await Promise.all([
    reliabilityOf({ userId: user.id, driverId: d?.id, companyId: c?.id }),
    ratingSummary(user.id),
  ]);
  const personName = (u: { driver: { fullName: string } | null; company: { companyName: string } | null; email: string }) =>
    u.driver?.fullName ?? u.company?.companyName ?? u.email;

  return (
    <div className="page max-w-3xl space-y-4">
      <Link href="/admin/users" className="text-sm text-slate-500 hover:text-navy-900">
        ← All users
      </Link>

      <div className="card flex flex-wrap items-center gap-4 p-5">
        <Avatar name={name} src={avatarUrl(user)} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="h1">{name}</h1>
          <p className="text-sm text-slate-600">
            {user.role} · joined {dateOnly(user.createdAt)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {d && <StatusBadge status={d.verificationStatus} />}
            {c && <StatusBadge status={c.verificationStatus} />}
            {user.suspended && <span className="chip bg-slate-200 text-slate-700">Suspended</span>}
            {user.role !== "ADMIN" && <ReliabilityBadges r={reliability} role={user.role} />}
          </div>
          {user.role !== "ADMIN" && (
            <div className="mt-1">
              <Stars value={rating.average} count={rating.count} />
            </div>
          )}
        </div>
      </div>

      {user.role !== "ADMIN" && (
        <Section title="Actions">
          <div className="flex flex-wrap gap-2">
            <Link href={d ? `/drivers/${d.id}` : `/companies/${c!.id}`} className="btn-outline btn-sm">
              View public profile
            </Link>
            <a href={`mailto:${user.email}`} className="btn-outline btn-sm">
              ✉️ Email
            </a>
            {(d?.phone || c?.phone) && (
              <a href={`tel:${(d?.phone ?? c?.phone)!.replace(/\s/g, "")}`} className="btn-outline btn-sm">
                📞 Call
              </a>
            )}
            <form action={toggleSuspend}>
              <input type="hidden" name="userId" value={user.id} />
              <button className="btn-outline btn-sm">{user.suspended ? "Unsuspend" : "Suspend"}</button>
            </form>
            {c && c.verificationStatus !== "VERIFIED" && (
              <form action={setCompanyStatus}>
                <input type="hidden" name="companyId" value={c.id} />
                <button name="status" value="VERIFIED" className="btn-navy btn-sm">
                  Verify company
                </button>
              </form>
            )}
          </div>
          <ActionForm action={adminResetPassword} className="mt-3">
            <input type="hidden" name="userId" value={user.id} />
            <SubmitButton className="text-xs font-medium text-slate-500 underline" pendingText="Resetting…">
              Reset password (shows a temporary one)
            </SubmitButton>
          </ActionForm>
        </Section>
      )}

      <Section title="Details">
        <Info
          rows={[
            ["Email", user.email],
            ...(d
              ? ([
                  ["Phone", d.phone],
                  ["Location", [d.town, d.postcode].filter(Boolean).join(", ")],
                  ["Travels up to", `${d.travelRadiusMiles} miles`],
                  ["Licence", d.licenceClasses.map(licenceLabel).join(", ")],
                  ["Skills", d.skills.join(", ")],
                  ["Experience", d.experienceYears != null ? `${d.experienceYears} years` : null],
                  ["Rate", d.rateAmount != null ? `${money(d.rateAmount)} ${d.rateType === "HOURLY" ? "per hour" : "per shift"}` : null],
                  ["Bio", d.bio],
                ] as [string, React.ReactNode][])
              : []),
            ...(c
              ? ([
                  ["Contact", c.contactName],
                  ["Phone", c.phone],
                  ["Location", [c.town, c.postcode].filter(Boolean).join(", ")],
                  [
                    "Companies House",
                    c.companiesHouseNumber ? (
                      <a
                        className="underline"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://find-and-update.company-information.service.gov.uk/company/${encodeURIComponent(c.companiesHouseNumber)}`}
                      >
                        {c.companiesHouseNumber} ↗
                      </a>
                    ) : null,
                  ],
                  ["O-licence", c.operatorLicence],
                  ["About", c.about],
                ] as [string, React.ReactNode][])
              : []),
          ]}
        />
      </Section>

      {d && (
        <Section title="Documents">
          <ul className="divide-y divide-slate-100 text-sm">
            {DOCUMENT_TYPES.map((m) => {
              const doc = d.documents.find((x) => x.type === m.type);
              return (
                <li key={m.type} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span>
                    <span className="block font-medium text-slate-800">{m.label}</span>
                    {doc ? (
                      <span className="block text-xs text-slate-500">
                        Ref <span className="font-mono">{doc.reference}</span>
                        {doc.checkCode && (
                          <>
                            {" "}
                            · code <span className="font-mono">{doc.checkCode}</span>
                          </>
                        )}
                        {doc.expiresAt && ` · expires ${dateOnly(doc.expiresAt)}`}
                      </span>
                    ) : (
                      <span className="block text-xs text-slate-400">Not added</span>
                    )}
                  </span>
                  {doc && (
                    <span className="flex items-center gap-2">
                      <StatusBadge status={doc.status} />
                      {doc.status !== "VERIFIED" && (
                        <form action={reviewDocument}>
                          <input type="hidden" name="docId" value={doc.id} />
                          <button name="status" value="VERIFIED" className="btn-navy btn-sm">
                            Verify
                          </button>
                        </form>
                      )}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {d && (
        <Section title={`Availability (${d.availability.length} days)`}>
          {d.availability.length ? (
            <div className="flex flex-wrap gap-1.5">
              {d.availability.map((a) => (
                <span key={a.id} className="chip bg-emerald-50 text-emerald-800">
                  {dateOnly(a.date)} · {windowLabel(a)}
                  {dayRateLabel(a) && ` · ${dayRateLabel(a)}`}
                </span>
              ))}
            </div>
          ) : (
            <p className="muted">No upcoming availability.</p>
          )}
        </Section>
      )}

      {c && (
        <Section title={`Jobs posted (${c.jobs.length})`}>
          {c.jobs.length ? (
            <div className="divide-y divide-slate-100">
              {c.jobs.map((j) => (
                <RowLink
                  key={j.id}
                  href={`/admin/jobs/${j.id}`}
                  title={`${licenceLabel(j.licenceClass)} · ${j.town ?? j.postcode} · ${money(j.payAmount)}`}
                  sub={`${dateTime(j.startAt)} · ${j._count.applications} responses${j.booking ? ` · booked: ${j.booking.driver.fullName}` : ""}`}
                  right={<StatusBadge status={j.status} />}
                />
              ))}
            </div>
          ) : (
            <p className="muted">No jobs yet.</p>
          )}
        </Section>
      )}

      {d && (
        <Section title={`Applications (${d.applications.length})`}>
          {d.applications.length ? (
            <div className="divide-y divide-slate-100">
              {d.applications.map((a) => (
                <RowLink
                  key={a.id}
                  href={`/admin/jobs/${a.jobId}`}
                  title={`${a.job.company.companyName} · ${licenceLabel(a.job.licenceClass)} · ${money(a.job.payAmount)}`}
                  sub={dateTime(a.job.startAt)}
                  right={<StatusBadge status={a.status} />}
                />
              ))}
            </div>
          ) : (
            <p className="muted">No applications yet.</p>
          )}
        </Section>
      )}

      {(d?.bookings.length || c?.bookings.length) ? (
        <Section title="Bookings">
          <div className="divide-y divide-slate-100">
            {(d?.bookings ?? []).map((b) => (
              <RowLink key={b.id} href={`/bookings/${b.id}`} title={`${b.company.companyName} · ${money(b.job.payAmount)}`} sub={dateTime(b.job.startAt)} right={<StatusBadge status={b.status} />} />
            ))}
            {(c?.bookings ?? []).map((b) => (
              <RowLink key={b.id} href={`/bookings/${b.id}`} title={`${b.driver.fullName} · ${money(b.job.payAmount)}`} sub={dateTime(b.job.startAt)} right={<StatusBadge status={b.status} />} />
            ))}
          </div>
        </Section>
      ) : null}

      {(user.reviewsReceived.length > 0 || user.reviewsWritten.length > 0) && (
        <Section title="Reviews">
          <ul className="space-y-3 text-sm">
            {user.reviewsReceived.map((r) => (
              <li key={r.id}>
                <Stars value={r.rating} /> <span className="text-slate-500">from {personName(r.author)}</span>
                {r.hidden && <span className="chip ml-1 bg-slate-200 text-slate-700">Hidden</span>}
                {r.comment && <p className="text-slate-700">{r.comment}</p>}
              </li>
            ))}
            {user.reviewsWritten.map((r) => (
              <li key={r.id}>
                <Stars value={r.rating} /> <span className="text-slate-500">given to {personName(r.subject)}</span>
                {r.comment && <p className="text-slate-700">{r.comment}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
