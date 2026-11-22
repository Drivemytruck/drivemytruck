"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { contactDetailsError } from "@/lib/contact-guard";
import { LATE_CANCEL_HOURS } from "@/lib/reliability";
import type { ActionState } from "@/components/forms";

async function loadForUser(bookingId: string) {
  const user = await requireUser();
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { job: true, driver: { select: { userId: true } }, company: { select: { userId: true } } },
  });
  if (!booking) throw new Error("Not found");
  const side = booking.driver.userId === user.id ? "DRIVER" : booking.company.userId === user.id ? "COMPANY" : null;
  if (!side) throw new Error("Not found");
  return { user, booking, side } as const;
}

export async function completeBooking(fd: FormData) {
  const { booking } = await loadForUser(String(fd.get("bookingId")));
  if (booking.status !== "CONFIRMED") return;
  if (booking.job.startAt.getTime() > Date.now()) return; // can't complete before the job starts
  await db.$transaction([
    db.booking.update({ where: { id: booking.id }, data: { status: "COMPLETED", completedAt: new Date() } }),
    db.job.update({ where: { id: booking.jobId }, data: { status: "COMPLETED" } }),
  ]);
  revalidatePath(`/bookings/${booking.id}`);
}

export async function cancelBooking(fd: FormData) {
  const { user, booking, side } = await loadForUser(String(fd.get("bookingId")));
  if (booking.status !== "CONFIRMED") return;
  const hoursToStart = (booking.job.startAt.getTime() - Date.now()) / 3600000;
  await db.$transaction([
    db.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } }),
    // Re-open the job so the company can find someone else (if it hasn't started yet).
    db.job.update({ where: { id: booking.jobId }, data: { status: hoursToStart > 0 ? "OPEN" : "CANCELLED" } }),
    db.application.updateMany({
      where: { jobId: booking.jobId, driverId: booking.driverId },
      data: { status: side === "DRIVER" ? "WITHDRAWN" : "DECLINED" },
    }),
    // Counts against whoever cancelled; late cancellations hurt their reliability score.
    db.reliabilityEvent.create({
      data: {
        type: hoursToStart < LATE_CANCEL_HOURS ? "LATE_CANCEL" : "CANCEL",
        userId: user.id,
        role: side,
        jobId: booking.jobId,
        bookingId: booking.id,
      },
    }),
  ]);
  revalidatePath(`/bookings/${booking.id}`);
}

/** Company reports that the booked driver didn't turn up. */
export async function reportNoShow(fd: FormData) {
  const { booking, side } = await loadForUser(String(fd.get("bookingId")));
  if (side !== "COMPANY" || booking.status !== "CONFIRMED") return;
  if (booking.job.startAt.getTime() > Date.now()) return; // only once the start time has passed
  const now = new Date();
  await db.$transaction([
    // completedAt starts the 14-day review window, so the company can still leave a review.
    db.booking.update({ where: { id: booking.id }, data: { status: "NO_SHOW", noShowAt: now, completedAt: now } }),
    db.job.update({ where: { id: booking.jobId }, data: { status: "CANCELLED" } }),
    db.reliabilityEvent.create({
      data: { type: "NO_SHOW", userId: booking.driver.userId, role: "DRIVER", jobId: booking.jobId, bookingId: booking.id },
    }),
  ]);
  revalidatePath(`/bookings/${booking.id}`);
}

/** Driver disputes a no-show report; an admin decides. */
export async function disputeNoShow(_: ActionState, fd: FormData): Promise<ActionState> {
  const { booking, side } = await loadForUser(String(fd.get("bookingId")));
  if (side !== "DRIVER" || booking.status !== "NO_SHOW" || booking.disputeStatus) return { error: "This can't be disputed." };
  const text = String(fd.get("text") ?? "").trim().slice(0, 1000);
  if (text.length < 10) return { error: "Please explain briefly what happened." };
  await db.booking.update({ where: { id: booking.id }, data: { disputeText: text, disputeStatus: "OPEN" } });
  revalidatePath(`/bookings/${booking.id}`);
  return { ok: "Thanks — our team will review it and update your record." };
}

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Choose 1–5 stars").max(5),
  comment: z.string().trim().max(1000).optional(),
});

export async function leaveReview(_: ActionState, fd: FormData): Promise<ActionState> {
  const { user, booking, side } = await loadForUser(String(fd.get("bookingId")));
  if (booking.status !== "COMPLETED" && booking.status !== "NO_SHOW") {
    return { error: "You can review once the job is marked as completed." };
  }
  const parsed = reviewSchema.safeParse({ rating: fd.get("rating"), comment: fd.get("comment") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please choose a star rating." };
  const contactErr = contactDetailsError(parsed.data.comment);
  if (contactErr) return { error: contactErr };
  const subjectId = side === "DRIVER" ? booking.company.userId : booking.driver.userId;
  const exists = await db.review.findUnique({ where: { bookingId_authorId: { bookingId: booking.id, authorId: user.id } } });
  if (exists) return { error: "You've already reviewed this job." };
  await db.review.create({
    data: { bookingId: booking.id, authorId: user.id, subjectId, rating: parsed.data.rating, comment: parsed.data.comment ?? null },
  });
  revalidatePath(`/bookings/${booking.id}`);
  return { ok: "Thanks! Your review will be published when both sides have reviewed, or after 14 days." };
}
