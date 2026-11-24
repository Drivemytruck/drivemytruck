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
import { notifyJobMatches } from "@/lib/alerts";
import { line, notifyUser } from "@/lib/notify";
import { after } from "next/server";
import { encrypt } from "@/lib/crypto";
import { getTx } from "@/lib/i18n";

const T = async (s: string, v?: Record<string, string | number>) => (await getTx()).tx(s, v);
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
  if (!parsed.success) return { error: await T(parsed.error.issues[0]?.message ?? "Please check the form.") };
  const licenceClasses = fd.getAll("licenceClasses").map(String).filter((c) => LICENCE_CLASSES.some((l) => l.value === c));
  if (!licenceClasses.length) return { error: await T("Please choose at least one licence class.") };
  const skills = fd.getAll("skills").map(String).slice(0, 30);
  const d = parsed.data;
  const contactErr = contactDetailsError(d.bio);
  if (contactErr) return { error: await T(contactErr) };
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
  return { ok: await T("Profile saved.") };
}

export async function toggleAvailableToday() {
  const { driver } = await requireDriver();
  // "Available today" is simply today's row in the availability calendar.
  const date = todayDate();
  const existing = await db.availability.findUnique({ where: { driverId_date: { driverId: driver.id, date } } });
  if (existing) await db.availability.delete({ where: { id: existing.id } });
  else {
    await db.availability.create({ data: { driverId: driver.id, date } });
    await db.driverProfile.update({ where: { id: driver.id }, data: { availabilityUpdatedAt: new Date() } });
    await notifyJobMatches(driver.id, [date]).catch((e) => console.error("[alerts]", e));
  }
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
  if (!parsed.success) return { error: await T(parsed.error.issues[0]?.message ?? "Please check the form.") };
  const { type, reference, checkCode, expiresAt } = parsed.data;
  const meta = DOCUMENT_TYPES.find((d) => d.type === type);
  if (meta?.needsCheckCode && !checkCode) return { error: await T("Please add your DVLA check code so we can verify your licence.") };
  const expiry = expiresAt ? new Date(`${expiresAt}T00:00:00Z`) : null;
  if (expiry && expiry.getTime() < Date.now()) return { error: await T("That document has already expired.") };

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
  return { ok: await T("{doc} saved. We'll check it shortly.", { doc: await T(meta?.label ?? "Document") }) };
}

export async function saveAvailability(_: ActionState, fd: FormData): Promise<ActionState> {
  const { driver } = await requireDriver();
  const isoRe = /^\d{4}-\d{2}-\d{2}$/;
  const days = fd.getAll("day").map(String).filter((d) => isoRe.test(d));
  const range = fd.getAll("range").map(String).filter((d) => isoRe.test(d));

  // Travel radius + base postcode, shown at the top of the availability page.
  const radius = Number(fd.get("radius"));
  if (!Number.isInteger(radius) || radius < 1 || radius > 500) return { error: await T("Travel distance must be between 1 and 500 miles.") };
  const postcode = String(fd.get("postcode") ?? "").trim();
  if (!isValidUkPostcode(postcode)) return { error: await T("Please enter a valid UK postcode.") };

  const entries: { date: Date; startTime: string | null; endTime: string | null; rateAmount: number | null; rateType: PayType | null }[] = [];
  for (const d of days) {
    const start = String(fd.get(`start-${d}`) ?? "");
    const end = String(fd.get(`end-${d}`) ?? "");
    if ((start && !TIME_RE.test(start)) || (end && !TIME_RE.test(end))) return { error: await T("Please check the times on {d}.", { d }) };
    if (!!start !== !!end) return { error: await T("Please give both a start and end time on {d} (or leave both empty).", { d }) };
    const rateRaw = String(fd.get(`rate-${d}`) ?? "").trim();
    const rate = rateRaw === "" ? null : Number(rateRaw);
    if (rate != null && (!Number.isFinite(rate) || rate < 0 || rate > 5000)) return { error: await T("Please check the rate on {d}.", { d }) };
    const rt = String(fd.get(`rateType-${d}`) ?? "SHIFT");
    entries.push({
      date: new Date(`${d}T00:00:00Z`),
      startTime: start || null,
      endTime: end || null,
      rateAmount: rate != null ? Math.round(rate * 100) : null,
      rateType: rate != null ? (rt === "HOURLY" ? "HOURLY" : "SHIFT") : null,
    });
  }

  // Which days are newly added (not already in the calendar)? Those trigger alerts to companies.
  const before = await db.availability.findMany({ where: { driverId: driver.id, date: { in: range.map((d) => new Date(`${d}T00:00:00Z`)) } }, select: { date: true } });
  const had = new Set(before.map((b) => b.date.getTime()));
  const newDates = entries.map((e) => e.date).filter((d) => !had.has(d.getTime()) && d.getTime() >= todayDate().getTime());

  const samePc = postcode.toUpperCase().replace(/\s/g, "") === (driver.postcode ?? "").replace(/\s/g, "");
  const geo = samePc ? {} : await geocodePostcode(postcode);
  await db.$transaction([
    db.driverProfile.update({
      where: { id: driver.id },
      data: { travelRadiusMiles: radius, ...geo, ...(newDates.length ? { availabilityUpdatedAt: new Date() } : {}) },
    }),
    db.availability.deleteMany({ where: { driverId: driver.id, date: { in: range.map((d) => new Date(`${d}T00:00:00Z`)) } } }),
    db.availability.createMany({ data: entries.map((e) => ({ driverId: driver.id, ...e })) }),
  ]);
  revalidatePath("/driver", "layout");
  await notifyJobMatches(driver.id, newDates).catch((e) => console.error("[alerts]", e));
  return {
    ok: entries.length
      ? await T("Saved — you're available on {n} day(s), up to {r} miles away.", { n: entries.length, r: radius })
      : await T("Saved — no days selected."),
  };
}

