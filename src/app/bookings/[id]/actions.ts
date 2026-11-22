"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
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
  return { user, booking, side };
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
  const { booking, side } = await loadForUser(String(fd.get("bookingId")));
  if (booking.status !== "CONFIRMED") return;
  await db.$transaction([
    db.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } }),
    // Re-open the job so the company can find someone else (if it hasn't started yet).
    db.job.update({
      where: { id: booking.jobId },
      data: { status: booking.job.startAt.getTime() > Date.now() ? "OPEN" : "CANCELLED" },
    }),
    db.application.updateMany({
      where: { jobId: booking.jobId, driverId: booking.driverId },
      data: { status: side === "DRIVER" ? "WITHDRAWN" : "DECLINED" },
    }),
  ]);
  revalidatePath(`/bookings/${booking.id}`);
}

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Choose 1–5 stars").max(5),
  comment: z.string().trim().max(1000).optional(),
});

export async function leaveReview(_: ActionState, fd: FormData): Promise<ActionState> {
  const { user, booking, side } = await loadForUser(String(fd.get("bookingId")));
  if (booking.status !== "COMPLETED") return { error: "You can review once the job is marked as completed." };
  const parsed = reviewSchema.safeParse({ rating: fd.get("rating"), comment: fd.get("comment") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please choose a star rating." };
  const subjectId = side === "DRIVER" ? booking.company.userId : booking.driver.userId;
  const exists = await db.review.findUnique({ where: { bookingId_authorId: { bookingId: booking.id, authorId: user.id } } });
  if (exists) return { error: "You've already reviewed this job." };
  await db.review.create({
    data: { bookingId: booking.id, authorId: user.id, subjectId, rating: parsed.data.rating, comment: parsed.data.comment ?? null },
  });
  revalidatePath(`/bookings/${booking.id}`);
  return { ok: "Thanks! Your review will be published when both sides have reviewed, or after 14 days." };
}
