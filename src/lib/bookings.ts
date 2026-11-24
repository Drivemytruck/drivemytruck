import "server-only";
import { db } from "./db";
import type { Terms } from "./offers";

export class BookingError extends Error {}

/** Books a driver onto a job. Used when a company accepts an application or a driver accepts an invite. */
export async function bookDriver(jobId: string, driverId: string, terms?: Terms) {
  return db.$transaction(async (tx) => {
    const job = await tx.job.findUnique({ where: { id: jobId } });
    if (!job) throw new BookingError("Job not found.");
    if (job.status !== "OPEN") throw new BookingError("This job is no longer open.");
    if (job.kind === "PERMANENT") throw new BookingError("Permanent roles are filled with “Mark as hired”.");
    if (job.startAt.getTime() < Date.now() - 6 * 3600000) throw new BookingError("This job has already started.");

    const app = await tx.application.findUnique({ where: { jobId_driverId: { jobId, driverId } } });
    if (!app || !["APPLIED", "INVITED"].includes(app.status)) throw new BookingError("No active application for this driver.");

    // Guard against race conditions: only one booking can flip the job from OPEN.
    const updated = await tx.job.updateMany({ where: { id: jobId, status: "OPEN" }, data: { status: "FILLED" } });
    if (updated.count !== 1) throw new BookingError("This job was just booked by someone else.");

    await tx.application.update({ where: { id: app.id }, data: { status: "ACCEPTED" } });
    await tx.application.updateMany({
      where: { jobId, id: { not: app.id }, status: { in: ["APPLIED", "INVITED"] } },
      data: { status: "DECLINED" },
    });
    // A job can only have one booking; reuse the row if a previous booking was cancelled.
    // Negotiated terms (if any) are stored on the booking; otherwise the advertised ones apply.
    const agreed = terms
      ? { agreedPayAmount: terms.payAmount, agreedPayType: terms.payType, agreedStartAt: terms.startAt }
      : { agreedPayAmount: null, agreedPayType: null, agreedStartAt: null };
    return tx.booking.upsert({
      where: { jobId },
      create: { jobId, driverId, companyId: job.companyId, ...agreed },
      update: { driverId, status: "CONFIRMED", completedAt: null, ...agreed },
    });
  });
}
