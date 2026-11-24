"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { audit } from "@/lib/audit";
import { NO_SHOW_LIMIT } from "@/lib/reliability";

const STATUSES = ["PENDING", "VERIFIED", "REJECTED"] as const;
type Status = (typeof STATUSES)[number];
const asStatus = (v: FormDataEntryValue | null): Status => (STATUSES.includes(v as Status) ? (v as Status) : "PENDING");

export async function reviewDocument(fd: FormData) {
  const admin = await requireUser("ADMIN");
  const status = asStatus(fd.get("status"));
  const doc = await db.driverDocument.update({
    where: { id: String(fd.get("docId")) },
    // The DVLA check code is single-use; once the licence is verified we don't need to keep it.
    data: { status, adminNote: String(fd.get("note") ?? "").trim() || null, ...(status === "VERIFIED" ? { checkCode: null } : {}) },
  });
  await audit(admin.id, `DOCUMENT_${status}`, doc.driverId, doc.type);
  // Driver is verified once every required document is verified.
  const docs = await db.driverDocument.findMany({ where: { driverId: doc.driverId } });
  const required = DOCUMENT_TYPES.filter((d) => d.required).map((d) => d.type as string);
  const allOk = required.every((t) => docs.find((d) => d.type === t)?.status === "VERIFIED");
  const anyRejected = docs.some((d) => d.status === "REJECTED");
  await db.driverProfile.update({
    where: { id: doc.driverId },
    data: { verificationStatus: allOk ? "VERIFIED" : anyRejected ? "REJECTED" : "PENDING" },
  });
  revalidatePath("/admin", "layout");
}

export async function setCompanyStatus(fd: FormData) {
  const admin = await requireUser("ADMIN");
  const status = asStatus(fd.get("status"));
  const c = await db.companyProfile.update({ where: { id: String(fd.get("companyId")) }, data: { verificationStatus: status } });
  await audit(admin.id, `COMPANY_${status}`, c.userId);
  revalidatePath("/admin", "layout");
}

export async function toggleSuspend(fd: FormData) {
  const admin = await requireUser("ADMIN");
  const id = String(fd.get("userId"));
  if (id === admin.id) return;
  const u = await db.user.findUnique({ where: { id } });
  if (u) {
    await db.user.update({ where: { id }, data: { suspended: !u.suspended, sessionVersion: { increment: 1 } } });
    await audit(admin.id, u.suspended ? "UNSUSPEND_USER" : "SUSPEND_USER", id);
  }
  revalidatePath("/admin", "layout");
}

export async function toggleReviewHidden(fd: FormData) {
  const admin = await requireUser("ADMIN");
  const r = await db.review.findUnique({ where: { id: String(fd.get("reviewId")) } });
  if (r) {
    await db.review.update({ where: { id: r.id }, data: { hidden: !r.hidden } });
    await audit(admin.id, r.hidden ? "UNHIDE_REVIEW" : "HIDE_REVIEW", r.subjectId, r.id);
  }
  revalidatePath("/admin", "layout");
}

/** Emergency reset: sets a random temporary password and shows it once to the admin. */
export async function adminResetPassword(_: unknown, fd: FormData): Promise<{ ok?: string; error?: string }> {
  const admin = await requireUser("ADMIN");
  const id = String(fd.get("userId"));
  if (id === admin.id) return { error: "Use “Forgot password?” on the login page for your own account." };
  const user = await db.user.findUnique({ where: { id } });
  if (!user) return { error: "User not found." };
  const { randomBytes } = await import("node:crypto");
  const temp = randomBytes(9).toString("base64url");
  const bcrypt = (await import("bcryptjs")).default;
  await db.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(temp, 12), sessionVersion: { increment: 1 } } });
  await audit(admin.id, "RESET_PASSWORD", id);
  return { ok: `Temporary password for ${user.email}: ${temp} — send it to them privately and ask them to change it.` };
}

/** Decide a driver's dispute of a no-show report. */
export async function resolveNoShowDispute(fd: FormData) {
  const admin = await requireUser("ADMIN");
  const booking = await db.booking.findUnique({ where: { id: String(fd.get("bookingId")) } });
  if (!booking || booking.status !== "NO_SHOW" || booking.disputeStatus !== "OPEN") return;
  if (fd.get("decision") === "OVERTURN") {
    await db.$transaction([
      db.booking.update({ where: { id: booking.id }, data: { status: "COMPLETED", disputeStatus: "OVERTURNED" } }),
      db.job.update({ where: { id: booking.jobId }, data: { status: "COMPLETED" } }),
      db.reliabilityEvent.updateMany({ where: { bookingId: booking.id, type: "NO_SHOW" }, data: { overturned: true } }),
    ]);
    // If the driver was auto-suspended by this no-show, lift it when it's overturned (admins can still suspend manually).
    const driver = await db.driverProfile.findUnique({ where: { id: booking.driverId }, select: { userId: true } });
    if (driver) {
      const remaining = await db.reliabilityEvent.count({ where: { userId: driver.userId, type: "NO_SHOW", overturned: false } });
      if (remaining < NO_SHOW_LIMIT) await db.user.update({ where: { id: driver.userId }, data: { suspended: false } });
    }
  } else {
    await db.booking.update({ where: { id: booking.id }, data: { disputeStatus: "UPHELD" } });
  }
  await audit(admin.id, fd.get("decision") === "OVERTURN" ? "NO_SHOW_OVERTURNED" : "NO_SHOW_UPHELD", booking.driverId, booking.id);
  revalidatePath("/admin", "layout");
}
