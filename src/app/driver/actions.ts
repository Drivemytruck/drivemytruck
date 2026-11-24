"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { DocumentType, PayType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireDriver } from "@/lib/session";
import { geocodePostcode, isValidUkPostcode } from "@/lib/geo";
import { DOCUMENT_TYPES, EMPLOYMENT_TYPES, LICENCE_CLASSES, PERM_SEEKING_DAYS, canDriveClass } from "@/lib/constants";
import { bookDriver, BookingError } from "@/lib/bookings";
import { TIME_RE, todayDate } from "@/lib/availability";
import { contactDetailsError } from "@/lib/contact-guard";
import { isLive } from "@/lib/jobs";
import { encrypt } from "@/lib/crypto";
import type { ActionState } from "@/components/forms";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(120),
  phone: z.string().trim().max(30).optional(),
  postcode: z.string().trim().refine(isValidUkPostcode, "Please enter a valid UK postcode"),
  travelRadiusMiles: z.coerce.number().int().min(1).max(500),
  experienceYears: z.coerce.number().int().min(0).max(60).optional(),
  rateType: z.enum(["SHIFT", "HOURLY"]),
  rate: z.coerce.number().min(0).max(5000).optional(),
  bio: z.string().trim().max(1000).optional(),
});

export async function updateDriverProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  const { driver } = await requireDriver();
  const raw = Object.fromEntries(fd);
  for (const k of ["phone", "experienceYears", "rate", "bio"]) if (raw[k] === "") delete raw[k];
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const licenceClasses = fd.getAll("licenceClasses").map(String).filter((c) => LICENCE_CLASSES.some((l) => l.value === c));
  if (!licenceClasses.length) return { error: "Please choose at least one licence class." };
  const skills = fd.getAll("skills").map(String).slice(0, 30);
  const d = parsed.data;
  const contactErr = contactDetailsError(d.bio);
  if (contactErr) return { error: contactErr };
  const geo = d.postcode.toUpperCase().replace(/\s/g, "") === (driver.postcode ?? "").replace(/\s/g, "")
    ? { postcode: driver.postcode!, town: driver.town, lat: driver.lat, lng: driver.lng }
    : await geocodePostcode(d.postcode);

  await db.driverProfile.update({
    where: { id: driver.id },
    data: {
      fullName: d.fullName,
      phone: d.phone ?? null,
      ...geo,
      travelRadiusMiles: d.travelRadiusMiles,
      experienceYears: d.experienceYears ?? null,
      rateType: d.rateType,
      rateAmount: d.rate != null ? Math.round(d.rate * 100) : null,
      bio: d.bio ?? null,
      licenceClasses,
      skills,
    },
  });
  revalidatePath("/driver", "layout");
  return { ok: "Profile saved." };
}

export async function toggleAvailableToday() {
  const { driver } = await requireDriver();
  // "Available today" is simply today's row in the availability calendar.
  const date = todayDate();
  const existing = await db.availability.findUnique({ where: { driverId_date: { driverId: driver.id, date } } });
  if (existing) await db.availability.delete({ where: { id: existing.id } });
  else await db.availability.create({ data: { driverId: driver.id, date } });
  revalidatePath("/driver");
}

const docSchema = z.object({
  type: z.enum(["LICENCE", "CPC", "TACHO", "RIGHT_TO_WORK", "ADR", "OTHER"]),
  reference: z.string().trim().min(3, "Please enter the document number / code").max(60),
  checkCode: z.string().trim().max(20).optional(),
  expiresAt: z.string().optional(),
});

export async function saveDocument(_: ActionState, fd: FormData): Promise<ActionState> {
  const { driver } = await requireDriver();
  const raw = Object.fromEntries(fd);
  if (raw.checkCode === "") delete raw.checkCode;
  if (raw.expiresAt === "") delete raw.expiresAt;
  const parsed = docSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { type, reference, checkCode, expiresAt } = parsed.data;
  const meta = DOCUMENT_TYPES.find((d) => d.type === type);
  if (meta?.needsCheckCode && !checkCode) return { error: "Please add your DVLA check code so we can verify your licence." };
  const expiry = expiresAt ? new Date(`${expiresAt}T00:00:00Z`) : null;
  if (expiry && expiry.getTime() < Date.now()) return { error: "That document has already expired." };

  await db.driverDocument.upsert({
    where: { driverId_type: { driverId: driver.id, type: type as DocumentType } },
    // Document numbers and check codes are encrypted at rest.
    create: { driverId: driver.id, type: type as DocumentType, reference: encrypt(reference)!, checkCode: encrypt(checkCode), expiresAt: expiry },
    update: { reference: encrypt(reference)!, checkCode: encrypt(checkCode), expiresAt: expiry, status: "PENDING", adminNote: null },
  });
  // Any change to documents means the driver needs re-checking.
  if (driver.verificationStatus === "VERIFIED") {
    await db.driverProfile.update({ where: { id: driver.id }, data: { verificationStatus: "PENDING" } });
  }
  revalidatePath("/driver/documents");
  return { ok: `${meta?.label ?? "Document"} saved. We'll check it shortly.` };
}

