import Link from "next/link";
import { getTx } from "@/lib/i18n";
import { markReadByLink } from "@/lib/notify";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { licenceLabel } from "@/lib/constants";
import { avatarUrl } from "@/lib/avatar";
import { dateTime, money, payUnit } from "@/lib/format";
import { ActionForm, SubmitButton } from "@/components/forms";
import { StarInput } from "@/components/StarInput";
import { Avatar, Stars, StatusBadge } from "@/components/ui";
import { cancelBooking, completeBooking, disputeNoShow, leaveReview, reportNoShow } from "./actions";
import { LATE_CANCEL_HOURS } from "@/lib/reliability";

export const metadata: Metadata = { title: "Booking" };

export default async function BookingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { tx } = await getTx();
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const user = await requireUser();
  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      job: true,
      driver: { include: { user: { select: { email: true, id: true, avatarVersion: true } } } },
      company: { include: { user: { select: { email: true, id: true, avatarVersion: true } } } },
      reviews: true,
    },
  });
  if (!booking) notFound();
  const side = booking.driver.userId === user.id ? "DRIVER" : booking.company.userId === user.id ? "COMPANY" : user.role === "ADMIN" ? "ADMIN" : null;
  if (!side) redirect(`/wrong-account?need=${user.role === "DRIVER" ? "company" : "driver"}&next=${encodeURIComponent(`/bookings/${booking.id}`)}`);
  await markReadByLink(user.id, `/bookings/${booking.id}`);

  const myReview = booking.reviews.find((r) => r.authorId === user.id);
  const otherReviewed = booking.reviews.some((r) => r.authorId !== user.id);
  const started = booking.job.startAt.getTime() <= Date.now();
  const other =
    side === "DRIVER"
      ? { label: tx("Company"), name: booking.company.companyName, phone: booking.company.phone, email: booking.company.user.email, href: `/companies/${booking.companyId}`, contact: booking.company.contactName, photo: avatarUrl(booking.company.user) }
      : { label: tx("Driver"), name: booking.driver.fullName, phone: booking.driver.phone, email: booking.driver.user.email, href: `/drivers/${booking.driverId}`, contact: null, photo: avatarUrl(booking.driver.user) };
  const active = booking.status === "CONFIRMED";
  const hoursToStart = (booking.job.startAt.getTime() - Date.now()) / 3600000;
  const lateCancel = hoursToStart < LATE_CANCEL_HOURS;
  const reviewable = booking.status === "COMPLETED" || booking.status === "NO_SHOW";

  return (
    <div className="page max-w-2xl space-y-4">
      <Link href={side === "DRIVER" ? "/driver/bookings" : "/company"} className="text-sm text-slate-500 hover:text-navy-900">
        ← {tx("Back")}
      </Link>
      {isNew && (
        <div className="card border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          ✅ {tx("Booked! Contact details are below. Please confirm the details directly with the driver.")}
        </div>
      )}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="h1">{tx("{class} job", { class: licenceLabel(booking.job.licenceClass) })}</h1>
            <p className="mt-1 text-slate-600">
              🕒 {dateTime(booking.job.startAt)} · ⏱️ {booking.job.durationHours} h
            </p>
            <p className="text-slate-600">
              📍 {booking.job.town ? `${booking.job.town}, ` : ""}
              {booking.job.postcode}
            </p>
            <div className="mt-2">
              <StatusBadge status={booking.status} tx={tx} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-brand-500">{money(booking.job.payAmount)}</p>
            <p className="text-xs text-slate-500">{tx(payUnit(booking.job.payType))}</p>
          </div>
        </div>
        {booking.job.description && <p className="mt-4 whitespace-pre-line text-sm text-slate-700">{booking.job.description}</p>}
        {booking.job.requirements && <p className="mt-2 whitespace-pre-line text-sm text-slate-700">Requirements: {booking.job.requirements}</p>}
      </div>

      {side !== "ADMIN" && (
        <div className="card p-5">
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{other.label}</p>
          <Link href={other.href} className="mt-2 flex items-center gap-3">
            <Avatar name={other.name} src={other.photo} />
            <span className="font-bold text-navy-900">{other.name}</span>
          </Link>
          {booking.status !== "CANCELLED" && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {other.phone && (
                <a href={`tel:${other.phone.replace(/\s/g, "")}`} className="btn-navy">
                  📞 Call {other.contact ?? other.name.split(" ")[0]}
                </a>
              )}
              <a href={`mailto:${other.email}`} className="btn-outline">
                ✉️ {tx("Email")}
              </a>
            </div>
          )}
        </div>
      )}

      {active && side !== "ADMIN" && (
        <div className="card space-y-3 p-5">
          {side === "DRIVER" && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {tx("Reminder: make sure you've had your legal rest and can cover this shift within your driving hours, including any work for other operators.")}
            </p>
          )}
          {started ? (
            <form action={completeBooking}>
              <input type="hidden" name="bookingId" value={booking.id} />
              <button className="btn-primary w-full">✓ {tx("Mark job as completed")}</button>
            </form>
          ) : (
            <p className="text-sm text-slate-500">{tx("You can mark the job as completed once it has started.")}</p>
          )}
          {started && side === "COMPANY" && (
            <details className="rounded-xl border border-slate-200 p-3 text-sm">
              <summary className="cursor-pointer font-semibold text-brand-700">Driver didn&apos;t turn up?</summary>
              <p className="mt-2 text-slate-600">
                {tx("Reporting a no-show goes on the driver's public record and affects their reliability score. Please only report it if the driver didn't arrive and didn't cancel. The driver can dispute it.")}
              </p>
              <form action={reportNoShow} className="mt-3">
                <input type="hidden" name="bookingId" value={booking.id} />
                <button className="btn w-full border border-brand-500 text-brand-600 hover:bg-brand-50">{tx("Report no-show")}</button>
              </form>
            </details>
          )}
          {!started && (
            <details className="text-sm">
              <summary className="cursor-pointer text-center text-slate-500">{tx("Cancel booking")}</summary>
              <div className="mt-2 rounded-xl border border-slate-200 p-3">
                {lateCancel ? (
                  <p className="text-amber-800">
                    ⚠ {tx("The job starts in less than {h} hours. Cancelling now counts as a late cancellation on your public record.", { h: LATE_CANCEL_HOURS })}
                  </p>
                ) : (
                  <p className="text-slate-600">{side === "DRIVER" ? tx("Please cancel as early as possible so the company can find someone else.") : tx("Please cancel as early as possible so the driver can take other work.")}</p>
                )}
                <form action={cancelBooking} className="mt-3">
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <button className="btn-outline btn-sm w-full">{tx("Yes, cancel this booking")}</button>
                </form>
              </div>
            </details>
          )}
        </div>
      )}

      {booking.status === "NO_SHOW" && side !== "ADMIN" && (
        <div className="card border-brand-100 bg-brand-50 p-5 text-sm">
          <p className="font-semibold text-brand-700">
            {side === "COMPANY" ? tx("You reported that the driver didn't turn up.") : tx("The company reported that you didn't turn up.")}
          </p>
          {booking.disputeStatus === "OPEN" && <p className="mt-1 text-slate-700">{tx("The driver has disputed this. Our team is reviewing it.")}</p>}
          {booking.disputeStatus === "UPHELD" && <p className="mt-1 text-slate-700">{tx("We reviewed the dispute and the no-show stands.")}</p>}
          {side === "DRIVER" && !booking.disputeStatus && (
            <ActionForm action={disputeNoShow} className="mt-3 space-y-2">
              <input type="hidden" name="bookingId" value={booking.id} />
              <label className="block">
                <span className="label">{tx("Not true? Tell us what happened")}</span>
                <textarea name="text" className="input min-h-20" maxLength={1000} required placeholder={tx("e.g. I arrived at 05:50 and spoke to the night shift manager…")} />
              </label>
              <SubmitButton className="btn-navy btn-sm" pendingText={tx("Sending…")}>
                {tx("Dispute no-show")}
              </SubmitButton>
            </ActionForm>
          )}
        </div>
      )}

      {reviewable && side !== "ADMIN" && (
        <div className="card p-5">
          {myReview ? (
            <div>
              <h2 className="h2">{tx("Your review")}</h2>
              <div className="mt-2">
                <Stars value={myReview.rating} tx={tx} />
              </div>
              {myReview.comment && <p className="mt-1 text-sm text-slate-700">{myReview.comment}</p>}
              <p className="mt-3 text-xs text-slate-500">
                {otherReviewed ? tx("Both reviews are now public.") : tx("Your review will be published when the other side reviews too, or after 14 days.")}
              </p>
            </div>
          ) : (
            <ActionForm action={leaveReview} className="space-y-3">
              <input type="hidden" name="bookingId" value={booking.id} />
              <h2 className="h2">How was it working with {other.name}?</h2>
              <StarInput />
              <textarea
                name="comment"
                className="input min-h-24"
                maxLength={1000}
                placeholder={side === "DRIVER" ? tx("Paid on time? Good truck? Easy to work with?") : tx("On time? Professional? Would you book again?")}
              />
              <p className="text-xs text-slate-500">Reviews are blind: neither side sees the other&apos;s review until both have posted (or 14 days pass).</p>
              <SubmitButton pendingText={tx("Posting…")}>{tx("Post review")}</SubmitButton>
            </ActionForm>
          )}
        </div>
      )}
    </div>
  );
}
