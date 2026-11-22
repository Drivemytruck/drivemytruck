"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { DOCUMENT_TYPES } from "@/lib/constants";

const STATUSES = ["PENDING", "VERIFIED", "REJECTED"] as const;
type Status = (typeof STATUSES)[number];
const asStatus = (v: FormDataEntryValue | null): Status => (STATUSES.includes(v as Status) ? (v as Status) : "PENDING");

export async function reviewDocument(fd: FormData) {
  await requireUser("ADMIN");
  const doc = await db.driverDocument.update({
    where: { id: String(fd.get("docId")) },
    data: { status: asStatus(fd.get("status")), adminNote: String(fd.get("note") ?? "").trim() || null },
  });
  // Driver is verified once every required document is verified.
  const docs = await db.driverDocument.findMany({ where: { driverId: doc.driverId } });
  const required = DOCUMENT_TYPES.filter((d) => d.required).map((d) => d.type as string);
  const allOk = required.every((t) => docs.find((d) => d.type === t)?.status === "VERIFIED");
  const anyRejected = docs.some((d) => d.status === "REJECTED");
  await db.driverProfile.update({
    where: { id: doc.driverId },
    data: { verificationStatus: allOk ? "VERIFIED" : anyRejected ? "REJECTED" : "PENDING" },
  });
  revalidatePath("/admin");
}

export async function setCompanyStatus(fd: FormData) {
  await requireUser("ADMIN");
  await db.companyProfile.update({ where: { id: String(fd.get("companyId")) }, data: { verificationStatus: asStatus(fd.get("status")) } });
  revalidatePath("/admin");
}

export async function toggleSuspend(fd: FormData) {
  const admin = await requireUser("ADMIN");
  const id = String(fd.get("userId"));
  if (id === admin.id) return;
  const u = await db.user.findUnique({ where: { id } });
  if (u) await db.user.update({ where: { id }, data: { suspended: !u.suspended } });
  revalidatePath("/admin");
}

export async function toggleReviewHidden(fd: FormData) {
  await requireUser("ADMIN");
  const r = await db.review.findUnique({ where: { id: String(fd.get("reviewId")) } });
  if (r) await db.review.update({ where: { id: r.id }, data: { hidden: !r.hidden } });
  revalidatePath("/admin");
}
