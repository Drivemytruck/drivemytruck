import type { Prisma } from "@prisma/client";

/** Jobs drivers can still see and respond to. */
export function liveJobsWhere(now = new Date()): Prisma.JobWhereInput {
  return {
    status: "OPEN",
    OR: [
      { kind: "SHIFT", startAt: { gte: new Date(now.getTime() - 2 * 3600000) } },
      { kind: "PERMANENT", expiresAt: { gt: now } },
    ],
  };
}

export function isLive(job: { status: string; kind: string; startAt: Date; expiresAt: Date | null }, now = new Date()) {
  if (job.status !== "OPEN") return false;
  return job.kind === "PERMANENT" ? !!job.expiresAt && job.expiresAt > now : job.startAt.getTime() >= now.getTime() - 2 * 3600000;
}

export function daysLeft(expiresAt: Date | null, now = new Date()) {
  if (!expiresAt) return 0;
  return Math.ceil((expiresAt.getTime() - now.getTime()) / 86400000);
}

export function isSeekingPermanent(d: { openToPermanent: boolean; permanentUntil: Date | null }, now = new Date()) {
  return d.openToPermanent && !!d.permanentUntil && d.permanentUntil > now;
}
