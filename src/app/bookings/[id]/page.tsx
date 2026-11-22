import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { licenceLabel } from "@/lib/constants";
import { dateTime, money } from "@/lib/format";
import { ActionForm, SubmitButton } from "@/components/forms";
import { StarInput } from "@/components/StarInput";
import { Avatar, Stars, StatusBadge } from "@/components/ui";
import { cancelBooking, completeBooking, leaveReview } from "./actions";

export const metadata: Metadata = { title: "Booking" };

export default async function BookingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const user = await requireUser();
  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      job: true,
      driver: { include: { user: { select: { email: true } } } },
      company: { include: { user: { select: { email: true } } } },
      reviews: true,
    },
  });
  if (!booking) notFound();
  const side = booking.driver.userId === user.id ? "DRIVER" : booking.company.userId === user.id ? "COMPANY" : user.role === "ADMIN" ? "ADMIN" : null;
  if (!side) notFound();

  const myReview = booking.reviews.find((r) => r.authorId === user.id);
  const otherReviewed = booking.reviews.some((r) => r.authorId !== user.id);
  const started = booking.job.startAt.getTime() <= Date.now();
  const other =
    side === "DRIVER"
      ? { label: "Company", name: booking.company.companyName, phone: booking.company.phone, email: booking.company.user.email, href: `/companies/${booking.companyId}`, contact: booking.company.contactName }
      : { label: "Driver", name: booking.driver.fullName, phone: booking.driver.phone, email: booking.driver.user.email, href: `/drivers/${booking.driverId}`, contact: null };
  const active = booking.status === "CONFIRMED";

  return (
    <div className="page max-w-2xl space-y-4">
      <Link href={side === "DRIVER" ? "/driver/bookings" : "/company"} className="text-sm text-slate-500 hover:text-navy-900">
        ← Back
      </Link>
      {isNew && (
        <div className="card border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          ✅ Booked! Contact details are below. Please confirm the details directly with the driver.
        </div>
      )}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="h1">{licenceLabel(booking.job.licenceClass)} job</h1>
            <p className="mt-1 text-slate-600">
              🕒 {dateTime(booking.job.startAt)} · ⏱️ {booking.job.durationHours} h
            </p>
            <p className="text-slate-600">
              📍 {booking.job.town ? `${booking.job.town}, ` : ""}
              {booking.job.postcode}
            </p>
            <div className="mt-2">
              <StatusBadge status={booking.status} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-brand-500">{money(booking.job.payAmount)}</p>
            <p className="text-xs text-slate-500">{booking.job.payType === "HOURLY" ? "per hour" : "per shift"}</p>
          </div>
        </div>
        {booking.job.description && <p className="mt-4 whitespace-pre-line text-sm text-slate-700">{booking.job.description}</p>}
        {booking.job.requirements && <p className="mt-2 whitespace-pre-line text-sm text-slate-700">Requirements: {booking.job.requirements}</p>}
      </div>

      {side !== "ADMIN" && (
        <div className="card p-5">
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{other.label}</p>
          <Link href={other.href} className="mt-2 flex items-center gap-3">
            <Avatar name={other.name} />
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
                ✉️ Email
              </a>
            </div>
          )}
        </div>
      )}

      {active && side !== "ADMIN" && (
        <div className="card space-y-3 p-5">
          {side === "DRIVER" && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Reminder: make sure you&apos;ve had your legal rest and can cover this shift within your driving hours, including any
              work for other operators.
            </p>
          )}
          {started ? (
            <form action={completeBooking}>
              <input type="hidden" name="bookingId" value={booking.id} />
              <button className="btn-primary w-full">✓ Mark job as completed</button>
            </form>
          ) : (
            <p className="text-sm text-slate-500">You can mark the job as completed once it has started.</p>
          )}
          <form action={cancelBooking}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <button className="btn-ghost btn-sm w-full text-slate-500">Cancel booking</button>
          </form>
        </div>
      )}

      {booking.status === "COMPLETED" && side !== "ADMIN" && (
        <div className="card p-5">
          {myReview ? (
            <div>
              <h2 className="h2">Your review</h2>
              <div className="mt-2">
                <Stars value={myReview.rating} />
              </div>
              {myReview.comment && <p className="mt-1 text-sm text-slate-700">{myReview.comment}</p>}
              <p className="mt-3 text-xs text-slate-500">
                {otherReviewed ? "Both reviews are now public." : "Your review will be published when the other side reviews too, or after 14 days."}
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
                placeholder={side === "DRIVER" ? "Paid on time? Good truck? Easy to work with?" : "On time? Professional? Would you book again?"}
              />
              <p className="text-xs text-slate-500">Reviews are blind: neither side sees the other&apos;s review until both have posted (or 14 days pass).</p>
              <SubmitButton pendingText="Posting…">Post review</SubmitButton>
            </ActionForm>
          )}
        </div>
      )}
    </div>
  );
}
