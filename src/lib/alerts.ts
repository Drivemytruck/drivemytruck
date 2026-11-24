import "server-only";
import { db } from "./db";
import { distanceMiles } from "./geo";
import { canDriveClass, licenceLabel } from "./constants";
import { jobFitsWindow, windowLabel, dayRateLabel } from "./availability";
import { brandedEmail, sendEmail, sendEmailBatch, siteUrl } from "./email";
import { makeTx, type Lang } from "./tx";

const fmtDay = (d: Date, lang: Lang) =>
  new Intl.DateTimeFormat(lang === "pl" ? "pl-PL" : "en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(d);

/**
 * A driver just added available days: email companies whose OPEN shift on one of those days
 * fits the driver (class, time window, distance). One email per job+driver, ever.
 */
export async function notifyJobMatches(driverId: string, newDates: Date[]) {
  if (!newDates.length) return 0;
  const driver = await db.driverProfile.findUnique({
    where: { id: driverId },
    include: { user: { select: { suspended: true } }, availability: { where: { date: { in: newDates } } } },
  });
  if (!driver || driver.user.suspended || !driver.licenceClasses.length) return 0;
  const from = new Date(Math.min(...newDates.map((d) => d.getTime())) - 86400000);
  const to = new Date(Math.max(...newDates.map((d) => d.getTime())) + 2 * 86400000);
  const jobs = await db.job.findMany({
    where: { kind: "SHIFT", status: "OPEN", startAt: { gte: new Date(Math.max(from.getTime(), Date.now())), lt: to } },
    include: { company: { include: { user: { select: { email: true, locale: true, suspended: true } } } } },
    take: 200,
  });
  let sent = 0;
  for (const job of jobs) {
    if (!job.company.alertsEnabled || job.company.user.suspended) continue;
    if (!canDriveClass(driver.licenceClasses, job.licenceClass)) continue;
    const day = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(job.startAt) + "T00:00:00Z");
    const slot = driver.availability.find((a) => a.date.getTime() === day.getTime());
    if (!slot || !jobFitsWindow(job.startAt, slot)) continue;
    const dist = distanceMiles(driver, job);
    if (dist != null && dist > driver.travelRadiusMiles) continue;
    const already = await db.jobMatchAlert.findUnique({ where: { jobId_driverId: { jobId: job.id, driverId } } });
    if (already) continue;
    await db.jobMatchAlert.create({ data: { jobId: job.id, driverId } });
    const lang = (job.company.user.locale === "pl" ? "pl" : "en") as Lang;
    const tx = makeTx(lang);
    const first = driver.fullName.split(" ")[0];
    const rate = dayRateLabel(slot);
    const { html, text } = brandedEmail({
      paragraphs: [
        tx("Good news — a driver is available for your job."),
        tx("{name} is available on {day} ({hours}{rate}) and can drive {class}.", {
          name: first,
          day: fmtDay(day, lang),
          hours: tx(windowLabel(slot)),
          rate: rate ? `, ${rate}` : "",
          class: licenceLabel(job.licenceClass),
        }),
        tx("Your job: {class} · {place}.", { class: licenceLabel(job.licenceClass), place: job.town ?? job.postcode }),
      ],
      cta: tx("View driver & invite"),
      url: `${siteUrl()}/company/jobs/${job.id}`,
    });
    await sendEmail({ to: job.company.user.email, subject: tx("{name} is available for your job", { name: first }), html, text });
    sent++;
  }
  return sent;
}

