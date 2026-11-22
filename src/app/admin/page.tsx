import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { dateOnly } from "@/lib/format";
import { Stars, Stat, StatusBadge } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { adminResetPassword, resolveNoShowDispute, reviewDocument, setCompanyStatus, toggleReviewHidden, toggleSuspend } from "./actions";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireUser("ADMIN");
  const [drivers, companies, openJobs, bookings, pendingDocs, pendingCompanies, users, reviews] = await Promise.all([
    db.driverProfile.count(),
    db.companyProfile.count(),
    db.job.count({ where: { status: "OPEN" } }),
    db.booking.count({ where: { status: { not: "CANCELLED" } } }),
    db.driverDocument.findMany({ where: { status: "PENDING" }, include: { driver: true }, orderBy: { updatedAt: "asc" }, take: 50 }),
    db.companyProfile.findMany({ where: { verificationStatus: "PENDING" }, orderBy: { createdAt: "asc" }, take: 50 }),
    db.user.findMany({ include: { driver: true, company: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.review.findMany({ include: { author: { select: { email: true } }, subject: { select: { email: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  const disputes = await db.booking.findMany({
    where: { status: "NO_SHOW", disputeStatus: "OPEN" },
    include: { job: true, driver: true, company: true },
    orderBy: { noShowAt: "asc" },
  });
  const noShowCounts = await db.reliabilityEvent.groupBy({
    by: ["userId"],
    where: { type: "NO_SHOW", overturned: false },
    _count: true,
    having: { userId: { _count: { gte: 2 } } },
  });
  const flagged = noShowCounts.length
    ? await db.user.findMany({ where: { id: { in: noShowCounts.map((n) => n.userId) } }, include: { driver: true } })
    : [];
  const label = (t: string) => DOCUMENT_TYPES.find((d) => d.type === t)?.label ?? t;

  return (
    <div className="page space-y-6">
      <h1 className="h1">Admin</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Drivers" value={drivers} href="/admin/users?role=DRIVER" />
        <Stat label="Companies" value={companies} href="/admin/users?role=COMPANY" />
        <Stat label="Open jobs" value={openJobs} href="/admin/jobs?status=OPEN" />
        <Stat label="Bookings" value={bookings} href="/admin/bookings" />
      </div>

      {(disputes.length > 0 || flagged.length > 0) && (
        <section className="space-y-2">
          <h2 className="h2">⚠ Reliability ({disputes.length + flagged.length})</h2>
          {disputes.map((b) => (
            <form key={b.id} action={resolveNoShowDispute} className="card space-y-2 p-4 text-sm">
              <input type="hidden" name="bookingId" value={b.id} />
              <p className="font-semibold text-navy-900">
                No-show dispute: {b.driver.fullName} vs {b.company.companyName}
              </p>
              <p className="text-slate-600">
                Job {dateOnly(b.job.startAt)} · {b.job.town ?? b.job.postcode}
              </p>
              <p className="rounded-lg bg-slate-50 p-2 text-slate-700">“{b.disputeText}”</p>
              <div className="flex gap-2">
                <button name="decision" value="OVERTURN" className="btn-navy btn-sm">
                  Driver is right — remove no-show
                </button>
                <button name="decision" value="UPHOLD" className="btn-outline btn-sm">
                  Keep no-show
                </button>
              </div>
            </form>
          ))}
          {flagged.map((u) => (
            <div key={u.id} className="card flex items-center justify-between p-4 text-sm">
              <span>
                <a href={u.driver ? `/drivers/${u.driver.id}` : "#"} className="font-semibold text-navy-900 underline">
                  {u.driver?.fullName ?? u.email}
                </a>{" "}
                has {noShowCounts.find((n) => n.userId === u.id)?._count} no-shows
              </span>
              {u.suspended ? <span className="chip bg-slate-100 text-slate-600">Suspended</span> : <span className="text-xs text-slate-500">Consider suspending below</span>}
            </div>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="h2">Documents to check ({pendingDocs.length})</h2>
        <p className="muted">
          Licence: use the check code at{" "}
          <a className="underline" href="https://www.gov.uk/check-driving-information" target="_blank" rel="noreferrer">
            gov.uk/check-driving-information
          </a>
          . Right to work:{" "}
          <a className="underline" href="https://www.gov.uk/view-right-to-work" target="_blank" rel="noreferrer">
            gov.uk/view-right-to-work
          </a>
          .
        </p>
        {pendingDocs.map((d) => (
          <form key={d.id} action={reviewDocument} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <input type="hidden" name="docId" value={d.id} />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold text-navy-900">
                <a href={`/admin/users/${d.driver.userId}`} className="underline">{d.driver.fullName}</a> — {label(d.type)}
              </p>
              <p className="text-slate-600">
                Ref: <span className="font-mono">{d.reference}</span>
                {d.checkCode && (
                  <>
                    {" "}
                    · Check code: <span className="font-mono">{d.checkCode}</span>
                  </>
                )}
                {d.expiresAt && <> · Expires {dateOnly(d.expiresAt)}</>}
              </p>
            </div>
            <input name="note" className="input sm:w-56" placeholder="Note (if rejecting)" />
            <div className="flex gap-2">
              <button name="status" value="VERIFIED" className="btn-navy btn-sm">
                Verify
              </button>
              <button name="status" value="REJECTED" className="btn-outline btn-sm">
                Reject
              </button>
            </div>
          </form>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="h2">Companies to verify ({pendingCompanies.length})</h2>
        {pendingCompanies.map((c) => (
          <form key={c.id} action={setCompanyStatus} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <input type="hidden" name="companyId" value={c.id} />
            <div className="flex-1 text-sm">
              <a href={`/admin/users/${c.userId}`} className="font-semibold text-navy-900 underline">{c.companyName}</a>
              <p className="text-slate-600">
                Companies House: {c.companiesHouseNumber ? (
                  <a className="underline" target="_blank" rel="noreferrer" href={`https://find-and-update.company-information.service.gov.uk/company/${encodeURIComponent(c.companiesHouseNumber)}`}>
                    {c.companiesHouseNumber}
                  </a>
                ) : "—"}{" "}
                · O-licence: {c.operatorLicence ?? "—"} · {c.town ?? c.postcode}
              </p>
            </div>
            <div className="flex gap-2">
              <button name="status" value="VERIFIED" className="btn-navy btn-sm">
                Verify
              </button>
              <button name="status" value="REJECTED" className="btn-outline btn-sm">
                Reject
              </button>
            </div>
          </form>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="h2">Latest reviews</h2>
        <div className="card divide-y divide-slate-100">
          {reviews.map((r) => (
            <form key={r.id} action={toggleReviewHidden} className="flex items-center justify-between gap-3 p-3 text-sm">
              <input type="hidden" name="reviewId" value={r.id} />
              <div className="min-w-0">
                <Stars value={r.rating} /> <span className="text-slate-500">{r.author.email} → {r.subject.email}</span>
                {r.comment && <p className="truncate text-slate-700">{r.comment}</p>}
              </div>
              <button className="btn-outline btn-sm shrink-0">{r.hidden ? "Unhide" : "Hide"}</button>
            </form>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="h2">Newest users</h2>
        <div className="card divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="p-3">
            <form action={toggleSuspend} className="flex items-center justify-between gap-3 text-sm">
              <input type="hidden" name="userId" value={u.id} />
              <div className="min-w-0">
                <a href={`/admin/users/${u.id}`} className="font-medium text-navy-900 underline-offset-2 hover:underline">
                  {u.driver?.fullName ?? u.company?.companyName ?? "Admin"} ›
                </a>
                <p className="truncate text-slate-500">
                  {u.role} · {u.email} · joined {dateOnly(u.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {u.driver && <StatusBadge status={u.driver.verificationStatus} />}
                {u.role !== "ADMIN" && <button className="btn-outline btn-sm">{u.suspended ? "Unsuspend" : "Suspend"}</button>}
              </div>
            </form>
            {u.role !== "ADMIN" && (
              <ActionForm action={adminResetPassword} className="mt-2">
                <input type="hidden" name="userId" value={u.id} />
                <SubmitButton className="text-xs font-medium text-slate-500 underline" pendingText="Resetting…">
                  Reset password
                </SubmitButton>
              </ActionForm>
            )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
