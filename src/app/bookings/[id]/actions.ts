"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { contactDetailsError } from "@/lib/contact-guard";
import { LATE_CANCEL_HOURS, enforceNoShowPolicy } from "@/lib/reliability";
import { addNotification, line, notifyUser } from "@/lib/notify";
import { encrypt } from "@/lib/crypto";
import { hasInstructions } from "@/lib/instructions";
import { makeTx } from "@/lib/tx";
import { after } from "next/server";
import { getTx } from "@/lib/i18n";

const T = async (s: string, v?: Record<string, string | number>) => (await getTx()).tx(s, v);
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
  if ((booking.agreedStartAt ?? booking.job.startAt).getTime() > Date.now()) return; // can't complete before the job starts
  await db.$transaction([
    db.booking.update({ where: { id: booking.id }, data: { status: "COMPLETED", completedAt: new Date() } }),
    db.job.update({ where: { id: booking.jobId }, data: { status: "COMPLETED" } }),
  ]);
  revalidatePath(`/bookings/${booking.id}`);
}

export async function cancelBooking(fd: FormData) {
  const { user, booking, side } = await loadForUser(String(fd.get("bookingId")));
  if (booking.status !== "CONFIRMED") return;
  const hoursToStart = ((booking.agreedStartAt ?? booking.job.startAt).getTime() - Date.now()) / 3600000;
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
  const otherUserId = side === "DRIVER" ? booking.company.userId : booking.driver.userId;
  after(() =>
    notifyUser(otherUserId, (tx, lang) => ({
      subject: tx("Booking cancelled: {job}", { job: line(booking.job, lang) }),
      paragraphs: [
        side === "DRIVER" ? tx("The driver has cancelled this booking:") : tx("The company has cancelled this booking:"),
        line(booking.job, lang),
        side === "DRIVER" ? tx("The job is open again so other drivers can apply.") : tx("Sorry about that — have a look for other jobs near you."),
      ],
      cta: side === "DRIVER" ? tx("Find another driver") : tx("See jobs near me"),
      path: side === "DRIVER" ? `/company/jobs/${booking.jobId}` : "/driver",
      icon: "❌",
    })),
  );
}

/** Company reports that the booked driver didn't turn up. */
export async function reportNoShow(fd: FormData) {
  const { booking, side } = await loadForUser(String(fd.get("bookingId")));
  if (side !== "COMPANY" || booking.status !== "CONFIRMED") return;
  if ((booking.agreedStartAt ?? booking.job.startAt).getTime() > Date.now()) return; // only once the start time has passed
  const now = new Date();
  await db.$transaction([
    // completedAt starts the 14-day review window, so the company can still leave a review.
    db.booking.update({ where: { id: booking.id }, data: { status: "NO_SHOW", noShowAt: now, completedAt: now } }),
    db.job.update({ where: { id: booking.jobId }, data: { status: "CANCELLED" } }),
    db.reliabilityEvent.create({
      data: { type: "NO_SHOW", userId: booking.driver.userId, role: "DRIVER", jobId: booking.jobId, bookingId: booking.id },
    }),
  ]);
  await enforceNoShowPolicy(booking.driver.userId);
  after(() =>
    notifyUser(booking.driver.userId, (tx, lang) => ({
      subject: tx("A no-show was reported"),
      paragraphs: [tx("The company reported that you didn't turn up for:"), line(booking.job, lang), tx("If that's not right, you can dispute it from the booking page.")],
      cta: tx("View booking"),
      path: `/bookings/${booking.id}`,
      icon: "⚠️",
    })),
  );
  revalidatePath(`/bookings/${booking.id}`);
}

/** Driver disputes a no-show report; an admin decides. */
export async function disputeNoShow(_: ActionState, fd: FormData): Promise<ActionState> {
  const { booking, side } = await loadForUser(String(fd.get("bookingId")));
  if (side !== "DRIVER" || booking.status !== "NO_SHOW" || booking.disputeStatus) return { error: await T("This can't be disputed.") };
  const text = String(fd.get("text") ?? "").trim().slice(0, 1000);
  if (text.length < 10) return { error: await T("Please explain briefly what happened.") };
  await db.booking.update({ where: { id: booking.id }, data: { disputeText: text, disputeStatus: "OPEN" } });
  revalidatePath(`/bookings/${booking.id}`);
  return { ok: await T("Thanks — our team will review it and update your record.") };
}

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Choose 1–5 stars").max(5),
  comment: z.string().trim().max(1000).optional(),
});