/** Daily email to companies: drivers nearby who added availability since the last digest. */
export async function sendAvailabilityDigests() {
  const now = new Date();
  const today = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(now) + "T00:00:00Z");
  const horizon = new Date(today.getTime() + 14 * 86400000);
  const companies = await db.companyProfile.findMany({
    where: { alertsEnabled: true, lat: { not: null }, user: { suspended: false } },
    include: { user: { select: { email: true, locale: true } } },
  });
  if (!companies.length) return 0;
  const since = new Date(now.getTime() - 25 * 3600000);
  const drivers = await db.driverProfile.findMany({
    where: { availabilityUpdatedAt: { gte: since }, user: { suspended: false }, lat: { not: null } },
    include: { availability: { where: { date: { gte: today, lt: horizon } }, orderBy: { date: "asc" } } },
  });
  let sent = 0;
  for (const c of companies) {
    const after = c.lastDigestAt ?? since;
    const matches = drivers
      .filter((d) => d.availabilityUpdatedAt! > after && d.availability.length)
      .filter((d) => !c.alertClasses.length || c.alertClasses.some((cl) => canDriveClass(d.licenceClasses, cl)))
      .map((d) => ({ d, dist: distanceMiles(c, d) }))
      .filter(({ dist }) => dist != null && dist <= c.alertRadiusMiles)
      .sort((a, b) => a.dist! - b.dist!)
      .slice(0, 10);
    if (!matches.length) continue;
    const lang = (c.user.locale === "pl" ? "pl" : "en") as Lang;
    const tx = makeTx(lang);
    const lines = matches.map(({ d, dist }) => {
      const days = d.availability
        .slice(0, 4)
        .map((a) => new Intl.DateTimeFormat(lang === "pl" ? "pl-PL" : "en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(a.date))
        .join(", ");
      return `${d.fullName.split(" ")[0]} · ${d.licenceClasses.map(licenceLabel).join(", ")} · ${Math.round(dist!)} ${tx("miles")} · ${days}${d.availability.length > 4 ? "…" : ""}`;
    });
    const { html, text } = brandedEmail({
      paragraphs: [tx("New drivers available near you:"), ...lines, tx("You can change or turn off these emails in your company profile.")],
      cta: tx("See available drivers"),
      url: `${siteUrl()}/company/drivers`,
    });
    await sendEmail({ to: c.user.email, subject: tx(matches.length === 1 ? "{n} driver available near you" : "{n} drivers available near you", { n: matches.length }), html, text });
    await db.companyProfile.update({ where: { id: c.id }, data: { lastDigestAt: now } });
    sent++;
  }
  return sent;
}

// ---------------------------------------------------------------------------
// Drivers: new jobs nearby
// ---------------------------------------------------------------------------

const MAX_INSTANT_PER_DAY = 5;

function jobLine(job: { licenceClass: string; town: string | null; postcode: string; kind: string; startAt: Date; schedule: string | null; payAmount: number; payType: "SHIFT" | "HOURLY" | "ANNUAL" }, lang: Lang) {
  const tx = makeTx(lang);
  const when =
    job.kind === "PERMANENT"
      ? `${tx("Permanent")}${job.schedule ? ` · ${job.schedule}` : ""}`
      : new Intl.DateTimeFormat(lang === "pl" ? "pl-PL" : "en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(job.startAt);
  return `${licenceLabel(job.licenceClass)} · ${job.town ?? job.postcode} · ${when} · ${payShortText(job.payAmount, job.payType)}`;
}

function payShortText(pence: number, type: "SHIFT" | "HOURLY" | "ANNUAL") {
  if (type === "ANNUAL") return `£${Math.round(pence / 100000)}k/yr`;
  const p = pence / 100;
  return `£${p % 1 ? p.toFixed(2) : p}${type === "HOURLY" ? "/h" : ""}`;
}

/** A company posted a job: email drivers it clearly fits (their available day, or permanent seekers). Runs after the response. */
export async function notifyDriversOfNewJob(jobId: string) {
  const job = await db.job.findUnique({ where: { id: jobId }, include: { company: { select: { companyName: true } } } });
  if (!job || job.status !== "OPEN") return 0;
  const covering = ["C+E", "C", "C1"].filter((c) => canDriveClass([c], job.licenceClass));
  const day = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(job.startAt) + "T00:00:00Z");
  const drivers = await db.driverProfile.findMany({
    where: {
      jobAlertsEnabled: true,
      lat: { not: null },
      licenceClasses: { hasSome: covering },
      user: { suspended: false },
      ...(job.kind === "PERMANENT" ? { openToPermanent: true, permanentUntil: { gt: new Date() } } : { availability: { some: { date: day } } }),
    },
    include: { user: { select: { email: true, locale: true } }, availability: { where: { date: day } } },
    take: 1000,
  });
  const since = new Date(Date.now() - 86400000);
  const messages: { to: string; subject: string; html: string; text: string }[] = [];
  for (const d of drivers) {
    const dist = distanceMiles(d, job);
    if (dist != null && dist > d.travelRadiusMiles) continue;
    if (job.kind === "SHIFT" && !(d.availability[0] && jobFitsWindow(job.startAt, d.availability[0]))) continue;
    const recent = await db.driverJobAlert.count({ where: { driverId: d.id, createdAt: { gte: since } } });
    if (recent >= MAX_INSTANT_PER_DAY) continue;
    const created = await db.driverJobAlert.createMany({ data: [{ jobId: job.id, driverId: d.id }], skipDuplicates: true });
    if (!created.count) continue;
    const lang = (d.user.locale === "pl" ? "pl" : "en") as Lang;
    const tx = makeTx(lang);
    const { html, text } = brandedEmail({
      paragraphs: [
        tx("Hi {name},", { name: d.fullName.split(" ")[0] }),
        job.kind === "PERMANENT"
          ? tx("A new permanent role near you matches what you're looking for:")
          : tx("A new job near you matches a day you said you're available:"),
        `${jobLine(job, lang)}${dist != null ? ` · ${Math.round(dist)} ${tx("miles")}` : ""}`,
        `${job.company.companyName}`,
      ],
      cta: tx("View job"),
      url: `${siteUrl()}/jobs/${job.id}`,
    });
    messages.push({ to: d.user.email, subject: tx("New job near you: {job}", { job: `${licenceLabel(job.licenceClass)} · ${job.town ?? job.postcode}` }), html, text });
  }
  return sendEmailBatch(messages);
}

/** Daily email to drivers: other new jobs within their travel radius since the last summary. */
export async function sendJobDigestsToDrivers() {
  const now = new Date();
  const since = new Date(now.getTime() - 25 * 3600000);
  const jobs = await db.job.findMany({
    where: {
      createdAt: { gte: since },
      status: "OPEN",
      OR: [{ kind: "SHIFT", startAt: { gt: now } }, { kind: "PERMANENT", expiresAt: { gt: now } }],
      lat: { not: null },
    },
    include: { company: { select: { companyName: true } } },
    take: 500,
  });
  if (!jobs.length) return 0;
  const drivers = await db.driverProfile.findMany({
    where: { jobAlertsEnabled: true, lat: { not: null }, licenceClasses: { isEmpty: false }, user: { suspended: false } },
    include: { user: { select: { email: true, locale: true } } },
  });
  const alerted = await db.driverJobAlert.findMany({ where: { jobId: { in: jobs.map((j) => j.id) } }, select: { jobId: true, driverId: true } });
  const seen = new Set(alerted.map((a) => `${a.jobId}:${a.driverId}`));
  const messages: { to: string; subject: string; html: string; text: string }[] = [];
  const touched: string[] = [];
  for (const d of drivers) {
    const after = d.lastJobDigestAt ?? since;
    const matches = jobs
      .filter((j) => j.createdAt > after && !seen.has(`${j.id}:${d.id}`) && canDriveClass(d.licenceClasses, j.licenceClass))
      .map((j) => ({ j, dist: distanceMiles(d, j) }))
      .filter(({ dist }) => dist != null && dist <= d.travelRadiusMiles)
      .sort((a, b) => a.dist! - b.dist!)
      .slice(0, 8);
    if (!matches.length) continue;
    const lang = (d.user.locale === "pl" ? "pl" : "en") as Lang;
    const tx = makeTx(lang);
    const { html, text } = brandedEmail({
      paragraphs: [
        tx("Hi {name},", { name: d.fullName.split(" ")[0] }),
        tx("New jobs near you:"),
        ...matches.map(({ j, dist }) => `${jobLine(j, lang)} · ${Math.round(dist!)} ${tx("miles")} — ${j.company.companyName}`),
        tx("Turn these emails off any time in your profile."),
      ],
      cta: tx("See jobs near me"),
      url: `${siteUrl()}/driver`,
    });
    messages.push({ to: d.user.email, subject: tx(matches.length === 1 ? "{n} new job near you" : "{n} new jobs near you", { n: matches.length }), html, text });
    touched.push(d.id);
  }
  const sent = await sendEmailBatch(messages);
  if (touched.length) await db.driverProfile.updateMany({ where: { id: { in: touched } }, data: { lastJobDigestAt: now } });
  return sent;
}
