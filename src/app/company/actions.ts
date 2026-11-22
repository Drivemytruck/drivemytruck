"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/session";
import { geocodePostcode, isValidUkPostcode } from "@/lib/geo";
import { LICENCE_CLASSES, canDriveClass } from "@/lib/constants";
import { londonToDate } from "@/lib/format";
import { bookDriver, BookingError } from "@/lib/bookings";
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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { postcode, ...rest } = parsed.data;
  const geo = postcode.toUpperCase().replace(/\s/g, "") === (company.postcode ?? "").replace(/\s/g, "")
    ? { postcode: company.postcode!, town: company.town, lat: company.lat, lng: company.lng }
    : await geocodePostcode(postcode);
  await db.companyProfile.update({ where: { id: company.id }, data: { ...rest, ...geo } });
  revalidatePath("/company", "layout");
  return { ok: "Company profile saved." };
}

const jobSchema = z.object({
  licenceClass: z.enum(LICENCE_CLASSES.map((c) => c.value) as [string, ...string[]], { errorMap: () => ({ message: "Choose a licence class" }) }),
  postcode: z.string().trim().refine(isValidUkPostcode, "Please enter a valid UK postcode for the start location"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a start date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a start time"),
  durationHours: z.coerce.number().min(1, "Duration must be at least 1 hour").max(24 * 14),
  payType: z.enum(["SHIFT", "HOURLY"]),
  pay: z.coerce.number().min(1, "Enter the pay rate").max(10000),
  jobType: opt(z.string().trim().max(60)),
  vehicleType: opt(z.string().trim().max(60)),
  description: opt(z.string().trim().max(2000)),
  requirements: opt(z.string().trim().max(1000)),
});

export async function createJob(_: ActionState, fd: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const parsed = jobSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  const startAt = londonToDate(d.date, d.time);
  if (startAt.getTime() < Date.now() - 3600000) return { error: "The start time is in the past." };
  const geo = await geocodePostcode(d.postcode);
  const job = await db.job.create({
    data: {
      companyId: company.id,
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
    if (e instanceof BookingError) return { error: e.message };
    throw e;
  }
}

export async function inviteDriver(_: ActionState, fd: FormData): Promise<ActionState> {
  const { job } = await ownJob(String(fd.get("jobId")));
  const driverId = String(fd.get("driverId"));
  if (job.status !== "OPEN") return { error: "That job is no longer open." };
  const driver = await db.driverProfile.findUnique({ where: { id: driverId } });
  if (!driver) return { error: "Driver not found." };
  if (!canDriveClass(driver.licenceClasses, job.licenceClass)) return { error: "This driver's licence doesn't cover that job." };
  const existing = await db.application.findUnique({ where: { jobId_driverId: { jobId: job.id, driverId } } });
  if (existing && ["APPLIED", "ACCEPTED"].includes(existing.status)) return { ok: "This driver has already applied — you can book them on the job page." };
  await db.application.upsert({
    where: { jobId_driverId: { jobId: job.id, driverId } },
    create: { jobId: job.id, driverId, status: "INVITED" },
    update: { status: "INVITED" },
  });
  revalidatePath(`/drivers/${driverId}`);
  return { ok: "Invite sent. The driver will see it under “My work”." };
}