export async function leaveReview(_: ActionState, fd: FormData): Promise<ActionState> {
  const { user, booking, side } = await loadForUser(String(fd.get("bookingId")));
  if (booking.status !== "COMPLETED" && booking.status !== "NO_SHOW") {
    return { error: await T("You can review once the job is marked as completed.") };
  }
  const parsed = reviewSchema.safeParse({ rating: fd.get("rating"), comment: fd.get("comment") || undefined });
  if (!parsed.success) return { error: await T(parsed.error.issues[0]?.message ?? "Please choose a star rating.") };
  const contactErr = contactDetailsError(parsed.data.comment);
  if (contactErr) return { error: await T(contactErr) };
  const subjectId = side === "DRIVER" ? booking.company.userId : booking.driver.userId;
  const exists = await db.review.findUnique({ where: { bookingId_authorId: { bookingId: booking.id, authorId: user.id } } });
  if (exists) return { error: await T("You've already reviewed this job.") };
  await db.review.create({
    data: { bookingId: booking.id, authorId: user.id, subjectId, rating: parsed.data.rating, comment: parsed.data.comment ?? null },
  });
  revalidatePath(`/bookings/${booking.id}`);
  return { ok: await T("Thanks! Your review will be published when both sides have reviewed, or after 14 days.") };
}

/** Company sends (or updates) the shift instructions for this booking. Codes never go in the email. */
export async function sendInstructions(_: ActionState, fd: FormData): Promise<ActionState> {
  const { booking, side } = await loadForUser(String(fd.get("bookingId")));
  if (side !== "COMPANY" || booking.status !== "CONFIRMED") return { error: await T("This booking is no longer active.") };
  const extra = String(fd.get("instrExtra") ?? "").trim();
  if (extra.length > 1500) return { error: await T("Each box can be up to 1500 characters.") };
  const company = await db.companyProfile.findUnique({ where: { id: booking.companyId } });
  if (!extra && !(company && hasInstructions(company))) return { error: await T("Add your standard instructions in your company profile, or write something for this shift.") };
  const resend = !!booking.instrSentAt;
  await db.booking.update({ where: { id: booking.id }, data: { instrExtra: encrypt(extra || null), instrSentAt: new Date(), instrReadAt: null } });
  const driver = await db.driverProfile.findUnique({ where: { id: booking.driverId }, select: { userId: true } });
  if (driver && company)
    after(() =>
      notifyUser(driver.userId, (tx, lang) => ({
        subject: tx(resend ? "{company} updated your shift instructions" : "{company} sent instructions for your shift", { company: company.companyName }),
        paragraphs: [
          tx("Instructions for this job — how to get in, where the keys are and what to do — are waiting for you in the app:"),
          line({ ...booking.job, startAt: booking.agreedStartAt ?? booking.job.startAt }, lang),
          tx("For security, codes are never sent by email. Please read them and tap “I've read the instructions”."),
        ],
        cta: tx("Open instructions"),
        path: `/bookings/${booking.id}`,
        icon: "📋",
      })),
    );
  revalidatePath(`/bookings/${booking.id}`);
  return { ok: await T(resend ? "Instructions updated — the driver has been notified." : "Instructions sent — the driver has been notified.") };
}

/** Driver confirms they've read the instructions; the company sees a tick (in-app only, no email). */
export async function confirmInstructionsRead(fd: FormData) {
  const { booking, side } = await loadForUser(String(fd.get("bookingId")));
  if (side !== "DRIVER" || !booking.instrSentAt || booking.instrReadAt) return;
  await db.booking.update({ where: { id: booking.id }, data: { instrReadAt: new Date() } });
  const [company, driver] = await Promise.all([
    db.companyProfile.findUnique({ where: { id: booking.companyId }, select: { userId: true, user: { select: { locale: true } } } }),
    db.driverProfile.findUnique({ where: { id: booking.driverId }, select: { fullName: true } }),
  ]);
  if (company && driver) {
    const tx = makeTx(company.user.locale === "pl" ? "pl" : "en");
    await addNotification(company.userId, {
      icon: "✅",
      title: tx("{name} has read the shift instructions", { name: driver.fullName }),
      link: `/bookings/${booking.id}`,
    });
  }
  revalidatePath(`/bookings/${booking.id}`);
}