export async function saveAvailability(_: ActionState, fd: FormData): Promise<ActionState> {
  const { driver } = await requireDriver();
  const isoRe = /^\d{4}-\d{2}-\d{2}$/;
  const days = fd.getAll("day").map(String).filter((d) => isoRe.test(d));
  const range = fd.getAll("range").map(String).filter((d) => isoRe.test(d));

  // Travel radius + base postcode, shown at the top of the availability page.
  const radius = Number(fd.get("radius"));
  if (!Number.isInteger(radius) || radius < 1 || radius > 500) return { error: "Travel distance must be between 1 and 500 miles." };
  const postcode = String(fd.get("postcode") ?? "").trim();
  if (!isValidUkPostcode(postcode)) return { error: "Please enter a valid UK postcode." };

  const entries: { date: Date; startTime: string | null; endTime: string | null; rateAmount: number | null; rateType: PayType | null }[] = [];
  for (const d of days) {
    const start = String(fd.get(`start-${d}`) ?? "");
    const end = String(fd.get(`end-${d}`) ?? "");
    if ((start && !TIME_RE.test(start)) || (end && !TIME_RE.test(end))) return { error: `Please check the times on ${d}.` };
    if (!!start !== !!end) return { error: `Please give both a start and end time on ${d} (or leave both empty).` };
    const rateRaw = String(fd.get(`rate-${d}`) ?? "").trim();
    const rate = rateRaw === "" ? null : Number(rateRaw);
    if (rate != null && (!Number.isFinite(rate) || rate < 0 || rate > 5000)) return { error: `Please check the rate on ${d}.` };
    const rt = String(fd.get(`rateType-${d}`) ?? "SHIFT");
    entries.push({
      date: new Date(`${d}T00:00:00Z`),
      startTime: start || null,
      endTime: end || null,
      rateAmount: rate != null ? Math.round(rate * 100) : null,
      rateType: rate != null ? (rt === "HOURLY" ? "HOURLY" : "SHIFT") : null,
    });
  }

  const samePc = postcode.toUpperCase().replace(/\s/g, "") === (driver.postcode ?? "").replace(/\s/g, "");
  const geo = samePc ? {} : await geocodePostcode(postcode);
  await db.$transaction([
    db.driverProfile.update({ where: { id: driver.id }, data: { travelRadiusMiles: radius, ...geo } }),
    db.availability.deleteMany({ where: { driverId: driver.id, date: { in: range.map((d) => new Date(`${d}T00:00:00Z`)) } } }),
    db.availability.createMany({ data: entries.map((e) => ({ driverId: driver.id, ...e })) }),
  ]);
  revalidatePath("/driver", "layout");
  return { ok: entries.length ? `Saved — you're available on ${entries.length} day(s), up to ${radius} miles away.` : "Saved — no days selected." };
}

export async function applyToJob(_: ActionState, fd: FormData): Promise<ActionState> {
  const { driver } = await requireDriver();
  const jobId = String(fd.get("jobId"));
  const message = String(fd.get("message") ?? "").trim().slice(0, 500) || null;
  const contactErr = contactDetailsError(message);
  if (contactErr) return { error: contactErr };
  const job = await db.job.findUnique({ where: { id: jobId } });
  if (!job || !isLive(job)) return { error: "This job is no longer open." };
  if (!driver.licenceClasses.length) return { error: "Add your licence class to your profile first." };
  if (!canDriveClass(driver.licenceClasses, job.licenceClass)) return { error: "Your licence class doesn't cover this job." };

  const existing = await db.application.findUnique({ where: { jobId_driverId: { jobId, driverId: driver.id } } });
  if (existing?.status === "INVITED" && job.kind === "SHIFT") {
    // Accepting an invite books the driver straight away.
    try {
      await bookDriver(jobId, driver.id);
    } catch (e) {
      return { error: e instanceof BookingError ? e.message : "Something went wrong." };
    }
    revalidatePath(`/jobs/${jobId}`);
    return { ok: "You're booked! The company has your details." };
  }
  await db.application.upsert({
    where: { jobId_driverId: { jobId, driverId: driver.id } },
    create: { jobId, driverId: driver.id, message },
    update: { status: "APPLIED", message },
  });
  revalidatePath(`/jobs/${jobId}`);
  return { ok: job.kind === "PERMANENT" ? "Sent! The company can now see your profile and contact details." : "Sent! The company will see you're available." };
}

export async function withdrawApplication(fd: FormData) {
  const { driver } = await requireDriver();
  const jobId = String(fd.get("jobId"));
  await db.application.updateMany({
    where: { jobId, driverId: driver.id, status: { in: ["APPLIED", "INVITED"] } },
    data: { status: "WITHDRAWN" },
  });
  revalidatePath(`/jobs/${jobId}`);
}

/** "Looking for permanent work" — visible to companies for 30 days, then the driver confirms. */
export async function savePermanentPrefs(_: ActionState, fd: FormData): Promise<ActionState> {
  const { driver } = await requireDriver();
  const on = fd.get("openToPermanent") === "on";
  const employment = fd.getAll("permEmployment").map(String).filter((t) => (EMPLOYMENT_TYPES as readonly string[]).includes(t));
  const schedule = String(fd.get("permSchedule") ?? "").trim().slice(0, 120) || null;
  const note = String(fd.get("permNote") ?? "").trim().slice(0, 500) || null;
  const contactErr = contactDetailsError(schedule, note);
  if (contactErr) return { error: contactErr };
  await db.driverProfile.update({
    where: { id: driver.id },
    data: {
      openToPermanent: on,
      permanentUntil: on ? new Date(Date.now() + PERM_SEEKING_DAYS * 86400000) : null,
      permReminderSentAt: null,
      permEmployment: employment,
      permSchedule: schedule,
      permNote: note,
    },
  });
  revalidatePath("/driver", "layout");
  return { ok: on ? `Saved — companies can see you're open to permanent work for the next ${PERM_SEEKING_DAYS} days.` : "Saved — you're not shown as looking for permanent work." };
}
