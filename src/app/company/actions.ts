"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { geocodePostcode, isValidUkPostcode } from "@/lib/geo";
import { EMPLOYMENT_TYPES, LICENCE_CLASSES, PERM_LISTING_DAYS, canDriveClass } from "@/lib/constants";
import { londonToDate } from "@/lib/format";
import { bookDriver, BookingError } from "@/lib/bookings";
import { contactDetailsError } from "@/lib/contact-guard";
import { getTx } from "@/lib/i18n";

const T = async (s: string, v?: Record<string, string | number>) => (await getTx()).tx(s, v);
import type { ActionState } from "@/components/forms";

const opt = (s: z.ZodString) => s.optional().transform((v) => (v ? v : null));

const companySchema = z.object({
  companyName: z.string().trim().min(2, "Please enter the company name").max(120),
  companiesHouseNumber: opt(z.string().trim().max(12)),
  operatorLicence: opt(z.string().trim().max(20)),
  contactName: opt(z.string().trim().max(80)),
  phone: opt(z.string().trim().max(30)),
  postcode: z.string().trim().refine(isValidUkPostcode, "Please enter a valid UK postcode"),
  about: opt(z.string().trim().max(1500)),
});

export async function updateCompanyProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const parsed = companySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: await T(parsed.error.issues[0]?.message ?? "Please check the form.") };
  const { postcode, ...rest } = parsed.data;
  const contactErr = contactDetailsError(rest.about);
  if (contactErr) return { error: await T(contactErr) };
  const geo = postcode.toUpperCase().replace(/\s/g, "") === (company.postcode ?? "").replace(/\s/g, "")
    ? { postcode: company.postcode!, town: company.town, lat: company.lat, lng: company.lng }
    : await geocodePostcode(postcode);
  await db.companyProfile.update({ where: { id: company.id }, data: { ...rest, ...geo } });
  revalidatePath("/company", "layout");
  return { ok: await T("Company profile saved.") };
}

const jobBase = {
  licenceClass: z.enum(LICENCE_CLASSES.map((c) => c.value) as [string, ...string[]], { errorMap: () => ({ message: "Choose a licence class" }) }),
  postcode: z.string().trim().refine(isValidUkPostcode, "Please enter a valid UK postcode"),
  pay: z.coerce.number().min(1, "Enter the pay rate").max(200000),
  jobType: opt(z.string().trim().max(60)),
  vehicleType: opt(z.string().trim().max(60)),
  description: opt(z.string().trim().max(2000)),
  requirements: opt(z.string().trim().max(1000)),
};

const shiftSchema = z.object({
  ...jobBase,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a start date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a start time"),
  durationHours: z.coerce.number().min(1, "Duration must be at least 1 hour").max(24 * 14),
  payType: z.enum(["SHIFT", "HOURLY"]),
});

const permSchema = z.object({
  ...jobBase,
  startAsap: z.literal("on").optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  payType: z.enum(["HOURLY", "ANNUAL"]),
  schedule: z.string().trim().min(2, "Describe the shift pattern (e.g. Mon–Fri nights)").max(120),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  benefits: opt(z.string().trim().max(1000)),
});

export async function createJob(_: ActionState, fd: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const raw = Object.fromEntries(fd);
  const kind = raw.kind === "PERMANENT" ? "PERMANENT" : "SHIFT";

  if (kind === "SHIFT") {
    const parsed = shiftSchema.safeParse(raw);
    if (!parsed.success) return { error: await T(parsed.error.issues[0]?.message ?? "Please check the form.") };
    const d = parsed.data;
    const contactErr = contactDetailsError(d.description, d.requirements);
    if (contactErr) return { error: await T(contactErr) };
    const startAt = londonToDate(d.date, d.time);
    if (startAt.getTime() < Date.now() - 3600000) return { error: await T("The start time is in the past.") };
    const geo = await geocodePostcode(d.postcode);
    const job = await db.job.create({
      data: {
        companyId: company.id,
        kind,
        licenceClass: d.licenceClass,
        ...geo,
        startAt,
        durationHours: d.durationHours,
        payType: d.payType,
        payAmount: Math.round(d.pay * 100),
        jobType: d.jobType,
        vehicleType: d.vehicleType,
        description: d.description,
        requirements: d.requirements,
      },
    });
    revalidatePath("/company");
    redirect(`/company/jobs/${job.id}?posted=1`);
  }

  const parsed = permSchema.safeParse(raw);
  if (!parsed.success) return { error: await T(parsed.error.issues[0]?.message ?? "Please check the form.") };
  const d = parsed.data;
  const contactErr = contactDetailsError(d.description, d.requirements, d.benefits, d.schedule);
  if (contactErr) return { error: await T(contactErr) };
  const asap = d.startAsap === "on" || !d.date;
  const startAt = asap ? new Date() : londonToDate(d.date!, "08:00");
  const geo = await geocodePostcode(d.postcode);
  const job = await db.job.create({
    data: {
      companyId: company.id,
      kind,
      licenceClass: d.licenceClass,
      ...geo,
      startAt,
      startAsap: asap,
      payType: d.payType,
      payAmount: Math.round(d.pay * 100),
      schedule: d.schedule,
      employmentType: d.employmentType,
      benefits: d.benefits,
      jobType: d.jobType,
      vehicleType: d.vehicleType,
      description: d.description,
      requirements: d.requirements,
      expiresAt: new Date(Date.now() + PERM_LISTING_DAYS * 86400000),
    },
  });
  revalidatePath("/company");
  redirect(`/company/jobs/${job.id}?posted=1`);
}