export async function applyToJob(_: ActionState, fd: FormData): Promise<ActionState> {
  const { driver } = await requireDriver();
  const jobId = String(fd.get("jobId"));
  const message = String(fd.get("message") ?? "").trim().slice(0, 500) || null;
  const contactErr = contactDetailsError(message);
  if (contactErr) return { error: await T(contactErr) };
  const job = await db.job.findUnique({ where: { id: jobId } });
  if (!job || !isLive(job)) return { error: await T("This job is no longer open.") };
  if (!driver.licenceClasses.length) return { error: await T("Add your licence class to your profile first.") };
  if (!canDriveClass(driver.licenceClasses, job.licenceClass)) return { error: await T("Your licence class doesn't cover this job.") };

  const existing = await db.application.findUnique({ where: { jobId_driverId: { jobId, driverId: driver.id } } });
  if (existing?.status === "INVITED" && job.kind === "SHIFT") {
    // Accepting an invite books the driver straight away.
    try {
      const booking = await bookDriver(jobId, driver.id);
      const company = await db.companyProfile.findUnique({ where: { id: job.companyId }, select: { userId: true } });
      if (company)
        after(() =>
          notifyUser(company.userId, (tx, lang) => ({
            subject: tx("{name} accepted your invite — booked", { name: driver.fullName.split(" ")[0] }),
            paragraphs: [tx("{name} accepted your invite and is now booked for:", { name: driver.fullName }), line(job, lang)],
            cta: tx("View booking"),
            path: `/bookings/${booking.id}`,
          })),
        );
    } catch (e) {
      return { error: await T(e instanceof BookingError ? e.message : "Something went wrong.") };
    }
    revalidatePath(`/jobs/${jobId}`);
    return { ok: await T("You're booked! The company has your details.") };
  }
  await db.application.upsert({
    where: { jobId_driverId: { jobId, driverId: driver.id } },
    create: { jobId, driverId: driver.id, message },
    update: { status: "APPLIED", message },
  });
  revalidatePath(`/jobs/${jobId}`);
  if (existing?.status !== "APPLIED") {
    const company = await db.companyProfile.findUnique({ where: { id: job.companyId }, select: { userId: true } });
    if (company)
      after(() =>
        notifyUser(company.userId, (tx, lang) => ({
          subject:
            job.kind === "PERMANENT"
              ? tx("{name} is interested in your role", { name: driver.fullName.split(" ")[0] })
              : tx("{name} is available for your job", { name: driver.fullName.split(" ")[0] }),
          paragraphs: [
            job.kind === "PERMANENT"
              ? tx("{name} is interested in your permanent role:", { name: driver.fullName })
              : tx("{name} says they're available for your job:", { name: driver.fullName }),
            line(job, lang),
            ...(message ? [`“${message}”`] : []),
          ],
          cta: job.kind === "PERMANENT" ? tx("View driver") : tx("View driver & book"),
          path: `/company/jobs/${job.id}`,
        })),
      );
  }
  return {
    ok: await T(job.kind === "PERMANENT" ? "Sent! The company can now see your profile and contact details." : "Sent! The company will see you're available."),
  };
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
  if (contactErr) return { error: await T(contactErr) };
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
  return {
    ok: on
      ? await T("Saved — companies can see you're open to permanent work for the next {n} days.", { n: PERM_SEEKING_DAYS })
      : await T("Saved — you're not shown as looking for permanent work."),
  };
}

export async function saveJobAlerts(_: ActionState, fd: FormData): Promise<ActionState> {
  const { driver } = await requireDriver();
  const on = fd.get("jobAlertsEnabled") === "on";
  await db.driverProfile.update({ where: { id: driver.id }, data: { jobAlertsEnabled: on } });
  revalidatePath("/driver/profile");
  return { ok: await T(on ? "Saved — we'll email you about new jobs near you." : "Saved — job emails are off.") };
}