/** Extend a permanent advert by another listing period. Free during launch — a payment step can be added here later. */
export async function renewJob(fd: FormData) {
  const { job } = await ownJob(String(fd.get("jobId")));
  if (job.kind !== "PERMANENT" || job.status !== "OPEN") return;
  const now = Date.now();
  const base = Math.max(now, job.expiresAt?.getTime() ?? now);
  if (base - now > 3 * 86400000) return; // only within the last 3 days, or once expired
  await db.job.update({
    where: { id: job.id },
    data: { expiresAt: new Date(base + PERM_LISTING_DAYS * 86400000), renewCount: { increment: 1 }, expiryReminderSentAt: null },
  });
  revalidatePath(`/company/jobs/${job.id}`);
  revalidatePath("/company");
}

/** Permanent roles: the company marks the driver they hired; the advert closes. */
export async function markHired(_: ActionState, fd: FormData): Promise<ActionState> {
  const { job } = await ownJob(String(fd.get("jobId")));
  const driverId = String(fd.get("driverId"));
  if (job.kind !== "PERMANENT" || job.status !== "OPEN") return { error: await T("This advert is no longer open.") };
  const app = await db.application.findUnique({ where: { jobId_driverId: { jobId: job.id, driverId } } });
  if (!app || !["APPLIED", "INVITED"].includes(app.status)) return { error: await T("This driver hasn't responded to the advert.") };
  await db.$transaction([
    db.job.update({ where: { id: job.id }, data: { status: "FILLED" } }),
    db.application.update({ where: { id: app.id }, data: { status: "ACCEPTED" } }),
    db.application.updateMany({ where: { jobId: job.id, id: { not: app.id }, status: { in: ["APPLIED", "INVITED"] } }, data: { status: "DECLINED" } }),
    db.driverProfile.update({ where: { id: driverId }, data: { openToPermanent: false, permanentUntil: null } }),
  ]);
  revalidatePath(`/company/jobs/${job.id}`);
  return { ok: await T("Marked as hired 🎉 The advert has been closed.") };
}

async function ownJob(jobId: string) {
  const { company } = await requireCompany();
  const job = await db.job.findUnique({ where: { id: jobId } });
  if (!job || job.companyId !== company.id) throw new Error("Not found");
  return { company, job };
}

export async function cancelJob(fd: FormData) {
  const { job } = await ownJob(String(fd.get("jobId")));
  if (job.status === "OPEN") {
    await db.$transaction([
      db.job.update({ where: { id: job.id }, data: { status: "CANCELLED" } }),
      db.application.updateMany({ where: { jobId: job.id, status: { in: ["APPLIED", "INVITED"] } }, data: { status: "DECLINED" } }),
    ]);
  }
  revalidatePath(`/company/jobs/${job.id}`);
}

export async function acceptApplicant(_: ActionState, fd: FormData): Promise<ActionState> {
  const { job } = await ownJob(String(fd.get("jobId")));
  const driverId = String(fd.get("driverId"));
  try {
    const booking = await bookDriver(job.id, driverId);
    revalidatePath(`/company/jobs/${job.id}`);
    redirect(`/bookings/${booking.id}?new=1`);
  } catch (e) {
    if (e instanceof BookingError) return { error: await T(e.message) };
    throw e;
  }
}

export async function inviteDriver(_: ActionState, fd: FormData): Promise<ActionState> {
  const { job } = await ownJob(String(fd.get("jobId")));
  const driverId = String(fd.get("driverId"));
  if (job.status !== "OPEN") return { error: await T("That job is no longer open.") };
  const driver = await db.driverProfile.findUnique({ where: { id: driverId } });
  if (!driver) return { error: await T("Driver not found.") };
  if (!canDriveClass(driver.licenceClasses, job.licenceClass)) return { error: await T("This driver's licence doesn't cover that job.") };
  const existing = await db.application.findUnique({ where: { jobId_driverId: { jobId: job.id, driverId } } });
  if (existing && ["APPLIED", "ACCEPTED"].includes(existing.status)) return { ok: await T("This driver has already applied — you can book them on the job page.") };
  await db.application.upsert({
    where: { jobId_driverId: { jobId: job.id, driverId } },
    create: { jobId: job.id, driverId, status: "INVITED" },
    update: { status: "INVITED" },
  });
  revalidatePath(`/drivers/${driverId}`);
  return { ok: await T("Invite sent. The driver will see it under “My work”.") };
}

/** Email alerts about drivers becoming available nearby. */
export async function saveAlertSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const on = fd.get("alertsEnabled") === "on";
  const radius = Number(fd.get("alertRadiusMiles"));
  if (!Number.isInteger(radius) || radius < 5 || radius > 300) return { error: await T("Choose a radius between 5 and 300 miles.") };
  const classes = fd.getAll("alertClasses").map(String).filter((c) => LICENCE_CLASSES.some((l) => l.value === c));
  await db.companyProfile.update({ where: { id: company.id }, data: { alertsEnabled: on, alertRadiusMiles: radius, alertClasses: classes } });
  revalidatePath("/company/profile");
  return { ok: await T(on ? "Saved — we'll email you when drivers near you become available." : "Saved — availability emails are off.") };
}
